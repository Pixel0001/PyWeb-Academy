// ── Shared markdown renderer ─────────────────────────────────────────────
// Used in: admin ProblemForm preview, learn LessonRunner (problem description,
// hints, explanations), AI feedback. Keeps formatting consistent everywhere.

import React from 'react'

export function inlineFmt(s) {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-3 rounded-xl max-w-full h-auto shadow" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 underline hover:text-indigo-800">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-indigo-50 rounded-md text-sm font-mono text-indigo-700 font-medium">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

/**
 * Render markdown text into React nodes.
 * Supports: # / ## / ### headings, **bold**, *italic*, `code`,
 * ```fenced code blocks```, > blockquotes, - / 1. lists, links, images,
 * @[youtube](URL_or_ID), --- horizontal rules, blank lines as spacing.
 */
export function renderMd(text, opts = {}) {
  if (text === null || text === undefined) return null
  const str = String(text)
  if (!str.trim()) return null

  const { compact = false } = opts
  const pCls = compact
    ? 'text-slate-700 text-sm leading-relaxed my-1'
    : 'text-slate-700 leading-relaxed my-1.5'

  const lines = str.split('\n')
  const out = []
  let i = 0
  let listBuf = []
  let listOrdered = false

  const flushList = (key) => {
    if (listBuf.length === 0) return
    const Tag = listOrdered ? 'ol' : 'ul'
    const cls = listOrdered
      ? 'list-decimal list-inside space-y-1 my-2 text-slate-700 text-sm'
      : 'list-disc list-inside space-y-1 my-2 text-slate-700 text-sm'
    out.push(
      <Tag key={`l${key}`} className={cls}>
        {listBuf.map((item, j) => (
          <li key={j} dangerouslySetInnerHTML={{ __html: inlineFmt(item) }} />
        ))}
      </Tag>
    )
    listBuf = []
  }

  while (i < lines.length) {
    const ln = lines[i]

    // Fenced code block
    if (ln.startsWith('```')) {
      flushList(i)
      const lang = ln.slice(3).trim()
      const buf = []; i++
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++ }
      out.push(
        <div key={`c${i}`} className="my-3">
          {lang && <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{lang}</div>}
          <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 sm:p-4 overflow-x-auto text-sm font-mono shadow-inner whitespace-pre">{buf.join('\n')}</pre>
        </div>
      )
      i++; continue
    }

    // YouTube embed: @[youtube](URL_or_ID)
    const yt = ln.match(/^@\[youtube\]\(([^)]+)\)\s*$/i)
    if (yt) {
      flushList(i)
      const raw = yt[1].trim()
      let id = raw
      const m1 = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
      if (m1) id = m1[1]
      out.push(
        <div key={i} className="aspect-video my-4 rounded-xl overflow-hidden bg-black shadow">
          <iframe src={`https://www.youtube.com/embed/${id}`} className="w-full h-full" allowFullScreen />
        </div>
      )
      i++; continue
    }

    // Standalone image
    const imgMatch = ln.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
    if (imgMatch) {
      flushList(i)
      out.push(<img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="my-4 rounded-xl max-w-full h-auto shadow" />)
      i++; continue
    }

    // Blockquote
    if (ln.startsWith('> ')) {
      flushList(i)
      const buf = [ln.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) { buf.push(lines[++i].slice(2)) }
      out.push(
        <div key={i} className="my-3 border-l-4 border-amber-400 bg-amber-50 px-4 py-2.5 rounded-r-xl">
          {buf.map((b, k) => (
            <p key={k} className="text-amber-900 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFmt(b) }} />
          ))}
        </div>
      )
      i++; continue
    }

    // Lists
    const ulMatch = ln.match(/^[-*]\s+(.+)$/)
    const olMatch = ln.match(/^\d+\.\s+(.+)$/)
    if (ulMatch || olMatch) {
      const isOrdered = !!olMatch
      if (listBuf.length > 0 && isOrdered !== listOrdered) flushList(i)
      listOrdered = isOrdered
      listBuf.push((ulMatch || olMatch)[1])
      i++; continue
    } else if (listBuf.length > 0) {
      flushList(i)
    }

    // Horizontal rule
    if (/^---+$/.test(ln.trim())) { out.push(<hr key={i} className="my-3 border-slate-200" />); i++; continue }

    // Headings
    if (ln.startsWith('### ')) { out.push(<h3 key={i} className="text-base font-semibold mt-3 mb-1 text-slate-800" dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(4)) }} />); i++; continue }
    if (ln.startsWith('## '))  { out.push(<h2 key={i} className={`${compact ? 'text-lg' : 'text-xl'} font-bold mt-4 mb-2 text-slate-900`} dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(3)) }} />); i++; continue }
    if (ln.startsWith('# '))   { out.push(<h1 key={i} className={`${compact ? 'text-xl' : 'text-2xl'} font-bold mt-5 mb-2 text-slate-900`} dangerouslySetInnerHTML={{ __html: inlineFmt(ln.slice(2)) }} />); i++; continue }

    // Blank line → spacer
    if (!ln.trim()) { out.push(<div key={i} className="h-2" />); i++; continue }

    // Default paragraph
    out.push(<p key={i} className={pCls} dangerouslySetInnerHTML={{ __html: inlineFmt(ln) }} />)
    i++
  }
  flushList('end')
  return out
}

/**
 * Lightweight wrapper component for inline use.
 */
export default function Markdown({ text, compact = false, className = '' }) {
  const nodes = renderMd(text, { compact })
  if (!nodes) return null
  return <div className={className}>{nodes}</div>
}
