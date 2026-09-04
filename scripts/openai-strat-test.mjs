/**
 * Test pentru stratul OpenAI (lib/leads/pitch-openai.js).
 *
 * Nu atinge internetul: înlocuiește `fetch` cu un server fals, ca să verifice
 * exact lucrurile pe care nu le pot proba fără cheie —
 *   - alegerea modelului din ce are contul;
 *   - adaptarea la modele care refuză `max_tokens` sau `temperature`;
 *   - raportarea costului ca „necunoscut" pentru modele fără preț în config.
 *
 *   node scripts/openai-strat-test.mjs
 */

import './_env.mjs'
import {
  alegeModel,
  cereOpenAI,
  calculeazaCost,
  resetareStareModel,
} from '../lib/leads/pitch-openai.js'

process.env.OPENAI_API_KEY = 'sk-test-fals'

let treceri = 0
let caderi = 0

function verifica(conditie, descriere, detaliu = '') {
  if (conditie) {
    treceri++
    console.log(`  ✓  ${descriere}`)
  } else {
    caderi++
    console.log(`  ✗ TEST PICAT  ${descriere}`)
    if (detaliu) console.log(`              ${detaliu}`)
  }
}

/** Server fals: `modele` = ce raportează /v1/models, `refuza` = ce respinge la chat. */
function fetchFals({ modele = [], refuza = [] } = {}) {
  const cereriVazute = []

  global.fetch = async (url, optiuni = {}) => {
    if (String(url).includes('/v1/models')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: modele.map((id) => ({ id })) }),
      }
    }

    const corp = JSON.parse(optiuni.body)
    cereriVazute.push(corp)

    // Modelul se plânge de un parametru pe care nu-l acceptă?
    for (const problema of refuza) {
      if (problema === 'max_tokens' && 'max_tokens' in corp) {
        return {
          ok: false,
          status: 400,
          text: async () =>
            "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.",
        }
      }
      if (problema === 'temperature' && 'temperature' in corp) {
        return {
          ok: false,
          status: 400,
          text: async () => "Unsupported value: 'temperature' does not support 0.6 with this model.",
        }
      }
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '[{"id":"A","pitch":"Bună ziua, test."}]' } }],
        usage: { prompt_tokens: 1000, completion_tokens: 500 },
      }),
    }
  }

  return cereriVazute
}

console.log('')
console.log('─'.repeat(74))
console.log('  TEST STRAT OPENAI (cu fetch simulat)')
console.log('─'.repeat(74))
console.log('')

// ── 1. Alegerea modelului ───────────────────────────────────────────
console.log('  ALEGEREA MODELULUI')

resetareStareModel()
fetchFals({ modele: ['gpt-4o', 'gpt-4o-mini', 'whisper-1'] })
let ales = await alegeModel()
verifica(ales === 'gpt-4o', `alege gpt-4o când gpt-5 și gpt-4.1 lipsesc → ${ales}`)

resetareStareModel()
fetchFals({ modele: ['gpt-4o', 'gpt-4.1', 'gpt-4o-mini'] })
ales = await alegeModel()
verifica(ales === 'gpt-4.1', `preferă gpt-4.1 în fața lui gpt-4o → ${ales}`)

resetareStareModel()
fetchFals({ modele: ['gpt-5', 'gpt-4.1', 'gpt-4o'] })
ales = await alegeModel()
verifica(ales === 'gpt-5', `ia gpt-5 când există → ${ales}`)

resetareStareModel()
fetchFals({ modele: ['gpt-4o-mini'] })
ales = await alegeModel()
verifica(ales === 'gpt-4o-mini', `cade pe rezervă când n-are niciun preferat → ${ales}`)

// Dacă /v1/models nu răspunde, mergem pe prima preferință, nu crăpăm.
resetareStareModel()
global.fetch = async () => ({ ok: false, status: 403, text: async () => 'fără acces' })
ales = await alegeModel()
verifica(ales === 'gpt-5', `merge pe prima preferință dacă /v1/models pică → ${ales}`)

// Alegerea se ține minte (un singur apel la /v1/models per proces)
resetareStareModel()
let apeluriModele = 0
const modeleFals = ['gpt-4o']
global.fetch = async (url, optiuni) => {
  if (String(url).includes('/v1/models')) {
    apeluriModele++
    return { ok: true, status: 200, json: async () => ({ data: modeleFals.map((id) => ({ id })) }) }
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: '[]' } }], usage: {} }),
  }
}
await alegeModel()
await alegeModel()
await alegeModel()
verifica(apeluriModele === 1, `întreabă /v1/models o singură dată (${apeluriModele} apel)`)

// ── 2. Adaptarea la parametri ───────────────────────────────────────
console.log('')
console.log('  ADAPTAREA LA MODELE PRETENȚIOASE')

resetareStareModel()
let cereri = fetchFals({ modele: ['gpt-4o'], refuza: ['max_tokens'] })
let rezultat = await cereOpenAI({ instructiuni: 'test', continut: 'test' })
verifica(
  cereri.length === 2 && 'max_completion_tokens' in cereri[1] && !('max_tokens' in cereri[1]),
  'trece pe max_completion_tokens când modelul refuză max_tokens'
)
verifica(rezultat.text.includes('Bună ziua'), 'răspunsul ajunge întreg după adaptare')

resetareStareModel()
cereri = fetchFals({ modele: ['gpt-4o'], refuza: ['temperature'] })
await cereOpenAI({ instructiuni: 'test', continut: 'test' })
verifica(
  cereri.length === 2 && !('temperature' in cereri[1]),
  'renunță la temperature când modelul o refuză'
)

// Adaptarea se ține minte — a doua cerere pleacă deja corectă.
cereri.length = 0
await cereOpenAI({ instructiuni: 'test', continut: 'test' })
verifica(
  cereri.length === 1 && !('temperature' in cereri[0]),
  'ține minte adaptarea (a doua cerere nu mai greșește)'
)

// ── 3. Costul ───────────────────────────────────────────────────────
console.log('')
console.log('  COSTUL')

const costCunoscut = calculeazaCost('gpt-4o', 1_000_000, 1_000_000)
verifica(costCunoscut === 12.5, `gpt-4o: 1M in + 1M out = 12,50 $ → ${costCunoscut}`)

const costMini = calculeazaCost('gpt-4o-mini', 1_000_000, 1_000_000)
verifica(Math.abs(costMini - 0.75) < 0.001, `gpt-4o-mini: 0,75 $ → ${costMini}`)

const costNecunoscut = calculeazaCost('model-inventat-xyz', 1000, 500)
verifica(
  costNecunoscut === null,
  'model fără preț în config → cost null (nu o cifră inventată)'
)

resetareStareModel()
fetchFals({ modele: ['gpt-5'] })
rezultat = await cereOpenAI({ instructiuni: 'test', continut: 'test' })
verifica(
  rezultat.cost === null && rezultat.model === 'gpt-5',
  `gpt-5 n-are preț în config → cost raportat ca necunoscut (${rezultat.cost})`
)

// ── 4. Erorile definitive ───────────────────────────────────────────
console.log('')
console.log('  ERORI')

resetareStareModel()
global.fetch = async (url) => {
  if (String(url).includes('/v1/models')) {
    return { ok: true, status: 200, json: async () => ({ data: [{ id: 'gpt-4o' }] }) }
  }
  return { ok: false, status: 401, text: async () => 'Incorrect API key provided' }
}
let aAruncat = false
let mesaj = ''
try {
  await cereOpenAI({ instructiuni: 'test', continut: 'test' })
} catch (err) {
  aAruncat = true
  mesaj = err.message
}
verifica(aAruncat && mesaj.includes('401'), `401 aruncă eroare clară → ${mesaj.slice(0, 60)}`)

console.log('')
console.log('─'.repeat(74))
console.log(`  REZULTAT: ${treceri} trecute, ${caderi} picate`)
console.log('─'.repeat(74))
console.log('')

process.exit(caderi > 0 ? 1 : 0)
