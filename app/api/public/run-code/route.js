import { NextResponse } from 'next/server'

// Proxy către Judge0 CE (https://api.judge0.com) — API gratuit pentru compilare C/C++
// Language IDs: https://api.judge0.com/languages
// 50 = C (GCC 9.2), 54 = C++ (GCC 9.2)

const JUDGE0_URL = 'https://api.judge0.com/submissions?wait=true&fields=stdout,stderr,compile_output,status,exit_code'

const LANGUAGE_MAP = {
  c:   50,
  cpp: 54,
}

// Rate limit simplu per IP: 10 rulări/minut
const ipCounts = new Map()
setInterval(() => ipCounts.clear(), 60_000)

export async function POST(req) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const count = (ipCounts.get(ip) || 0) + 1
  ipCounts.set(ip, count)
  if (count > 10) {
    return NextResponse.json({ error: 'Prea multe rulări — mai încearcă în 1 minut.' }, { status: 429 })
  }

  let body = {}
  try { body = await req.json() } catch {}
  const { language, code, stdin } = body

  const languageId = LANGUAGE_MAP[String(language).toLowerCase()]
  if (!languageId) {
    return NextResponse.json({ error: `Limbajul "${language}" nu e suportat pentru rulare server-side.` }, { status: 400 })
  }
  if (!code || !String(code).trim()) {
    return NextResponse.json({ error: 'Codul este gol.' }, { status: 400 })
  }
  if (String(code).length > 50_000) {
    return NextResponse.json({ error: 'Codul este prea lung (max 50 000 caractere).' }, { status: 400 })
  }

  try {
    const res = await fetch(JUDGE0_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': '', // not required for public endpoint
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: stdin || '',
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 128000,
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return NextResponse.json({ error: `Judge0 error ${res.status}: ${t.slice(0, 300)}` }, { status: 502 })
    }

    const data = await res.json()
    // data.compile_output — erori de compilare
    // data.stdout — output program
    // data.stderr — runtime stderr
    // data.status.id: 3=Accepted, 4=Wrong Answer, 5=TLE, 6=CE, 11=RE, etc.
    const compileErr = data.compile_output?.trim() || ''
    const runOut = data.stdout?.trim() || ''
    const runErr = data.stderr?.trim() || ''
    const statusId = data.status?.id ?? 0

    return NextResponse.json({
      ok: true,
      compile: { stderr: compileErr },
      run: { stdout: runOut, stderr: runErr, code: data.exit_code ?? (statusId === 3 ? 0 : 1) },
      status: data.status?.description || '',
    })
  } catch (e) {
    if (e?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Timeout — serverul de rulare a durat prea mult (>20s).' }, { status: 504 })
    }
    return NextResponse.json({ error: e?.message || 'Eroare necunoscută' }, { status: 500 })
  }
}
