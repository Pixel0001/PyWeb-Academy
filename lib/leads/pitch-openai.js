/**
 * Stratul de comunicare cu OpenAI pentru pitch-uri.
 *
 * Folosește OPENAI_API_KEY — exact aceeași cheie pe care o folosește deja
 * Mr. PyWeb (lib/ai-grader.js). Nu e nevoie de nicio cheie nouă.
 *
 * Două lucruri fac fișierul ăsta mai deștept decât un simplu fetch:
 *
 *  1. ALEGEREA MODELULUI. Nu presupunem că un anumit model există pe contul
 *     tău. La prima rulare întrebăm /v1/models și luăm primul model din
 *     `modelePreferate` pe care cheia chiar îl are. Așa nu crapă rularea
 *     pentru că am scris în cod numele unui model la care nu ai acces.
 *
 *  2. ADAPTAREA PARAMETRILOR. Modelele OpenAI nu acceptă toate aceiași
 *     parametri — unele mai noi refuză `temperature` sau cer
 *     `max_completion_tokens` în loc de `max_tokens`. Prindem eroarea 400,
 *     ne adaptăm și reîncercăm, apoi ținem minte forma corectă.
 */

import { CONFIG } from './config.js'

const P = CONFIG.pitch
const URL_CHAT = 'https://api.openai.com/v1/chat/completions'
const URL_MODELE = 'https://api.openai.com/v1/models'

// Ce am aflat despre model, ținut minte cât trăiește procesul.
let modelAles = null
let formaCerere = null

/**
 * Modelele „care gândesc" (gpt-5, o1, o3, o4...) au alte reguli: nu acceptă
 * max_tokens și nici temperature, iar tokenii de „gândire" se scad din același
 * buget ca textul. Fără grijă, își consumă tot bugetul gândind și întorc un
 * răspuns gol — exact „răspuns neparsabil" din jurnal.
 */
export function esteModelCareGandeste(model) {
  return /^(gpt-5|o[1-9])/i.test(String(model || ''))
}

/** Forma corectă a cererii pentru model, știută dinainte — nu învățată din erori. */
function formaPentru(model) {
  const gandeste = esteModelCareGandeste(model)
  return {
    tokeni: gandeste ? 'max_completion_tokens' : 'max_tokens',
    temperatura: !gandeste,
    // Pentru o frază de deschidere nu trebuie gândire lungă: rapid și ieftin
    efort: gandeste ? 'minimal' : null,
  }
}

/** Resetează ce am memorat — folosit de scripturile de test. */
export function resetareStareModel() {
  modelAles = null
  formaCerere = null
}

/**
 * Lista modelelor de chat la care are acces cheia.
 * @returns {Promise<string[]>}
 */
export async function listeazaModele(apiKey = process.env.OPENAI_API_KEY) {
  const raspuns = await fetch(URL_MODELE, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!raspuns.ok) {
    const detalii = await raspuns.text().catch(() => '')
    const eroare = new Error(`OpenAI /models ${raspuns.status}: ${detalii.slice(0, 200)}`)
    eroare.status = raspuns.status
    throw eroare
  }

  const date = await raspuns.json()
  return (date.data || []).map((m) => m.id)
}

/**
 * Alege cel mai bun model disponibil, o singură dată per proces.
 *
 * Dacă lista de modele nu se poate citi (rețea, cheie fără drepturi pe
 * endpointul ăsta), mergem mai departe cu primul preferat — o eroare la
 * generare e oricum prinsă și raportată.
 */
export async function alegeModel(apiKey = process.env.OPENAI_API_KEY) {
  if (modelAles) return modelAles

  const preferate = P.modelePreferate?.length ? P.modelePreferate : [P.modelRezerva]

  try {
    const disponibile = new Set(await listeazaModele(apiKey))

    modelAles =
      preferate.find((m) => disponibile.has(m)) ||
      (disponibile.has(P.modelRezerva) ? P.modelRezerva : null) ||
      preferate[0]
  } catch {
    // Nu putem întreba — mergem pe prima preferință.
    modelAles = preferate[0]
  }

  return modelAles
}

/** Prețul unui model, din config. `null` dacă nu-l știm. */
export function pretModel(model) {
  return P.preturi?.[model] || null
}

/**
 * Calculează costul unei cereri. Întoarce `null` dacă nu știm prețul
 * modelului — mai bine „necunoscut" decât o cifră inventată.
 */
export function calculeazaCost(model, tokeniIntrare, tokeniIesire) {
  const pret = pretModel(model)
  if (!pret) return null
  return (tokeniIntrare * pret.intrare + tokeniIesire * pret.iesire) / 1_000_000
}

/** Construiește corpul cererii, în forma pe care o acceptă modelul curent. */
function construiesteCorp(model, instructiuni, continut, maxTokeni) {
  const corp = {
    model,
    messages: [
      { role: 'system', content: instructiuni },
      { role: 'user', content: continut },
    ],
  }

  // La modelele care gândesc, bugetul acoperă și gândirea — îi lăsăm loc
  corp[formaCerere.tokeni] = esteModelCareGandeste(model) ? Math.min(maxTokeni * 4, 32000) : maxTokeni
  if (formaCerere.temperatura && typeof P.temperatura === 'number') {
    corp.temperature = P.temperatura
  }
  if (formaCerere.efort) corp.reasoning_effort = formaCerere.efort

  return corp
}

/**
 * Dacă modelul s-a plâns de un parametru, ne adaptăm și spunem să se reîncerce.
 * @returns {boolean} true dacă am schimbat ceva și merită reîncercat
 */
function adapteazaLaEroare(mesaj) {
  const text = String(mesaj || '').toLowerCase()
  let schimbat = false

  // „Unsupported parameter: 'max_tokens' ... use 'max_completion_tokens'"
  if (formaCerere.tokeni === 'max_tokens' && text.includes('max_completion_tokens')) {
    formaCerere.tokeni = 'max_completion_tokens'
    schimbat = true
  }

  // „Unsupported value: 'temperature' does not support 0.6"
  if (formaCerere.temperatura && text.includes('temperature')) {
    formaCerere.temperatura = false
    schimbat = true
  }

  // „Unsupported value: 'reasoning_effort'..." → încercăm „low", apoi fără
  if (formaCerere.efort && text.includes('reasoning')) {
    formaCerere.efort = formaCerere.efort === 'minimal' ? 'low' : null
    schimbat = true
  }

  return schimbat
}

/**
 * Trimite un lot la OpenAI.
 *
 * @returns {Promise<{ text: string, cost: number|null, model: string, tokeni: object }>}
 */
export async function cereOpenAI({ instructiuni, continut, maxTokeni = 4000 }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY lipsește din variabilele de mediu')

  const model = await alegeModel(apiKey)
  if (!formaCerere) formaCerere = formaPentru(model)

  // O încercare normală, plus câte una după fiecare parametru refuzat.
  for (let incercare = 0; incercare < 4; incercare++) {
    const raspuns = await fetch(URL_CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(construiesteCorp(model, instructiuni, continut, maxTokeni)),
    })

    if (raspuns.ok) {
      const date = await raspuns.json()
      const tokeniIntrare = date.usage?.prompt_tokens || 0
      const tokeniIesire = date.usage?.completion_tokens || 0

      const alegere = date.choices?.[0]
      // Răspuns gol pentru că s-a terminat bugetul — spunem clar, nu „neparsabil"
      if (!alegere?.message?.content && alegere?.finish_reason === 'length') {
        throw new Error(`OpenAI (${model}): bugetul de tokeni s-a terminat înainte de răspuns`)
      }

      return {
        text: alegere?.message?.content || '',
        cost: calculeazaCost(model, tokeniIntrare, tokeniIesire),
        model,
        tokeni: { intrare: tokeniIntrare, iesire: tokeniIesire },
      }
    }

    const detalii = await raspuns.text().catch(() => '')

    // Modelul refuză un parametru → ne adaptăm o dată și reîncercăm.
    if (raspuns.status === 400 && adapteazaLaEroare(detalii)) {
      continue
    }

    const eroare = new Error(`OpenAI ${raspuns.status} (${model}): ${detalii.slice(0, 250)}`)
    eroare.status = raspuns.status
    throw eroare
  }

  throw new Error(`OpenAI: cererea a eșuat pentru modelul ${model}`)
}
