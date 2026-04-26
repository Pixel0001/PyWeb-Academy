import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const BOT_TOKEN = process.env.TELEGRAM_LESSONS_BOT_TOKEN
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

const STATUS_LABELS = {
  LEAD: '🔵 Pending',
  CONTACTAT: '🟡 Contactat',
  PROGRAMAT: '🟠 Programat',
  FINALIZAT_LECTIA: '🎓 Finalizat',
  ASTEPTAM_PLATA: '⏳ Așteptăm Plata',
  PLATIT: '💰 Achitat',
  LOST_LEAD: '❌ Anulat',
}

// Statusuri finale — butoanele dispar
const FINAL_STATUSES = ['PLATIT', 'LOST_LEAD']

function buildKeyboard(contactId) {
  return [
    [
      { text: '✅ Contactat', callback_data: `c:CONTACTAT:${contactId}` },
      { text: '📅 Programat', callback_data: `c:PROGRAMAT:${contactId}` },
    ],
    [
      { text: '🎓 Finalizat', callback_data: `c:FINALIZAT_LECTIA:${contactId}` },
      { text: '⏳ Așteptăm', callback_data: `c:ASTEPTAM_PLATA:${contactId}` },
    ],
    [
      { text: '💰 Achitat', callback_data: `c:PLATIT:${contactId}` },
      { text: '❌ Anulat', callback_data: `c:LOST_LEAD:${contactId}` },
    ],
  ]
}

async function answerCallback(callbackQueryId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

async function editMessage(chatId, messageId, text, keyboard) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    }),
  })
}

export async function POST(request) {
  try {
    // Verificare secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Procesare callback query (apăsare buton)
    if (body.callback_query) {
      const { id: callbackQueryId, data, message } = body.callback_query

      // Format așteptat: c:STATUS:contactId
      if (!data?.startsWith('c:')) {
        await answerCallback(callbackQueryId, '❌ Acțiune necunoscută')
        return NextResponse.json({ ok: true })
      }

      const parts = data.split(':')
      if (parts.length !== 3) {
        await answerCallback(callbackQueryId, '❌ Date invalide')
        return NextResponse.json({ ok: true })
      }

      const [, newStatus, contactId] = parts
      const messageId = message.message_id
      const chatId = message.chat.id

      // Validare status
      if (!STATUS_LABELS[newStatus]) {
        await answerCallback(callbackQueryId, '❌ Status invalid')
        return NextResponse.json({ ok: true })
      }

      // Actualizare în baza de date
      let contact
      try {
        contact = await prisma.contactMessage.update({
          where: { id: contactId },
          data: { status: newStatus },
        })
      } catch (dbError) {
        console.error('DB update error:', dbError)
        await answerCallback(callbackQueryId, '❌ Eroare la actualizare')
        return NextResponse.json({ ok: true })
      }

      const newStatusLabel = STATUS_LABELS[newStatus]
      const isFinal = FINAL_STATUSES.includes(newStatus)
      const now = new Date().toLocaleString('ro-RO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Chisinau',
      })

      const isFromSiteForm = contact.email === 'noreply@pyweb.md'
      const emailLine = isFromSiteForm ? '🌐 Sursă: <b>Formular site</b>' : `📧 Email: ${contact.email}`

      // Mesajul actualizat cu noul status
      const updatedText = `📬 <b>CERERE LECȚIE GRATUITĂ</b>

👤 Nume: <b>${contact.name}</b>
${emailLine}
📱 Telefon: <b>${contact.phone || 'N/A'}</b>

📊 Status: ${newStatusLabel}
✏️ Actualizat: ${now}`

      // Dacă status final → butoane dispar; altfel → butoane rămân
      const keyboard = isFinal ? [] : buildKeyboard(contactId)

      await editMessage(chatId, messageId, updatedText, keyboard)
      await answerCallback(callbackQueryId, `✅ Status: ${newStatusLabel}`)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
