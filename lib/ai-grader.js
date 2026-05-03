/**
 * AI Grader — „Mr. PyWeb", profesorul virtual de la PyWeb Academy
 *
 *  - Evaluează cod (CODING) cu un barem detaliat
 *  - Detectează dacă codul a fost generat de AI (penalty pe puncte)
 *  - Rate-limiting: per student, per IP, global (kill switch)
 *  - Tracking cost — model GPT-4o-mini (~$0.0003 per grade)
 *  - Output structurat (JSON) pentru fiabilitate
 *
 *  Buget recomandat:
 *   - 30 cereri/zi/elev → max ~$0.30/lună/elev
 *   - 100 cereri/oră/IP (anti-flood)
 *   - $1/zi GLOBAL (kill switch — config în .env)
 */

import prisma from './prisma'

// === PRICING (USD per 1M tokens, gpt-4o-mini la 2025-2026) ===
const PRICE_IN  = 0.15  / 1_000_000
const PRICE_OUT = 0.60  / 1_000_000
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

// === LIMITS (configurabile prin env) ===
const PER_STUDENT_DAILY = Number(process.env.AI_LIMIT_STUDENT_DAILY || 30)
const PER_IP_HOURLY     = Number(process.env.AI_LIMIT_IP_HOURLY || 100)
const GLOBAL_DAILY_USD  = Number(process.env.AI_BUDGET_DAILY_USD || 1)
const ENABLED           = process.env.AI_GRADING_ENABLED !== 'false'

export const AI_LIMITS = {
  perStudentDaily: PER_STUDENT_DAILY,
  perIpHourly: PER_IP_HOURLY,
  globalDailyUsd: GLOBAL_DAILY_USD,
}

// ============================================================
// RATE LIMITING
// ============================================================

/**
 * Verifică dacă studentul/IP-ul a depășit limitele.
 * @returns {Promise<{ allowed: boolean, reason?: string, used?: number, limit?: number, resetAt?: Date }>}
 */
export async function checkAiQuota({ studentId, ip }) {
  if (!ENABLED) {
    return { allowed: false, reason: 'AI_DISABLED' }
  }

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  // 1. Per student (24h)
  if (studentId) {
    const studentCount = await prisma.aiUsage.count({
      where: { studentId, createdAt: { gte: dayAgo } },
    })
    if (studentCount >= PER_STUDENT_DAILY) {
      return {
        allowed: false,
        reason: 'STUDENT_LIMIT',
        used: studentCount,
        limit: PER_STUDENT_DAILY,
        resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      }
    }
  }

  // 2. Per IP (1h) — anti-flood
  if (ip) {
    const ipCount = await prisma.aiUsage.count({
      where: { ip, createdAt: { gte: hourAgo } },
    })
    if (ipCount >= PER_IP_HOURLY) {
      return { allowed: false, reason: 'IP_LIMIT', used: ipCount, limit: PER_IP_HOURLY }
    }
  }

  // 3. Global daily budget (kill switch)
  const globalAgg = await prisma.aiUsage.aggregate({
    where: { createdAt: { gte: dayAgo } },
    _sum: { costUsd: true },
  })
  const usedUsd = globalAgg._sum.costUsd || 0
  if (usedUsd >= GLOBAL_DAILY_USD) {
    return { allowed: false, reason: 'GLOBAL_BUDGET', used: usedUsd, limit: GLOBAL_DAILY_USD }
  }

  return { allowed: true }
}

/**
 * Câte cereri AI a folosit studentul azi
 */
export async function getStudentAiUsage(studentId) {
  if (!studentId) return { used: 0, limit: PER_STUDENT_DAILY, remaining: PER_STUDENT_DAILY }
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const used = await prisma.aiUsage.count({
    where: { studentId, createdAt: { gte: dayAgo } },
  })
  return {
    used,
    limit: PER_STUDENT_DAILY,
    remaining: Math.max(0, PER_STUDENT_DAILY - used),
  }
}

// ============================================================
// OPENAI API CALL
// ============================================================

async function callOpenAI({ messages, jsonResponse = false, maxTokens = 800 }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY lipsește din .env')

  const body = {
    model: MODEL,
    messages,
    temperature: 0.3,
    max_tokens: maxTokens,
  }
  if (jsonResponse) body.response_format = { type: 'json_object' }

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!r.ok) {
    const errText = await r.text().catch(() => '')
    throw new Error(`OpenAI ${r.status}: ${errText.slice(0, 200)}`)
  }

  const d = await r.json()
  return {
    content: d.choices?.[0]?.message?.content || '',
    tokensIn: d.usage?.prompt_tokens || 0,
    tokensOut: d.usage?.completion_tokens || 0,
  }
}

function calcCost(tokensIn, tokensOut) {
  return tokensIn * PRICE_IN + tokensOut * PRICE_OUT
}

// ============================================================
// GRADING — verifică un cod cu barem
// ============================================================

const SYSTEM_PROMPT = `Ești "Mr. PyWeb", profesorul de programare de la PyWeb Academy.
Elevii tăi au 9-14 ani, învață Python, JavaScript, HTML și CSS.

REGULI STRICTE:
1. Vorbești ROMÂNEȘTE, simplu, prietenos, ca pentru un copil de 10 ani.
2. Folosești emoji moderat (🎯 ✅ ❌ 💡 🐍 ⚡).
3. NU folosești termeni tehnici complicați fără să-i explici.
4. Când e greșit, explici EXACT ce e greșit și CUM să corecteze, cu exemple.
5. Când e corect, spui de ce e bună soluția lui.
6. Lauzi efortul, nu doar rezultatul.
7. Răspunzi DOAR în formatul JSON cerut — niciun text extra.

NU accepta cod care:
- Folosește librării avansate când problema cere ceva basic (ex: numpy pentru o sumă simplă)
- E prea scurt sau pare copy-paste fără înțelegere
- Folosește sintaxă greșită pentru limbajul cerut`

/**
 * Evaluează un cod cu un barem 0-100.
 * @param {Object} opts
 * @param {string} opts.problemTitle
 * @param {string} opts.problemDescription
 * @param {string} opts.expectedSolution - soluția corectă (referință)
 * @param {string} opts.studentCode - codul elevului
 * @param {string} opts.language - python|javascript|html|css
 * @param {string} [opts.studentOutput] - output produs de execuția codului
 * @returns {Promise<{ grade: number, reasoning: string, rubric: object, tokensIn, tokensOut, costUsd }>}
 */
export async function gradeCode({
  problemTitle,
  problemDescription,
  expectedSolution,
  studentCode,
  language = 'python',
  studentOutput,
}) {
  const userPrompt = `PROBLEMĂ: ${problemTitle}
${problemDescription}

LIMBAJ: ${language}

SOLUȚIE DE REFERINȚĂ (nu o arăta elevului):
\`\`\`${language}
${expectedSolution || '(fără referință)'}
\`\`\`

CODUL ELEVULUI:
\`\`\`${language}
${studentCode || '(gol)'}
\`\`\`

${studentOutput ? `OUTPUT-UL CODULUI ELEVULUI:\n${studentOutput}\n` : ''}

Evaluează codul cu un barem și răspunde STRICT în JSON:
{
  "grade": <0-100, nota finală>,
  "rubric": {
    "correctness": <0-100, rezolvă corect cerința?>,
    "style": <0-100, e curat, lizibil?>,
    "efficiency": <0-100, soluția e rezonabilă?>
  },
  "reasoning": "<2-4 propoziții PRIETENOASE pentru elev: ce a făcut bine, ce trebuie corectat, exemplu concret. Markdown permis (cod cu \`\`\`). Maxim 400 caractere.>",
  "isCorrect": <true dacă grade >= 60>
}

Praguri: 100=perfect, 80=mici imperfecțiuni, 60=funcționează dar are probleme, 40=parțial corect, 20=încercare bună dar greșit, 0=gol/total greșit.`

  const { content, tokensIn, tokensOut } = await callOpenAI({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    jsonResponse: true,
    maxTokens: 600,
  })

  let parsed
  try {
    parsed = JSON.parse(content)
  } catch {
    parsed = { grade: 0, reasoning: 'Eroare la parsare răspuns AI. Te rog reîncearcă.', rubric: {} }
  }

  const grade = Math.max(0, Math.min(100, Math.round(Number(parsed.grade) || 0)))
  return {
    grade,
    reasoning: String(parsed.reasoning || '').slice(0, 800),
    rubric: parsed.rubric || {},
    isCorrect: grade >= 60,
    tokensIn,
    tokensOut,
    costUsd: calcCost(tokensIn, tokensOut),
  }
}

// ============================================================
// AI DETECTION — verifică dacă codul a fost generat de ChatGPT/Copilot
// ============================================================

const AI_DETECT_PROMPT = `Ești expert în detectarea codului generat de AI (ChatGPT, Copilot, Gemini).

Analizează codul de mai jos. Indicii de cod AI:
- Comentarii excesive în limbaj natural perfect ("# Iterăm prin lista de elemente")
- Variabile cu nume foarte descriptive (vs. simple/inconsistente — cum scriu copiii)
- Stil prea „curat" pentru un elev de 10-14 ani
- Folosește features avansate la o problemă simplă
- Pattern-uri tipice ChatGPT (try/except generic, docstrings)

Cod elev (limbaj: {{LANG}}):
\`\`\`{{LANG}}
{{CODE}}
\`\`\`

Răspunde STRICT în JSON:
{
  "score": <0-100, cât de probabil e AI>,
  "isAi": <true dacă score >= 70>,
  "reason": "<1 propoziție scurtă, română>"
}`

export async function detectAiCode({ code, language = 'python' }) {
  if (!code || code.length < 20) {
    return { score: 0, isAi: false, reason: 'Cod prea scurt', tokensIn: 0, tokensOut: 0, costUsd: 0 }
  }
  const prompt = AI_DETECT_PROMPT.replace(/\{\{LANG\}\}/g, language).replace('{{CODE}}', code.slice(0, 2000))
  const { content, tokensIn, tokensOut } = await callOpenAI({
    messages: [{ role: 'user', content: prompt }],
    jsonResponse: true,
    maxTokens: 150,
  })
  let parsed
  try { parsed = JSON.parse(content) } catch { parsed = { score: 0, isAi: false, reason: 'parse error' } }
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)))
  return {
    score,
    isAi: !!parsed.isAi || score >= 70,
    reason: String(parsed.reason || '').slice(0, 200),
    tokensIn,
    tokensOut,
    costUsd: calcCost(tokensIn, tokensOut),
  }
}

// ============================================================
// USAGE LOGGING
// ============================================================

export async function logAiUsage({ studentId, ip, endpoint, tokensIn, tokensOut, success = true, errorMsg = null }) {
  try {
    await prisma.aiUsage.create({
      data: {
        studentId: studentId || null,
        ip: ip || null,
        endpoint,
        tokensIn: tokensIn || 0,
        tokensOut: tokensOut || 0,
        costUsd: calcCost(tokensIn || 0, tokensOut || 0),
        success,
        errorMsg: errorMsg ? String(errorMsg).slice(0, 500) : null,
      },
    })
  } catch (e) {
    console.error('[ai-grader] logAiUsage failed:', e)
  }
}

// ============================================================
// CHAT — Mr. PyWeb răspunde la întrebări (clarificări)
// ============================================================

const CHAT_SYSTEM_PROMPT = `Ești "Mr. PyWeb", profesorul AI de la PyWeb Academy.
Elevul (9-14 ani) îți cere ajutor cu o problemă de programare.

REGULI CRITICE:
1. NU DA NICIODATĂ SOLUȚIA COMPLETĂ. Dă doar indicii, întrebări care îl ghidează, exemple PE ALT EXEMPLU (nu pe problema lui).
2. Dacă elevul cere "dă-mi codul" / "rezolvă tu" / "scrie-mi soluția" → REFUZĂ politicos: "Eu te ghidez, dar codul îl scrii tu! 🐍 Hai să încercăm împreună..."
3. Vorbești ROMÂNEȘTE, simplu, ca pentru un copil de 10 ani.
4. Folosești emoji moderat (💡 🎯 🐍 ✨).
5. Răspunsurile sunt SCURTE — maxim 4-5 propoziții.
6. Markdown permis (\`cod\` inline, **bold**), dar fără blocuri lungi de cod.
7. Dacă elevul are întrebare offtopic (jocuri, școală etc.) → întoarce conversația la programare politicos.
8. Dacă codul lui are o eroare clară, arată-i UNDE pe linia X, dar nu scrie corect direct.`

/**
 * Răspunde la o întrebare a elevului despre o problemă.
 * @param {Object} opts
 * @param {string} opts.problemTitle
 * @param {string} opts.problemDescription
 * @param {string} opts.language
 * @param {string} opts.studentCode - codul curent al elevului (poate fi gol)
 * @param {Array<{role:'user'|'assistant', content:string}>} opts.history - mesaje anterioare
 * @param {string} opts.question - întrebarea curentă
 */
export async function askMrPyWeb({
  problemTitle,
  problemDescription,
  language = 'python',
  studentCode = '',
  history = [],
  question,
}) {
  const contextMsg = `CONTEXT PROBLEMĂ (pentru tine, profesor — nu o repeta integral elevului):
Titlu: ${problemTitle}
Cerință: ${problemDescription}
Limbaj: ${language}

CODUL CURENT AL ELEVULUI:
\`\`\`${language}
${studentCode || '(gol — încă n-a scris nimic)'}
\`\`\``

  const messages = [
    { role: 'system', content: CHAT_SYSTEM_PROMPT },
    { role: 'system', content: contextMsg },
    // istoric — limităm la ultimele 6 mesaje ca să nu balonăm tokens
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ]

  const { content, tokensIn, tokensOut } = await callOpenAI({
    messages,
    jsonResponse: false,
    maxTokens: 250, // răspunsuri scurte
  })

  return {
    answer: content.trim(),
    tokensIn,
    tokensOut,
    costUsd: calcCost(tokensIn, tokensOut),
  }
}
