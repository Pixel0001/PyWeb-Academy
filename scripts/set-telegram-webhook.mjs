/**
 * Script pentru înregistrarea webhook-ului Telegram
 * 
 * Folosire:
 *   node scripts/set-telegram-webhook.mjs https://yourdomain.com
 * 
 * Exemplu:
 *   node scripts/set-telegram-webhook.mjs https://pyweb.md
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Citire .env manual
const envPath = resolve(process.cwd(), '.env')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const value = trimmed.slice(eqIdx + 1).trim()
  env[key] = value
}

const token = env.TELEGRAM_LESSONS_BOT_TOKEN
const secret = env.TELEGRAM_WEBHOOK_SECRET
const baseUrl = process.argv[2]

if (!baseUrl) {
  console.error('❌ Folosire: node scripts/set-telegram-webhook.mjs https://yourdomain.com')
  process.exit(1)
}

if (!token) {
  console.error('❌ TELEGRAM_LESSONS_BOT_TOKEN lipsește din .env')
  process.exit(1)
}

const webhookUrl = `${baseUrl}/api/telegram/webhook?secret=${secret}`
console.log(`📡 Setare webhook: ${webhookUrl}`)

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    allowed_updates: ['callback_query', 'message'],
    drop_pending_updates: true,
  }),
})

const data = await response.json()

if (data.ok) {
  console.log('✅ Webhook înregistrat cu succes!')
  console.log(`   URL: ${webhookUrl}`)
} else {
  console.error('❌ Eroare la înregistrare:', data.description)
}

// Verificare webhook curent
const infoResp = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
const info = await infoResp.json()
if (info.ok) {
  console.log('\n📋 Info webhook curent:')
  console.log(`   URL: ${info.result.url || 'nesetat'}`)
  console.log(`   Pending updates: ${info.result.pending_update_count}`)
  if (info.result.last_error_message) {
    console.log(`   Ultima eroare: ${info.result.last_error_message}`)
  }
}
