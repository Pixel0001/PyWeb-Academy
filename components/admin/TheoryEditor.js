'use client'

// Block-based theory editor — drag & drop, live preview, type switcher.
// Stochează ca markdown string (lesson.theory) — complet backward-compatible.

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bars3Icon, TrashIcon, PlusIcon,
  CodeBracketIcon, PhotoIcon, ListBulletIcon, ChatBubbleBottomCenterTextIcon,
  H1Icon, H2Icon, H3Icon, DocumentTextIcon, FilmIcon, MinusIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK TYPES metadata
// ─────────────────────────────────────────────────────────────────────────────
const BLOCK_OPTIONS = [
  { type: 'paragraph',  label: 'Paragraf',     icon: DocumentTextIcon,              color: 'slate'  },
  { type: 'heading',    label: 'Titlu',         icon: H2Icon,                        color: 'indigo' },
  { type: 'code',       label: 'Cod',           icon: CodeBracketIcon,               color: 'gray'   },
  { type: 'list',       label: 'Listă',          icon: ListBulletIcon,                color: 'emerald'},
  { type: 'callout',    label: 'Notă',          icon: ChatBubbleBottomCenterTextIcon,color: 'amber'  },
  { type: 'image',      label: 'Imagine',       icon: PhotoIcon,                     color: 'pink'   },
  { type: 'video',      label: 'Video YouTube', icon: FilmIcon,                      color: 'red'    },
  { type: 'divider',    label: 'Separator',     icon: MinusIcon,                     color: 'slate'  },
]

const rid = () => Math.random().toString(36).slice(2, 10)

const DEFAULTS = {
  heading:   () => ({ id: rid(), type: 'heading',   level: 2, text: '' }),
  paragraph: () => ({ id: rid(), type: 'paragraph', text: '' }),
  code:      () => ({ id: rid(), type: 'code',      language: 'python', code: '' }),
  list:      () => ({ id: rid(), type: 'list',      ordered: false, items: [''] }),
  callout:   () => ({ id: rid(), type: 'callout',   text: '' }),
  image:     () => ({ id: rid(), type: 'image',     alt: '', url: '' }),
  video:     () => ({ id: rid(), type: 'video',     url: '' }),
  divider:   () => ({ id: rid(), type: 'divider' }),
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERT block to new type — preserve content where possible
// ─────────────────────────────────────────────────────────────────────────────
function convertBlock(block, newType) {
  const base = DEFAULTS[newType]()
  const txt = block.text || block.code || (block.items || []).join('\n') || ''
  switch (newType) {
    case 'heading':   return { ...base, text: txt }
    case 'paragraph': return { ...base, text: txt }
    case 'callout':   return { ...base, text: txt }
    case 'code':      return { ...base, code: txt, language: block.language || 'python' }
    case 'list':      return { ...base, items: txt ? txt.split('\n').filter(Boolean) : [''] }
    case 'image':     return { ...base, url: block.url || '', alt: block.alt || '' }
    case 'video':     return { ...base, url: block.url || '' }
    default:          return base
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSE markdown → blocks
// ─────────────────────────────────────────────────────────────────────────────
function parseToBlocks(text) {
  if (!text || !text.trim()) return []
  const lines = text.split('\n')
  const blocks = []
  let i = 0, para = []
  const flushPara = () => {
    const joined = para.join('\n').trim()
    if (joined) blocks.push({ id: rid(), type: 'paragraph', text: joined })
    para = []
  }
  while (i < lines.length) {
    const ln = lines[i]
    if (ln.startsWith('```')) {
      flushPara()
      const lang = ln.slice(3).trim() || 'python'
      const buf = []; i++
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++ }
      blocks.push({ id: rid(), type: 'code', language: lang, code: buf.join('\n') })
      i++; continue
    }
    const yt = ln.match(/^@\[youtube\]\(([^)]+)\)\s*$/i)
    if (yt) { flushPara(); blocks.push({ id: rid(), type: 'video', url: yt[1].trim() }); i++; continue }
    const img = ln.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
    if (img) { flushPara(); blocks.push({ id: rid(), type: 'image', alt: img[1], url: img[2] }); i++; continue }
    if (/^---+\s*$/.test(ln)) { flushPara(); blocks.push({ id: rid(), type: 'divider' }); i++; continue }
    if (ln.startsWith('> ')) {
      flushPara()
      const buf = [ln.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) { buf.push(lines[++i].slice(2)) }
      blocks.push({ id: rid(), type: 'callout', text: buf.join('\n') })
      i++; continue
    }
    const ulM = ln.match(/^[-*]\s+(.+)$/)
    const olM = ln.match(/^\d+\.\s+(.+)$/)
    if (ulM || olM) {
      flushPara()
      const ordered = !!olM; const items = []
      while (i < lines.length && (ordered ? /^\d+\.\s+/.test(lines[i]) : /^[-*]\s+/.test(lines[i]))) {
        items.push(lines[i].replace(/^([-*]|\d+\.)\s+/, '')); i++
      }
      blocks.push({ id: rid(), type: 'list', ordered, items }); continue
    }
    if (ln.startsWith('### ')) { flushPara(); blocks.push({ id: rid(), type: 'heading', level: 3, text: ln.slice(4) }); i++; continue }
    if (ln.startsWith('## '))  { flushPara(); blocks.push({ id: rid(), type: 'heading', level: 2, text: ln.slice(3) }); i++; continue }
    if (ln.startsWith('# '))   { flushPara(); blocks.push({ id: rid(), type: 'heading', level: 1, text: ln.slice(2) }); i++; continue }
    if (ln.trim() === '') { flushPara(); i++; continue }
    para.push(ln); i++
  }
  flushPara()
  return blocks
}

// ─────────────────────────────────────────────────────────────────────────────
// SERIALIZE blocks → markdown
// ─────────────────────────────────────────────────────────────────────────────
function blocksToMarkdown(blocks) {
  return blocks.map(b => {
    switch (b.type) {
      case 'heading':   return '#'.repeat(b.level) + ' ' + (b.text || '')
      case 'paragraph': return b.text || ''
      case 'code':      return '```' + (b.language || '') + '\n' + (b.code || '') + '\n```'
      case 'list':      return (b.items || []).map((it, i) => b.ordered ? `${i + 1}. ${it}` : `- ${it}`).join('\n')
      case 'callout':   return (b.text || '').split('\n').map(l => '> ' + l).join('\n')
      case 'image':     return `![${b.alt || ''}](${b.url || ''})`
      case 'video':     return `@[youtube](${b.url || ''})`
      case 'divider':   return '---'
      default:          return ''
    }
  }).join('\n\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE format helper (preview HTML)
// ─────────────────────────────────────────────────────────────────────────────
function inlineFmt(s) {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-2 rounded-lg max-w-full h-auto shadow" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-indigo-600 underline">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-indigo-50 rounded text-sm font-mono text-indigo-700 font-medium">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW BLOCK — jak vede elevul
// ─────────────────────────────────────────────────────────────────────────────
function PreviewBlock({ b, highlight }) {
  const cls = highlight ? 'ring-2 ring-indigo-400 ring-offset-1 rounded-xl' : ''
  const wrap = (node) => <div className={cls}>{node}</div>
  switch (b.type) {
    case 'heading':
      if (b.level === 1) return wrap(<h1 className="text-2xl font-bold mt-4 mb-2 text-slate-900" dangerouslySetInnerHTML={{ __html: inlineFmt(b.text) || '<em style="color:#ccc">(titlu gol)</em>' }} />)
      if (b.level === 3) return wrap(<h3 className="text-base font-semibold mt-3 mb-1 text-slate-800" dangerouslySetInnerHTML={{ __html: inlineFmt(b.text) || '<em style="color:#ccc">(titlu gol)</em>' }} />)
      return wrap(<h2 className="text-xl font-bold mt-3 mb-2 text-slate-900" dangerouslySetInnerHTML={{ __html: inlineFmt(b.text) || '<em style="color:#ccc">(titlu gol)</em>' }} />)
    case 'paragraph':
      return wrap(b.text
        ? <p className="text-slate-700 leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: inlineFmt(b.text).replace(/\n/g, '<br/>') }} />
        : <p className="text-slate-300 italic my-2">(paragraf gol)</p>)
    case 'code':
      return wrap(
        <div className="my-3">
          {b.language && <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{b.language}</div>}
          <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs font-mono">{b.code || <span className="text-slate-500"># cod gol</span>}</pre>
        </div>
      )
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul'
      const lCls = b.ordered ? 'list-decimal list-inside space-y-1 my-2 text-slate-700' : 'list-disc list-inside space-y-1 my-2 text-slate-700'
      return wrap(<Tag className={lCls}>{(b.items || []).map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inlineFmt(it) || '<em class="text-slate-300">(item gol)</em>' }} />)}</Tag>)
    }
    case 'callout':
      return wrap(
        <div className="my-3 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded-r-xl">
          {(b.text || '').split('\n').map((l, k) => <p key={k} className="text-amber-900 text-sm" dangerouslySetInnerHTML={{ __html: inlineFmt(l) || '<em class="text-amber-300">(notă goală)</em>' }} />)}
        </div>
      )
    case 'image':
      return wrap(b.url
        ? <img src={b.url} alt={b.alt || ''} className="my-3 rounded-xl max-w-full h-auto shadow" />
        : <div className="my-3 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 p-6 text-center text-slate-400 text-sm">📷 Imagine fără URL</div>)
    case 'video': {
      const raw = (b.url || '').trim()
      let id = raw
      const m = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
      if (m) id = m[1]
      return wrap(id
        ? <div className="aspect-video my-3 rounded-xl overflow-hidden bg-black"><iframe src={`https://www.youtube.com/embed/${id}`} className="w-full h-full" allowFullScreen /></div>
        : <div className="my-3 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 p-6 text-center text-slate-400 text-sm">🎬 Video fără URL</div>)
    }
    case 'divider': return wrap(<hr className="my-5 border-t-2 border-slate-200" />)
    default: return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE SWITCHER MENU
// ─────────────────────────────────────────────────────────────────────────────
function TypeMenu({ block, onConvert, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const meta = BLOCK_OPTIONS.find(o => o.type === block.type)
  const Icon = meta?.icon || DocumentTextIcon

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        title="Schimbă tipul blocului"
        className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/60 transition text-slate-600 hover:text-indigo-700 disabled:opacity-40"
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{meta?.label || block.type}</span>
        <ChevronDownIcon className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-44 py-1 overflow-hidden">
          {BLOCK_OPTIONS.map(o => {
            const OIcon = o.icon
            const isCurrent = o.type === block.type
            return (
              <button
                key={o.type}
                type="button"
                onClick={() => { onConvert(o.type); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition ${
                  isCurrent
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <OIcon className="w-3.5 h-3.5 shrink-0" />
                {o.label}
                {isCurrent && <span className="ml-auto text-[9px] bg-indigo-200 text-indigo-800 px-1 rounded">activ</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK EDITOR CARD — drag & drop aware
// ─────────────────────────────────────────────────────────────────────────────
function BlockEditor({ block, idx, total, disabled, onChange, onRemove, onConvert,
                       isDragging, isDragOver, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const update = (patch) => onChange({ ...block, ...patch })
  const handleRef = useRef(null)

  return (
    <div
      draggable={!disabled}
      onDragStart={e => {
        if (!handleRef.current?.contains(e.target)) { e.preventDefault(); return }
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(idx)
      }}
      onDragEnd={onDragEnd}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(idx) }}
      onDrop={e => { e.preventDefault(); onDrop(idx) }}
      className={`relative bg-white border-2 rounded-xl transition-all
        ${isDragOver ? 'border-indigo-400 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-indigo-200'}
        ${isDragging ? 'opacity-40 border-dashed' : ''}
      `}
    >
      {/* Drop indicator line above */}
      {isDragOver && (
        <div className="absolute -top-1 left-4 right-4 h-0.5 bg-indigo-500 rounded-full z-10 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl select-none">
        {/* Drag handle */}
        <div
          ref={handleRef}
          className={`cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-slate-600 ${disabled ? 'opacity-30' : ''}`}
          title="Trage pentru reordonare"
        >
          <Bars3Icon className="w-4 h-4" />
        </div>

        {/* Type switcher */}
        <TypeMenu block={block} onConvert={(t) => onConvert(idx, t)} disabled={disabled} />

        <span className="text-[10px] text-slate-400 ml-0.5">#{idx + 1}</span>

        {/* Delete */}
        <div className="ml-auto">
          <button
            type="button" disabled={disabled}
            onClick={() => onRemove(idx)}
            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition"
            title="Șterge blocul"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {block.type === 'heading' && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3].map(lv => (
                <button key={lv} type="button" disabled={disabled} onClick={() => update({ level: lv })}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${block.level === lv ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  H{lv}
                </button>
              ))}
            </div>
            <input
              value={block.text || ''} onChange={e => update({ text: e.target.value })} disabled={disabled}
              placeholder="Textul titlului..."
              className={`w-full px-3 py-2 border rounded-lg outline-none focus:border-indigo-400 ${block.level === 1 ? 'text-2xl font-bold' : block.level === 2 ? 'text-xl font-bold' : 'text-base font-semibold'}`}
            />
          </div>
        )}

        {block.type === 'paragraph' && (
          <div className="space-y-2">
            <textarea
              value={block.text || ''} onChange={e => update({ text: e.target.value })} disabled={disabled}
              placeholder="Scrie un paragraf... Acceptă **bold**, *italic*, `cod`, [link](url)"
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-400 resize-y"
            />
            {block.text && (
              <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: inlineFmt(block.text).replace(/\n/g, '<br/>') }} />
            )}
            <p className="text-[10px] text-slate-400">Formatare: <code className="bg-slate-100 px-1 rounded">**bold**</code> · <code className="bg-slate-100 px-1 rounded">*italic*</code> · <code className="bg-slate-100 px-1 rounded">`cod`</code> · <code className="bg-slate-100 px-1 rounded">[text](url)</code></p>
          </div>
        )}

        {block.type === 'code' && (
          <div className="space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {['python', 'javascript', 'html', 'css', 'bash', 'json', 'sql'].map(l => (
                <button key={l} type="button" disabled={disabled} onClick={() => update({ language: l })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${block.language === l ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {l}
                </button>
              ))}
            </div>
            <textarea
              value={block.code || ''} onChange={e => update({ code: e.target.value })} disabled={disabled}
              placeholder="# scrie codul aici..."
              rows={6} spellCheck={false}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm bg-slate-900 text-slate-100 outline-none focus:border-indigo-400 resize-y"
            />
          </div>
        )}

        {block.type === 'list' && (
          <div className="space-y-2">
            <div className="flex gap-1">
              <button type="button" disabled={disabled} onClick={() => update({ ordered: false })}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${!block.ordered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                • Bullets
              </button>
              <button type="button" disabled={disabled} onClick={() => update({ ordered: true })}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${block.ordered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                1. Numere
              </button>
            </div>
            {(block.items || []).map((it, j) => (
              <div key={j} className="flex gap-2 items-center">
                <span className="text-slate-400 text-xs w-6 text-right">{block.ordered ? `${j + 1}.` : '•'}</span>
                <input
                  value={it} disabled={disabled}
                  onChange={e => { const items = [...block.items]; items[j] = e.target.value; update({ items }) }}
                  placeholder="Item..."
                  className="flex-1 px-2 py-1.5 border rounded text-sm outline-none focus:border-indigo-400"
                />
                <button type="button" disabled={disabled || block.items.length === 1}
                  onClick={() => update({ items: block.items.filter((_, k) => k !== j) })}
                  className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30">
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button type="button" disabled={disabled} onClick={() => update({ items: [...(block.items || []), ''] })}
              className="text-xs text-indigo-600 font-bold hover:text-indigo-800 disabled:opacity-30">
              + Adaugă item
            </button>
          </div>
        )}

        {block.type === 'callout' && (
          <div className="space-y-2">
            <textarea
              value={block.text || ''} onChange={e => update({ text: e.target.value })} disabled={disabled}
              placeholder="💡 O notă, observație, atenționare... (acceptă **bold**, `cod`)"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-amber-400 resize-y bg-amber-50/40"
            />
            {block.text && (
              <div className="border-l-4 border-amber-400 bg-amber-50 px-3 py-2 rounded-r-lg">
                {(block.text || '').split('\n').map((l, k) => (
                  <p key={k} className="text-amber-900 text-sm" dangerouslySetInnerHTML={{ __html: inlineFmt(l) || '&nbsp;' }} />
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400">Formatare: <code className="bg-slate-100 px-1 rounded">**bold**</code> · <code className="bg-slate-100 px-1 rounded">*italic*</code> · <code className="bg-slate-100 px-1 rounded">`cod`</code></p>
          </div>
        )}

        {block.type === 'image' && (
          <div className="space-y-2">
            <input value={block.url || ''} onChange={e => update({ url: e.target.value })} disabled={disabled}
              placeholder="URL imagine (https://... sau /uploads/...)"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-400" />
            <input value={block.alt || ''} onChange={e => update({ alt: e.target.value })} disabled={disabled}
              placeholder="Descriere (alt text — pentru SEO)"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-400" />
          </div>
        )}

        {block.type === 'video' && (
          <input value={block.url || ''} onChange={e => update({ url: e.target.value })} disabled={disabled}
            placeholder="URL YouTube (https://youtube.com/watch?v=... sau ID direct)"
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-rose-400" />
        )}

        {block.type === 'divider' && (
          <div className="text-center text-slate-300 text-xs py-2">— separator vizual —</div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EDITOR
// ─────────────────────────────────────────────────────────────────────────────
export default function TheoryEditor({ value, onChange, disabled = false }) {
  const [blocks, setBlocks] = useState(() => parseToBlocks(value || ''))
  const [view, setView] = useState('split') // 'edit' | 'split' | 'preview' | 'raw'
  const [rawText, setRawText] = useState('')
  const [activeIdx, setActiveIdx] = useState(null) // for preview highlight
  const [dragIdx, setDragIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Propagate to parent whenever blocks change
  useEffect(() => {
    const md = blocksToMarkdown(blocks)
    onChangeRef.current?.(md)
  }, [blocks])

  // Sync rawText when switching to raw view
  useEffect(() => {
    if (view === 'raw') setRawText(blocksToMarkdown(blocks))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  // Scroll to preview block when activeIdx changes
  const previewRefs = useRef({})

  const update = useCallback((newBlocks) => setBlocks(newBlocks), [])
  const updateBlock = (i, b) => { setActiveIdx(i); update(blocks.map((x, k) => k === i ? b : x)) }
  const removeBlock = (i) => { setActiveIdx(null); update(blocks.filter((_, k) => k !== i)) }
  const addBlock = (type) => {
    if (!DEFAULTS[type]) return
    const nb = [...blocks, DEFAULTS[type]()]
    update(nb)
    setActiveIdx(nb.length - 1)
    // scroll to bottom in split view
    setTimeout(() => {
      const el = previewRefs.current[nb.length - 1]
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
  }
  const convertBlock = (i, newType) => {
    if (blocks[i].type === newType) return
    update(blocks.map((b, k) => k === i ? convertBlockFn(b, newType) : b))
  }

  // Drag & Drop handlers
  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null) }
  const handleDragOver = (idx) => { if (idx !== dragIdx) setDragOverIdx(idx) }
  const handleDrop = (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) { handleDragEnd(); return }
    const arr = [...blocks]
    const [removed] = arr.splice(dragIdx, 1)
    const insertAt = dragIdx < targetIdx ? targetIdx - 1 : targetIdx
    arr.splice(insertAt, 0, removed)
    update(arr)
    handleDragEnd()
  }

  const replaceFromRaw = (raw) => {
    setRawText(raw)
    setBlocks(parseToBlocks(raw))
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 border border-slate-200 rounded-xl p-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Vizualizare:</span>
        {[
          { k: 'edit',    l: '✏️ Editor' },
          { k: 'split',   l: '⚡ Editor + Preview' },
          { k: 'preview', l: '👁️ Preview' },
          { k: 'raw',     l: '📝 Markdown' },
        ].map(o => (
          <button key={o.k} type="button" onClick={() => setView(o.k)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${view === o.k ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            {o.l}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{blocks.length} {blocks.length === 1 ? 'bloc' : 'blocuri'}</span>
      </div>

      {/* RAW view */}
      {view === 'raw' && (
        <div className="space-y-2">
          <textarea
            value={rawText} onChange={e => replaceFromRaw(e.target.value)} disabled={disabled}
            rows={22} spellCheck={false}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl font-mono text-sm outline-none focus:border-indigo-400 resize-y"
          />
          <p className="text-xs text-slate-500">⚠️ Editezi direct markdown-ul. La ieșire din mod Markdown, blocurile se actualizează automat.</p>
        </div>
      )}

      {/* EDIT / SPLIT */}
      {(view === 'edit' || view === 'split') && (
        <div className={view === 'split' ? 'grid lg:grid-cols-2 gap-4 items-start' : ''}>
          {/* Editor column */}
          <div className="space-y-2" onDragLeave={() => setDragOverIdx(null)}>
            {blocks.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-1">Lecția nu are conținut.</p>
                <p className="text-xs text-slate-400">Apasă pe un buton de mai jos pentru a adăuga primul bloc.</p>
              </div>
            ) : blocks.map((b, i) => (
              <BlockEditor
                key={b.id}
                block={b}
                idx={i}
                total={blocks.length}
                disabled={disabled}
                onChange={(nb) => updateBlock(i, nb)}
                onRemove={removeBlock}
                onConvert={convertBlock}
                isDragging={dragIdx === i}
                isDragOver={dragOverIdx === i}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}

            {/* Drop zone at the bottom when dragging */}
            {dragIdx !== null && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOverIdx(blocks.length) }}
                onDrop={e => { e.preventDefault(); handleDrop(blocks.length) }}
                className={`h-10 rounded-xl border-2 border-dashed transition ${dragOverIdx === blocks.length ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}
              />
            )}

            {/* Add block palette */}
            {!disabled && (
              <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl p-3">
                <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <PlusIcon className="w-3.5 h-3.5" /> Adaugă bloc
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {BLOCK_OPTIONS.map(o => {
                    const Icon = o.icon
                    return (
                      <button key={o.type} type="button" onClick={() => addBlock(o.type)}
                        className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-xs font-medium text-slate-700 transition">
                        <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{o.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PREVIEW column */}
          {view === 'split' && (
            <div className="lg:sticky lg:top-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">⚡ Preview live (ca la elev)</div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-5 max-h-[75vh] overflow-y-auto">
                {blocks.length === 0
                  ? <p className="text-sm text-slate-400 italic text-center py-10">Preview-ul apare aici...</p>
                  : blocks.map((b, i) => (
                    <div
                      key={b.id}
                      ref={el => previewRefs.current[i] = el}
                      onClick={() => setActiveIdx(i === activeIdx ? null : i)}
                      className="cursor-pointer"
                      title="Click pentru a selecta blocul"
                    >
                      <PreviewBlock b={b} highlight={activeIdx === i} />
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW only */}
      {view === 'preview' && (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
          {blocks.length === 0
            ? <p className="text-sm text-slate-400 italic text-center py-10">Lecția e goală.</p>
            : blocks.map(b => <PreviewBlock key={b.id} b={b} />)
          }
        </div>
      )}
    </div>
  )
}

// alias used inside
const convertBlockFn = convertBlock
