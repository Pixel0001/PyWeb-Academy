/**
 * Verifică cheia OpenAI și arată ce modele poate folosi.
 *
 *   node scripts/openai-modele.mjs
 *
 * Folosește OPENAI_API_KEY — aceeași cheie ca Mr. PyWeb. Rulează-l după ce
 * setezi cheia, ca să vezi negru pe alb ce model va fi ales pentru pitch-uri.
 *
 * Dacă vrei alt model decât cel ales automat, pune-l primul în
 * `pitch.modelePreferate` din config/leads.json.
 */

import { CONFIG } from '../lib/leads/config.js'
import { listeazaModele, alegeModel, pretModel } from '../lib/leads/pitch-openai.js'

const P = CONFIG.pitch

function linie() {
  console.log('─'.repeat(74))
}

async function main() {
  console.log('')
  linie()
  console.log('  VERIFICARE CHEIE OPENAI')
  linie()

  const cheie = process.env.OPENAI_API_KEY
  if (!cheie) {
    console.log('')
    console.log('  ✗ OPENAI_API_KEY nu e setată în acest mediu.')
    console.log('')
    console.log('    Local:    pune-o în .env.local  →  OPENAI_API_KEY=sk-...')
    console.log('    Producție: Vercel → Settings → Environment Variables')
    console.log('')
    console.log('    E aceeași cheie pe care o folosește deja Mr. PyWeb (lib/ai-grader.js).')
    console.log('    Fără ea, pitch-urile se generează din șabloane locale — gratis, dar mai seci.')
    console.log('')
    process.exit(1)
  }

  console.log(`\n  Cheie găsită: ${cheie.slice(0, 7)}…${cheie.slice(-4)}  (${cheie.length} caractere)`)

  let modele
  try {
    modele = await listeazaModele(cheie)
  } catch (err) {
    console.log('')
    console.log(`  ✗ Nu am putut citi lista de modele: ${err.message}`)
    console.log('')
    if (err.status === 401) {
      console.log('    401 = cheie invalidă sau revocată. Verific-o în platform.openai.com.')
    }
    console.log('')
    process.exit(1)
  }

  // Doar modelele de chat ne interesează
  const chat = modele
    .filter((m) => /^(gpt|o\d|chatgpt)/i.test(m))
    .filter((m) => !/audio|realtime|transcribe|tts|image|embedding|moderation|search|dall/i.test(m))
    .sort()

  console.log(`  Modele vizibile pe cont: ${modele.length} (dintre care ${chat.length} de chat)`)

  console.log('')
  linie()
  console.log('  PREFERINȚELE DIN config/leads.json')
  linie()
  console.log('')

  const disponibile = new Set(modele)
  for (const [i, m] of (P.modelePreferate || []).entries()) {
    const are = disponibile.has(m)
    const pret = pretModel(m)
    const infoPret = pret ? `${pret.intrare} $ / ${pret.iesire} $ per 1M` : 'preț necunoscut'
    console.log(`  ${i + 1}. ${are ? '✓ DISPONIBIL' : '✗ indisponibil'}  ${m.padEnd(22)} ${are ? infoPret : ''}`)
  }
  console.log(`     rezervă:        ${disponibile.has(P.modelRezerva) ? '✓' : '✗'} ${P.modelRezerva}`)

  const ales = await alegeModel(cheie)

  console.log('')
  linie()
  console.log(`  MODELUL ALES: ${ales}`)
  linie()

  if (!disponibile.has(ales)) {
    console.log('')
    console.log('  ⚠ Atenție: modelul ales NU apare în lista contului tău.')
    console.log('    Rularea va da eroare. Pune în modelePreferate unul dintre cele de mai jos.')
  } else if (!pretModel(ales)) {
    console.log('')
    console.log('  ⚠ Nu am prețul acestui model în config → costul se va raporta ca necunoscut.')
    console.log(`    Adaugă-l în config/leads.json → pitch.preturi["${ales}"] = { intrare, iesire }`)
    console.log('    (valorile sunt în dolari per 1 milion de tokeni)')
  }

  console.log('')
  linie()
  console.log('  TOATE MODELELE DE CHAT DE PE CONT')
  linie()
  console.log('')
  for (const m of chat) {
    console.log(`  ${m === ales ? '→' : ' '} ${m}`)
  }
  console.log('')
  console.log('  Ca să folosești altul, pune-l primul în pitch.modelePreferate din config/leads.json.')
  console.log('')
}

main().catch((err) => {
  console.error('\n✗ Verificarea a eșuat:', err)
  process.exit(1)
})
