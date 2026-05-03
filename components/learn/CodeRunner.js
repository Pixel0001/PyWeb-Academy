'use client'

/**
 * CodeRunner — playground pentru rularea codului în browser.
 *  - Python  → Pyodide (WebAssembly, ~10MB la prima încărcare, apoi cache)
 *  - JavaScript → Web Worker izolat
 *  - HTML/CSS → iframe sandbox cu preview live
 *
 * Cost server: $0 (totul rulează în browser-ul elevului).
 * Mobile-friendly (Chrome Android, Safari iOS 14+).
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { PlayIcon, ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline'

const PYODIDE_VERSION = '0.26.4'
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

let pyodidePromise = null
function loadPyodide() {
  if (pyodidePromise) return pyodidePromise
  pyodidePromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'))
    if (window.loadPyodide) return resolve(window.loadPyodide({ indexURL: PYODIDE_CDN }))
    const script = document.createElement('script')
    script.src = `${PYODIDE_CDN}pyodide.js`
    script.onload = async () => {
      try {
        const py = await window.loadPyodide({ indexURL: PYODIDE_CDN })
        resolve(py)
      } catch (e) { reject(e) }
    }
    script.onerror = () => reject(new Error('Nu pot încărca Pyodide'))
    document.head.appendChild(script)
  })
  return pyodidePromise
}

// Web Worker source pentru JS — rulat ca Blob URL ca să fie complet izolat
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
  // mock pentru prompt/alert într-un worker
  const promptValues = []
  const prompt = (msg) => { _push('[prompt: ' + (msg||'') + ']'); return '' }
  const alert = (msg) => _push('[alert: ' + (msg||'') + ']')
  try {
    // wrap în async ca să accepte await la nivel top
    const fn = new Function('console','prompt','alert', '"use strict";' + code)
    const r = fn(console, prompt, alert)
    if (r && typeof r.then === 'function') await r
    self.postMessage({ ok: true, output: logs.join('\\n') })
  } catch (err) {
    self.postMessage({ ok: false, output: logs.join('\\n'), error: String(err && err.message || err) })
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
  const [pyLoading, setPyLoading] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const workerRef = useRef(null)
  const lang = (language || 'python').toLowerCase()

  // cleanup worker
  useEffect(() => () => { if (workerRef.current) workerRef.current.terminate() }, [])

  const runPython = useCallback(async () => {
    setRunning(true); setOutput('')
    try {
      setPyLoading(true)
      const py = await loadPyodide()
      setPyLoading(false)
      // capturăm stdout + stderr
      py.setStdout({ batched: (s) => setOutput(o => o + s + '\n') })
      py.setStderr({ batched: (s) => setOutput(o => o + s + '\n') })
      // input() → folosește prompt() din browser
      py.globals.set('input', (msg) => {
        const r = window.prompt(typeof msg === 'string' ? msg : '')
        return r == null ? '' : r
      })
      try {
        await py.runPythonAsync(code || '')
        if (onOutput) onOutput(output, true)
      } catch (e) {
        const msg = String(e?.message || e)
        setOutput(o => o + '\n❌ ' + msg)
        if (onOutput) onOutput(msg, false)
      }
    } catch (e) {
      setOutput('❌ Nu pot încărca Python: ' + (e?.message || e))
    } finally {
      setRunning(false); setPyLoading(false)
    }
  }, [code, onOutput, output])

  const runJs = useCallback(() => {
    setRunning(true); setOutput('')
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

  const run = () => {
    if (lang === 'python') return runPython()
    if (lang === 'javascript' || lang === 'js') return runJs()
    if (lang === 'html' || lang === 'css') {
      // pentru HTML/CSS doar refresh la preview
      setPreviewKey(k => k + 1)
    }
  }

  const reset = () => { setCode(starter || ''); setOutput('') }

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
          value={code ?? ''}
          onChange={e => setCode(e.target.value)}
          rows={rows}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl font-mono text-sm bg-slate-900 text-slate-100 focus:border-blue-500 outline-none resize-y"
          placeholder={starter || `// scrie cod ${lang}`}
          style={{ tabSize: 2, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
        />
        <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{lang}</div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={run} disabled={running}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition">
          {isPreview ? <EyeIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          {running ? (pyLoading ? 'Încarc Python (~10MB)...' : 'Rulez...') : (isPreview ? 'Preview' : 'Rulează')}
        </button>
        <button type="button" onClick={reset}
          className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
          <ArrowPathIcon className="w-4 h-4" /> Reset
        </button>
        <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
          {lang === 'python' && '🐍 Python rulează în browser (Pyodide)'}
          {(lang === 'javascript' || lang === 'js') && '⚡ JS în Web Worker izolat'}
          {isPreview && '🖼 Preview live (iframe sandbox)'}
        </span>
      </div>

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
