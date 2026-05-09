'use client'

/**
 * CodeRunner — playground pentru rularea codului în browser.
 *  - Python  → Pyodide în Web Worker izolat (timeout 10s — ciclu infinit = oprit safe)
 *  - JavaScript → Web Worker izolat (timeout 5s)
 *  - HTML/CSS → iframe sandbox cu preview live
 *
 * Cost server: $0 (totul rulează în browser-ul elevului).
 * Mobile-friendly (Chrome Android, Safari iOS 14+).
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { PlayIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline'

const PYODIDE_VERSION = '0.26.4'
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

// ── Pyodide Web Worker ────────────────────────────────────────────────────────
// Rulăm Pyodide într-un Worker separat — dacă apare un ciclu infinit,
// terminate() îl omoară fără să blocheze / crasheze tab-ul principal.
const PYODIDE_WORKER_SRC = `
importScripts('https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js')

let py = null

async function initPy() {
  if (py) return py
  py = await loadPyodide({ indexURL: '${PYODIDE_CDN}' })
  return py
}

self.onmessage = async (e) => {
  const { code } = e.data
  const logs = []
  try {
    const pyodide = await initPy()

    pyodide.setStdout({ batched: (s) => {
      logs.push(s)
      self.postMessage({ type: 'stdout', line: s })
    }})
    pyodide.setStderr({ batched: (s) => {
      logs.push(s)
      self.postMessage({ type: 'stdout', line: s })
    }})

    // input() — citește din coada stdin trimisă de UI
    const stdinQueue = (e.data.stdin || []).slice()
    pyodide.globals.set('input', (msg) => {
      const prompt = msg ? '[' + msg + '] ' : ''
      if (stdinQueue.length === 0) {
        self.postMessage({ type: 'stdout', line: prompt + '\n' })
        throw new Error('EOFError: Nu ai introdus destule valori în câmpul Stdin.')
      }
      const val = stdinQueue.shift()
      self.postMessage({ type: 'stdout', line: prompt + val + '\n' })
      return val
    })

    await pyodide.runPythonAsync(code || '')
    self.postMessage({ type: 'done', ok: true, output: logs.join('') })
  } catch (err) {
    self.postMessage({ type: 'done', ok: false, output: logs.join(''), error: String(err?.message || err) })
  }
}
`

let pyWorkerUrl = null
function getPyWorkerUrl() {
  if (pyWorkerUrl) return pyWorkerUrl
  const blob = new Blob([PYODIDE_WORKER_SRC], { type: 'application/javascript' })
  pyWorkerUrl = URL.createObjectURL(blob)
  return pyWorkerUrl
}

// ── JS Web Worker ─────────────────────────────────────────────────────────────
const JS_WORKER_SRC = `
self.onmessage = async (e) => {
  const { code } = e.data
  const logs = []
  const _push = (...args) => logs.push(args.map(a => {
    if (a === null) return 'null'
    if (a === undefined) return 'undefined'
    if (typeof a === 'object') { try { return JSON.stringify(a) } catch { return String(a) } }
    return String(a)
  }).join(' '))
  const console = { log: _push, error: _push, warn: _push, info: _push }
  const prompt = (msg) => { _push('[prompt: ' + (msg||'') + ']'); return '' }
  const alert  = (msg) => _push('[alert: '  + (msg||'') + ']')
  try {
    const fn = new Function('console','prompt','alert', '"use strict";' + code)
    const r = fn(console, prompt, alert)
    if (r && typeof r.then === 'function') await r
    self.postMessage({ ok: true, output: logs.join('\\n') })
  } catch (err) {
    self.postMessage({ ok: false, output: logs.join('\\n'), error: String(err?.message || err) })
  }
}
`

let jsWorkerUrl = null
function getJsWorkerUrl() {
  if (jsWorkerUrl) return jsWorkerUrl
  const blob = new Blob([JS_WORKER_SRC], { type: 'application/javascript' })
  jsWorkerUrl = URL.createObjectURL(blob)
  return jsWorkerUrl
}

export default function CodeRunner({
  code,
  setCode,
  language = 'python',
  starter = '',
  rows = 12,
  readOnly = false,
  onOutput, // (output, ok) => void  — opțional, pentru a injecta output în submit
}) {
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [stdin, setStdin] = useState('')
  const workerRef = useRef(null)
  const outputRef = useRef('')  // acumulator sync pentru onOutput
  const lang = (language || 'python').toLowerCase()

  // Pentru Python afișăm mereu câmpul stdin (input poate fi adăugat oricând)
  const needsStdin = lang === 'python'

  // cleanup worker
  useEffect(() => () => { if (workerRef.current) workerRef.current.terminate() }, [])

  const runPython = useCallback(() => {
    setRunning(true)
    setOutput('⏳ Se încarcă Python (~10MB prima dată, apoi e cache-uit)...')
    outputRef.current = ''

    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null }

    let timedOut = false
    const TIMEOUT_MS = 10000

    const timeout = setTimeout(() => {
      timedOut = true
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null }
      const out = outputRef.current + '\n⏱ Timp depășit (>10s) — posibil ciclu infinit. Codul a fost oprit.'
      setOutput(out)
      if (onOutput) onOutput(out, false)
      setRunning(false)
    }, TIMEOUT_MS)

    try {
      const w = new Worker(getPyWorkerUrl())
      workerRef.current = w

      w.onmessage = (ev) => {
        if (timedOut) return
        const { type, line, ok, output: finalOut, error } = ev.data

        if (type === 'stdout') {
          // output în timp real
          outputRef.current += line
          setOutput(outputRef.current || '⏳ Rulez...')
          return
        }

        if (type === 'done') {
          clearTimeout(timeout)
          let text = finalOut || outputRef.current || ''
          if (error) text += (text ? '\n' : '') + '❌ ' + error
          if (!text) text = '(fără output)'
          setOutput(text)
          if (onOutput) onOutput(text, ok)
          setRunning(false)
          w.terminate(); workerRef.current = null
        }
      }

      w.onerror = (err) => {
        if (timedOut) return
        clearTimeout(timeout)
        const msg = '❌ ' + (err.message || 'Eroare worker Python')
        setOutput(msg)
        if (onOutput) onOutput(msg, false)
        setRunning(false)
        workerRef.current = null
      }

      w.postMessage({ code: code || '', stdin: stdin.split('\n').map(s => s.trimEnd()) })
    } catch (e) {
      clearTimeout(timeout)
      setOutput('❌ ' + (e?.message || e))
      setRunning(false)
    }
  }, [code, stdin, onOutput])

  const runJs = useCallback(() => {
    setRunning(true)
    setOutput('')
    outputRef.current = ''
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null }
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null }
      setOutput(o => o + '\n⏱ Cod prea lent (>5s) — posibil buclă infinită. Oprit.')
      setRunning(false)
    }, 5000)
    try {
      const w = new Worker(getJsWorkerUrl())
      workerRef.current = w
      w.onmessage = (ev) => {
        if (timedOut) return
        clearTimeout(timeout)
        const { ok, output: out, error } = ev.data
        const text = (out || '') + (error ? '\n❌ ' + error : '')
        setOutput(text || '(fără output)')
        if (onOutput) onOutput(text, ok)
        setRunning(false)
        w.terminate(); workerRef.current = null
      }
      w.onerror = (err) => {
        if (timedOut) return
        clearTimeout(timeout)
        setOutput('❌ ' + (err.message || 'Eroare necunoscută'))
        setRunning(false)
      }
      w.postMessage({ code: code || '' })
    } catch (e) {
      clearTimeout(timeout)
      setOutput('❌ ' + (e?.message || e))
      setRunning(false)
    }
  }, [code, onOutput])

  const runServerSide = useCallback(async () => {
    setRunning(true); setOutput('⏳ Compilare și rulare pe server...')
    try {
      const r = await fetch('/api/public/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, code: code || '' }),
      })
      const d = await r.json()
      if (!r.ok) {
        const msg = '❌ ' + (d.error || 'Eroare server')
        setOutput(msg)
        if (onOutput) onOutput(msg, false)
        return
      }
      const compileErr = d.compile?.stderr?.trim()
      const runOut = d.run?.stdout?.trim() || ''
      const runErr = d.run?.stderr?.trim() || ''
      const exitCode = d.run?.code ?? null

      let out = ''
      if (compileErr) out += '🔨 Erori compilare:\n' + compileErr + '\n'
      if (runOut) out += runOut
      if (runErr) out += (out ? '\n' : '') + '⚠️ Stderr:\n' + runErr
      if (!out) out = exitCode === 0 ? '(fără output)' : `❌ Program terminat cu codul ${exitCode}`

      setOutput(out)
      if (onOutput) onOutput(out, !compileErr && exitCode === 0)
    } catch (e) {
      const msg = '❌ ' + (e?.message || 'Eroare rețea')
      setOutput(msg)
      if (onOutput) onOutput(msg, false)
    } finally {
      setRunning(false)
    }
  }, [code, lang, onOutput])

  const run = () => {
    if (lang === 'python') return runPython()
    if (lang === 'javascript' || lang === 'js') return runJs()
    if (lang === 'c' || lang === 'cpp') return runServerSide()
    if (lang === 'html' || lang === 'css') {
      // pentru HTML/CSS doar refresh la preview
      setPreviewKey(k => k + 1)
    }
  }

  const reset = () => { setCode(starter || ''); setOutput('') }

  const taRef = useRef(null)

  const handleKeyDown = useCallback((e) => {
    if (readOnly) return
    const ta = e.target
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const val   = ta.value

    // helper: aplică modificarea și setează cursorul după re-render React
    const apply = (newVal, cursorPos, cursorEnd) => {
      e.preventDefault()
      setCode(newVal)
      requestAnimationFrame(() => {
        if (!taRef.current) return
        taRef.current.setSelectionRange(cursorPos, cursorEnd ?? cursorPos)
      })
    }

    // Tab → 4 spații
    if (e.key === 'Tab') {
      if (start !== end) {
        // indent linii selectate
        const lineStart = val.lastIndexOf('\n', start - 1) + 1
        const lineEnd   = val.indexOf('\n', end)
        const block = val.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)
        const indented = block.replace(/^/gm, '    ')
        const newVal = val.slice(0, lineStart) + indented + (lineEnd === -1 ? '' : val.slice(lineEnd))
        apply(newVal, start + 4, end + indented.split('\n').length * 4)
      } else {
        apply(val.slice(0, start) + '    ' + val.slice(end), start + 4)
      }
      return
    }

    // Enter → păstrează indentarea curentă + adaugă extra după ':' / scade după break/continue/return/pass
    if (e.key === 'Enter') {
      const lineStart  = val.lastIndexOf('\n', start - 1) + 1
      const linePrefix = val.slice(lineStart, start)
      const indent     = linePrefix.match(/^([ \t]*)/)[1]
      const trimmed    = linePrefix.trim()
      const deindent   = /^(break|continue|return|pass)(\s.*)?$/.test(trimmed)
      const extraIndent = !deindent && linePrefix.trimEnd().endsWith(':') ? '    ' : ''
      const newIndent  = deindent && indent.length >= 4 ? indent.slice(4) : indent
      apply(val.slice(0, start) + '\n' + newIndent + extraIndent + val.slice(end), start + 1 + newIndent.length + extraIndent.length)
      return
    }

    // Auto-close perechi
    const PAIRS = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"' }
    if (PAIRS[e.key]) {
      const close = PAIRS[e.key]
      const selected = val.slice(start, end)
      const newVal = val.slice(0, start) + e.key + selected + close + val.slice(end)
      // dacă e selecție → înconjoară, cursor după selecție
      if (start !== end) {
        apply(newVal, start + 1, end + 1)
      } else {
        apply(newVal, start + 1)
      }
      return
    }

    // Backspace — dacă înainte de cursor sunt exact 4 spații (fără selecție), le șterge pe toate
    if (e.key === 'Backspace' && start === end) {
      const before = val.slice(0, start)
      if (before.endsWith('    ')) {
        apply(val.slice(0, start - 4) + val.slice(end), start - 4)
        return
      }
    }

    // Skip peste closing bracket dacă urmează exact acel caracter
    if (['}', ']', ')'].includes(e.key) && start === end && val[start] === e.key) {
      e.preventDefault()
      requestAnimationFrame(() => taRef.current?.setSelectionRange(start + 1, start + 1))
      return
    }
  }, [readOnly, setCode])

  // Pentru HTML/CSS preview-ul e un iframe sandbox
  const isPreview = lang === 'html' || lang === 'css'
  const previewSrc = (() => {
    if (lang === 'html') return code || ''
    if (lang === 'css') return `<!doctype html><html><head><style>${code || ''}</style></head><body><div class="demo"><h1>Titlu</h1><p>Paragraf de test pentru CSS-ul tău.</p><button>Buton</button></div></body></html>`
    return ''
  })()

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          ref={taRef}
          value={code ?? ''}
          onChange={e => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={rows}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl font-mono text-sm bg-slate-900 text-slate-100 focus:border-blue-500 outline-none resize-y"
          placeholder={starter || `// scrie cod ${lang}`}
          style={{ tabSize: 4, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
        />
        <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{lang}</div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={run} disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition">
          {isPreview ? <EyeIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          {running ? 'Rulez...' : (isPreview ? 'Preview' : 'Rulează')}
        </button>
        <button type="button" onClick={reset}
          className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
          <ArrowPathIcon className="w-4 h-4" /> Reset
        </button>
        <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
          {lang === 'python' && '🐍 Python în Worker izolat (timeout 10s)'}
          {(lang === 'javascript' || lang === 'js') && '⚡ JS în Web Worker izolat'}
          {(lang === 'c' || lang === 'cpp') && '⚙️ C/C++ compilat pe server (Judge0 CE)'}
          {isPreview && '🖼 Preview live (iframe sandbox)'}
        </span>
      </div>

      {/* Stdin — pentru programe care folosesc input() */}
      {needsStdin && (
        <div className="space-y-1.5 bg-amber-50 border-2 border-amber-300 rounded-xl p-3">
          <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <span>⌨️ Valori pentru input()</span>
          </label>
          <p className="text-[11px] text-amber-800">
            Dacă codul tău folosește <code className="bg-amber-200 px-1 rounded font-mono">input()</code>, scrie aici valorile — câte o valoare pe linie, în ordinea în care le cere programul.
          </p>
          <textarea
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            rows={3}
            spellCheck={false}
            placeholder={"5\n10\nSalut"}
            className="w-full px-3 py-2 border-2 border-amber-400 rounded-lg font-mono text-sm bg-white text-slate-900 focus:border-amber-600 outline-none resize-y placeholder:text-slate-400"
          />
        </div>
      )}

      {/* Output / Preview */}
      {isPreview ? (
        <iframe
          key={previewKey}
          title="preview"
          sandbox="allow-scripts"
          srcDoc={previewSrc}
          className="w-full h-72 border-2 border-slate-200 rounded-xl bg-white"
        />
      ) : (output || running) && (
        <div className="bg-slate-950 border-2 border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 whitespace-pre-wrap min-h-[60px] max-h-72 overflow-auto">
          {output || (pyLoading ? '⏳ Se încarcă Python (prima dată ~10MB, apoi e cache-uit)...' : '⏳ Rulez...')}
        </div>
      )}
    </div>
  )
}
