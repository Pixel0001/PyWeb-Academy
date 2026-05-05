// ── Shared markdown renderer ─────────────────────────────────────────────
// Used in: admin ProblemForm preview, learn LessonRunner (problem description,
// hints, explanations), AI feedback. Keeps formatting consistent everywhere.

import React from 'react'

// ── Icon shortcodes :name: → colored inline SVG (heroicons outline) ───────
export const INLINE_ICONS = {
  // Status
  'check':    { d: 'M4.5 12.75l6 6 9-13.5', color: '#10b981', label: 'Bifă' },
  'xmark':    { d: 'M6 18L18 6M6 6l12 12', color: '#ef4444', label: 'X' },
  'warning':  { d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z', color: '#f59e0b', label: 'Atenție' },
  'info':     { d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z', color: '#3b82f6', label: 'Info' },
  'star':     { d: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z', color: '#f59e0b', label: 'Stea' },
  'fire':     { d: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z', color: '#f97316', label: 'Foc' },
  'bolt':     { d: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z', color: '#eab308', label: 'Fulger' },
  'trophy':   { d: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0', color: '#f59e0b', label: 'Trofeu' },
  'heart':    { d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z', color: '#ef4444', label: 'Inimă' },
  'flag':     { d: 'M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5', color: '#ef4444', label: 'Steag' },
  'pin':      { d: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', color: '#6366f1', label: 'Pin' },
  'bookmark': { d: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z', color: '#8b5cf6', label: 'Bookmark' },
  // Arrows / Actions
  'arrow-r':  { d: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3', color: '#6366f1', label: '→ Dreapta' },
  'arrow-l':  { d: 'M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18', color: '#6366f1', label: '← Stânga' },
  'arrow-u':  { d: 'M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18', color: '#6366f1', label: '↑ Sus' },
  'arrow-d':  { d: 'M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3', color: '#6366f1', label: '↓ Jos' },
  'refresh':  { d: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99', color: '#10b981', label: 'Refresh' },
  'plus':     { d: 'M12 4.5v15m7.5-7.5h-15', color: '#10b981', label: 'Plus' },
  'minus':    { d: 'M19.5 12h-15', color: '#64748b', label: 'Minus' },
  'share':    { d: 'M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z', color: '#3b82f6', label: 'Share' },
  'download': { d: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3', color: '#14b8a6', label: 'Download' },
  'upload':   { d: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5', color: '#8b5cf6', label: 'Upload' },
  // Tech / Code
  'code':     { d: 'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5', color: '#6366f1', label: 'Cod' },
  'terminal': { d: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z', color: '#1e293b', label: 'Terminal' },
  'rocket':   { d: 'M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z', color: '#6366f1', label: 'Rachetă' },
  'globe':    { d: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418', color: '#3b82f6', label: 'Web' },
  'bug':      { d: 'M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A23.996 23.996 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44a23.91 23.91 0 001.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.778 3.778 0 01.4-2.25m0 0a5.002 5.002 0 019.45 0m-9.45 0A5.002 5.002 0 012.55 5.764', color: '#ef4444', label: 'Bug' },
  'key':      { d: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z', color: '#f59e0b', label: 'Cheie' },
  'lock':     { d: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z', color: '#64748b', label: 'Lacăt' },
  'eye':      { d: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z', color: '#64748b', label: 'Ochi' },
  'search':   { d: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z', color: '#6366f1', label: 'Căutare' },
  // Education
  'book':     { d: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', color: '#10b981', label: 'Carte' },
  'pencil':   { d: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10', color: '#6366f1', label: 'Creion' },
  'cap':      { d: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5', color: '#6366f1', label: 'Diplomă' },
  'bulb':     { d: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18', color: '#f59e0b', label: 'Idee' },
  'chat':     { d: 'M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z', color: '#3b82f6', label: 'Chat' },
  'clock':    { d: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', color: '#64748b', label: 'Ceas' },
  'calendar': { d: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5', color: '#6366f1', label: 'Calendar' },
}

function iconSvg(name) {
  const ic = INLINE_ICONS[name]
  if (!ic) return `:${name}:`
  return `<span style="display:inline-flex;align-items:center;vertical-align:-0.15em;margin:0 1px" title="${ic.label}"><svg xmlns="http://www.w3.org/2000/svg" width="1.15em" height="1.15em" viewBox="0 0 24 24" fill="none" stroke="${ic.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ic.d}"/></svg></span>`
}

export function inlineFmt(s) {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/:([a-z][a-z-]*):/g, (_, n) => INLINE_ICONS[n] ? iconSvg(n) : `:${n}:`)
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
