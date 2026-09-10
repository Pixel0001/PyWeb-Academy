/**
 * Gestionarea webhook-ului Telegram, din panou.
 *
 *   GET  — ce webhook are botul acum, câte mesaje sunt în așteptare, ce erori
 *   POST — înregistrează webhook-ul pe domeniul curent
 *
 * Fără webhook, botul nu primește nimic: butoanele din notificări nu fac
 * nimic, iar conectarea conturilor prin /start nu funcționează. Tokenul nu
 * părăsește serverul — nu trebuie copiat nicăieri.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CALE_WEBHOOK = '/api/telegram/webhook'

function token() {
  return process.env.TELEGRAM_LESSONS_BOT_TOKEN
}

/** Adresa publică a site-ului, de unde Telegram va livra mesajele. */
function bazaPublica(request) {
  const configurat = process.env.NEXT_PUBLIC_APP_URL
  if (configurat) return configurat.replace(/\/+$/, '')

  // Rezervă: gazda din cererea curentă (Vercel o trimite corect).
  const gazda = request.headers.get('host')
  return gazda ? `https://${gazda}` : null
}

export async function GET(request) {
  try {
    await requireAdmin()

    if (!token()) {
      return NextResponse.json({ error: 'Lipsește TELEGRAM_LESSONS_BOT_TOKEN' }, { status: 400 })
    }

    const [infoWebhook, infoBot] = await Promise.all([
      fetch(`https://api.telegram.org/bot${token()}/getWebhookInfo`).then((r) => r.json()),
      fetch(`https://api.telegram.org/bot${token()}/getMe`).then((r) => r.json()),
    ])

    const w = infoWebhook?.result || {}
    const asteptat = `${bazaPublica(request)}${CALE_WEBHOOK}`

    return NextResponse.json({
      bot: infoBot?.result?.username || null,
      urlCurent: w.url || null,
      urlAsteptat: asteptat,
      // Comparăm fără secret: URL-ul salvat îl conține, cel așteptat nu.
      esteSetat: Boolean(w.url && w.url.startsWith(asteptat)),
      mesajeInAsteptare: w.pending_update_count ?? 0,
      ultimaEroare: w.last_error_message || null,
      ultimaEroareLa: w.last_error_date ? new Date(w.last_error_date * 1000) : null,
      areSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Eroare' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()

    if (!token()) {
      return NextResponse.json({ error: 'Lipsește TELEGRAM_LESSONS_BOT_TOKEN' }, { status: 400 })
    }

    const baza = bazaPublica(request)
    if (!baza || baza.includes('localhost')) {
      return NextResponse.json(
        {
          error:
            'Telegram nu poate livra pe localhost. Setează webhook-ul din producție, sau pune NEXT_PUBLIC_APP_URL pe adresa publică.',
        },
        { status: 400 }
      )
    }

    // Secretul din query — webhook-ul îl verifică la fiecare cerere, ca nimeni
    // altcineva să nu-i poată trimite mesaje false botului.
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    let url = `${baza}${CALE_WEBHOOK}`
    if (secret) url += `?secret=${encodeURIComponent(secret)}`

    const r = await fetch(`https://api.telegram.org/bot${token()}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false,
      }),
    })
    const d = await r.json()

    if (!d?.ok) {
      return NextResponse.json(
        { error: `Telegram a refuzat: ${d?.description || 'motiv necunoscut'}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      url: `${baza}${CALE_WEBHOOK}`,
      cuSecret: Boolean(secret),
      mesaj: d.description || 'Webhook înregistrat',
    })
  } catch (error) {
    if (['Unauthorized', 'Forbidden'].includes(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('Eroare la setarea webhook-ului:', error)
    return NextResponse.json({ error: error.message || 'Eroare' }, { status: 500 })
  }
}
