import { NextResponse } from 'next/server'

// Proxy către Piston API (https://emkc.org/api/v2/piston)
// Rulează cod C, C++, Python, JavaScript, etc. pe servere externe gratuite.
// Folosit de CodeRunner pentru limbaje care nu pot fi rulate în browser (C/C++).

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute'

// Versiunile cele mai stabile din Piston
const LANGUAGE_MAP = {
  cpp: { language: 'c++', version: '10.2.0' },
  c:   { language: 'c',   version: '10.2.0' },
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

  const mapping = LANGUAGE_MAP[String(language).toLowerCase()]
  if (!mapping) {
    return NextResponse.json({ error: `Limbajul "${language}" nu e suportat pentru rulare server-side.` }, { status: 400 })
  }

  if (!code || !String(code).trim()) {
    return NextResponse.json({ error: 'Codul este gol.' }, { status: 400 })
  }
  if (String(code).length > 50_000) {
    return NextResponse.json({ error: 'Codul este prea lung (max 50 000 caractere).' }, { status: 400 })
  }

  try {
    const pistonRes = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: mapping.language,
        version: mapping.version,
        files: [{ name: language === 'c' ? 'main.c' : 'main.cpp', content: code }],
        stdin: stdin || '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!pistonRes.ok) {
      const t = await pistonRes.text().catch(() => '')
      return NextResponse.json({ error: `Piston error ${pistonRes.status}: ${t.slice(0, 200)}` }, { status: 502 })
    }

    const data = await pistonRes.json()
    // data.compile: { stdout, stderr, code, signal }
    // data.run:     { stdout, stderr, code, signal }
    const compileErr = data.compile?.stderr || ''
    const compileOut = data.compile?.stdout || ''
    const runOut = data.run?.stdout || ''
    const runErr = data.run?.stderr || ''
    const runCode = data.run?.code ?? null

    return NextResponse.json({
      ok: true,
      compile: { stdout: compileOut, stderr: compileErr },
      run: { stdout: runOut, stderr: runErr, code: runCode },
    })
  } catch (e) {
    if (e?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Timeout — serverul de rulare a durat prea mult (>20s).' }, { status: 504 })
    }
    return NextResponse.json({ error: e?.message || 'Eroare necunoscută' }, { status: 500 })
  }
}
