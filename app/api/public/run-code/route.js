import { NextResponse } from 'next/server'

// Proxy către Piston API (https://emkc.org/api/v2/piston) — open-source, gratuit, fără API key
// Suportă: C, C++, C#, Java, etc.
// Documentație: https://piston.readthedocs.io/

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute'

// Mapare limbaj intern → [piston_language, piston_version]
const LANGUAGE_MAP = {
  c:      ['c',      '10.2.0'],
  cpp:    ['c++',    '10.2.0'],
  'c++':  ['c++',    '10.2.0'],
  csharp: ['csharp', '6.12.0'],
  'c#':   ['csharp', '6.12.0'],
  cs:     ['csharp', '6.12.0'],
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

  const langEntry = LANGUAGE_MAP[String(language).toLowerCase()]
  if (!langEntry) {
    return NextResponse.json({ error: `Limbajul "${language}" nu e suportat pentru rulare server-side.` }, { status: 400 })
  }
  if (!code || !String(code).trim()) {
    return NextResponse.json({ error: 'Codul este gol.' }, { status: 400 })
  }
  if (String(code).length > 50_000) {
    return NextResponse.json({ error: 'Codul este prea lung (max 50 000 caractere).' }, { status: 400 })
  }

  const [pistonLang, pistonVersion] = langEntry

  try {
    const res = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: pistonLang,
        version: pistonVersion,
        files: [{ name: 'main', content: code }],
        stdin: stdin || '',
        args: [],
        compile_timeout: 10,
        run_timeout: 10,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
      signal: AbortSignal.timeout(25_000),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return NextResponse.json({ error: `Piston error ${res.status}: ${t.slice(0, 300)}` }, { status: 502 })
    }

    const data = await res.json()
    // data.compile: { stdout, stderr, code, signal }
    // data.run:     { stdout, stderr, code, signal }
    const compileErr = data.compile?.stderr?.trim() || data.compile?.stdout?.trim() || ''
    const runOut     = data.run?.stdout?.trim() || ''
    const runErr     = data.run?.stderr?.trim() || ''
    const exitCode   = data.run?.code ?? 0

    // Dacă a eșuat compilarea, returnăm eroarea
    if (data.compile && data.compile.code !== 0 && compileErr) {
      return NextResponse.json({
        ok: true,
        compile: { stderr: compileErr },
        run: { stdout: '', stderr: '', code: 1 },
        status: 'Compilation Error',
      })
    }

    return NextResponse.json({
      ok: true,
      compile: { stderr: compileErr },
      run: { stdout: runOut, stderr: runErr, code: exitCode },
      status: exitCode === 0 ? 'Accepted' : 'Runtime Error',
    })
  } catch (e) {
    if (e?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Timeout — serverul de rulare a durat prea mult (>25s).' }, { status: 504 })
    }
    return NextResponse.json({ error: e?.message || 'Eroare necunoscută' }, { status: 500 })
  }
}
