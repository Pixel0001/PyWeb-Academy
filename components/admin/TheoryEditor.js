'use client'

// Block-based theory editor with live preview.
// Convertește între markdown (stocat în lesson.theory) și blocuri pentru UI ușor de editat.
// Tipuri de blocuri: heading, paragraph, code, list, callout, image, video, divider.

import { useState, useMemo, useRef } from 'react'
import {
  Bars3Icon, TrashIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon,
  CodeBracketIcon, PhotoIcon, ListBulletIcon, ChatBubbleBottomCenterTextIcon,
  H1Icon, H2Icon, H3Icon, DocumentTextIcon, FilmIcon, MinusIcon,
} from '@heroicons/react/24/outline'

// ── PARSE markdown → blocks ──
function parseToBlocks(text) {
  if (!text || !text.trim()) return []
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  let para = []
  const flushPara = () => {
    if (para.length === 0) return
    const joined = para.join('\n').trim()
    if (joined) blocks.push({ id: rid(), type: 'paragraph', text: joined })
    para = []
  }
  while (i < lines.length) {
    const ln = lines[i]
    // code fence
    if (ln.startsWith('```')) {
      flushPara()
      const lang = ln.slice(3).trim() || 'python'
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++ }
      blocks.push({ id: rid(), type: 'code', language: lang, code: buf.join('\n') })
      i++
      continue
    }
    // youtube
    const yt = ln.match(/^@\[youtube\]\(([^)]+)\)\s*$/i)
    if (yt) {
      flushPara()
      blocks.push({ id: rid(), type: 'video', url: yt[1].trim() })
      i++; continue
    }
    // image standalone
    const img = ln.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
    if (img) {
      flushPara()
      blocks.push({ id: rid(), type: 'image', alt: img[1], url: img[2] })
      i++; continue
    }
    // divider
    if (/^---+\s*$/.test(ln)) {
      flushPara()
      blocks.push({ id: rid(), type: 'divider' })
      i++; continue
    }
    // callout
    if (ln.startsWith('> ')) {
      flushPara()
      const buf = [ln.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) { buf.push(lines[++i].slice(2)) }
      blocks.push({ id: rid(), type: 'callout', text: buf.join('\n') })
      i++; continue
    }
    // list
    if (/^[-*]\s+/.test(ln) || /^\d+\.\s+/.test(ln)) {
      flushPara()
      const ordered = /^\d+\.\s+/.test(ln)
      const items = []
      while (i < lines.length && (ordered ? /^\d+\.\s+/.test(lines[i]) : /^[-*]\s+/.test(lines[i]))) {
        items.push(lines[i].replace(/^([-*]|\d+\.)\s+/, ''))
        i++
      }
      blocks.push({ id: rid(), type: 'list', ordered, items })
      continue
    }
    // headings
    if (ln.startsWith('### ')) { flushPara(); blocks.push({ id: rid(), type: 'heading', level: 3, text: ln.slice(4) }); i++; continue }
    if (ln.startsWith('## ')) { flushPara(); blocks.push({ id: rid(), type: 'heading', level: 2, text: ln.slice(3) }); i++; continue }
    if (ln.startsWith('# ')) { flushPara(); blocks.push({ id: rid(), type: 'heading', level: 1, text: ln.slice(2) }); i++; continue }
    // empty line = paragraph break
    if (ln.trim() === '') {
      flushPara()
      i++; continue
    }
    para.push(ln)
    i++
  }
  flushPara()
  return blocks
}

// ── SERIALIZE blocks → markdown ──
function blocksToMarkdown(blocks) {
  return blocks.map(b => {
    switch (b.type) {
      case 'heading': return `${'#'.repeat(b.level)} ${b.text || ''}`
      case 'paragraph': return b.text || ''
      case 'code': return '```' + (b.language || '') + '\n' + (b.code || '') + '\n```'
      case 'list':
        return (b.items || []).map((it, i) => b.ordered ? `${i + 1}. ${it}` : `- ${it}`).join('\n')
      case 'callout': return (b.text || '').split('\n').map(l => '> ' + l).join('\n')
      case 'image': return `![${b.alt || ''}](${b.url || ''})`
      case 'video': return `@[youtube](${b.url || ''})`
      case 'divider': return '---'
      default: return ''
    }
  }).join('\n\n')
}

const rid = () => Math.random().toString(36).slice(2, 10)

const DEFAULTS = {
  heading: () => ({ id: rid(), type: 'heading', level: 2, text: '' }),
  paragraph: () => ({ id: rid(), type: 'paragraph', text: '' }),
  code: () => ({ id: rid(), type: 'code', language: 'python', code: '' }),
  list: () => ({ id: rid(), type: 'list', ordered: false, items: [''] }),
  callout: () => ({ id: rid(), type: 'callout', text: '' }),
  image: () => ({ id: rid(), type: 'image', alt: '', url: '' }),
  video: () => ({ id: rid(), type: 'video', url: '' }),
  divider: () => ({ id: rid(), type: 'divider' }),
}

const BLOCK_OPTIONS = [
  { type: 'heading', label: 'Titlu', icon: H2Icon, color: 'indigo' },
  { type: 'paragraph', label: 'Paragraf', icon: DocumentTextIcon, color: 'slate' },
  { type: 'code', label: 'Cod', icon: CodeBracketIcon, color: 'gray' },
  { type: 'list', label: 'Listă', icon: ListBulletIcon, color: 'emerald' },
  { type: 'callout', label: 'Notă', icon: ChatBubbleBottomCenterTextIcon, color: 'amber' },
  { type: 'image', label: 'Imagine', icon: PhotoIcon, color: 'pink' },
  { type: 'video', label: 'Video YouTube', icon: FilmIcon, color: 'red' },
  { type: 'divider', label: 'Separator', icon: MinusIcon, color: 'slate' },
]

// ── Inline format helper for preview (simple html) ──
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

// ── Preview renderer ──
function PreviewBlock({ b }) {
  switch (b.type) {
    case 'heading':
      if (b.level === 1) return <h1 className="text-2xl font-bold mt-4 mb-2 text-slate-900">{b.text || <em className="text-slate-300">(titlu gol)</em>}</h1>
      if (b.level === 3) return <h3 className="text-base font-semibold mt-3 mb-1 text-slate-800">{b.text || <em className="text-slate-300">(titlu gol)</em>}</h3>
      return <h2 className="text-xl font-bold mt-3 mb-2 text-slate-900">{b.text || <em className="text-slate-300">(titlu gol)</em>}</h2>
    case 'paragraph':
      return b.text
        ? <p className="text-slate-700 leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: inlineFmt(b.text).replace(/\n/g, '<br/>') }} />
        : <p className="text-slate-300 italic my-2">(paragraf gol)</p>
    case 'code':
      return (
        <div className="my-3">
          {b.language && <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{b.language}</div>}
          <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs font-mono">{b.code || <span className="text-slate-500"># cod gol</span>}</pre>
        </div>
      )
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul'
      const cls = b.ordered ? 'list-decimal list-inside space-y-1 my-2 text-slate-700' : 'list-disc list-inside space-y-1 my-2 text-slate-700'
      return (
        <Tag className={cls}>
          {(b.items || []).map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineFmt(it) || '<em class="text-slate-300">(item gol)</em>' }} />
          ))}
        </Tag>
      )
    }
    case 'callout':
      return (
        <div className="my-3 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 rounded-r-xl">
          {(b.text || '').split('\n').map((l, k) => (
            <p key={k} className="text-amber-900 text-sm" dangerouslySetInnerHTML={{ __html: inlineFmt(l) || '<em class="text-amber-300">(notă goală)</em>' }} />
          ))}
        </div>
      )
    case 'image':
      return b.url
        ? <img src={b.url} alt={b.alt || ''} className="my-3 rounded-xl max-w-full h-auto shadow" />
        : <div className="my-3 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 p-6 text-center text-slate-400 text-sm">📷 Imagine fără URL</div>
    case 'video': {
      const raw = (b.url || '').trim()
      let id = raw
      const m = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)
      if (m) id = m[1]
      return id
        ? <div className="aspect-video my-3 rounded-xl overflow-hidden bg-black"><iframe src={`https://www.youtube.com/embed/${id}`} className="w-full h-full" allowFullScreen /></div>
        : <div className="my-3 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 p-6 text-center text-slate-400 text-sm">🎬 Video fără URL</div>
    }
    case 'divider':
      return <hr className="my-5 border-t-2 border-slate-200" />
    default: return null
  }
}

// ── Block editor card ──
function BlockEditor({ block, idx, total, disabled, onChange, onMove, onRemove }) {
  const update = (patch) => onChange({ ...block, ...patch })
  const meta = BLOCK_OPTIONS.find(o => o.type === block.type)
  const Icon = meta?.icon || DocumentTextIcon

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl group hover:border-indigo-300 transition">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl">
        <Bars3Icon className="w-4 h-4 text-slate-400 cursor-grab" />
        <Icon className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{meta?.label || block.type}</span>
        <span className="text-[10px] text-slate-400 ml-1">#{idx + 1}</span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" disabled={disabled || idx === 0} onClick={() => onMove(idx, -1)}
            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30">
            <ArrowUpIcon className="w-3.5 h-3.5" />
          </button>
          <button type="button" disabled={disabled || idx === total - 1} onClick={() => onMove(idx, 1)}
            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30">
            <ArrowDownIcon className="w-3.5 h-3.5" />
          </button>
          <button type="button" disabled={disabled} onClick={() => onRemove(idx)}
            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30">
            <TrashIcon className="w-3.5 h-3.5" />
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
          <textarea
            value={block.text || ''} onChange={e => update({ text: e.target.value })} disabled={disabled}
            placeholder="Scrie un paragraf... Acceptă **bold**, *italic*, `cod`, [link](url)"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-400 resize-y"
          />
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
                  onChange={e => {
                    const items = [...block.items]
                    items[j] = e.target.value
                    update({ items })
                  }}
                  placeholder="Item..."
                  className="flex-1 px-2 py-1.5 border rounded text-sm outline-none focus:border-indigo-400"
                />
                <button type="button" disabled={disabled || block.items.length === 1} onClick={() => {
                  const items = block.items.filter((_, k) => k !== j)
                  update({ items })
                }} className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30">
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
          <textarea
            value={block.text || ''} onChange={e => update({ text: e.target.value })} disabled={disabled}
            placeholder="💡 O notă, observație, atenționare... (acceptă **bold**, `cod`)"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-amber-400 resize-y bg-amber-50/40"
          />
        )}

        {block.type === 'image' && (
          <div className="space-y-2">
            <input
              value={block.url || ''} onChange={e => update({ url: e.target.value })} disabled={disabled}
              placeholder="URL imagine (https://... sau /uploads/...)"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-400"
            />
            <input
              value={block.alt || ''} onChange={e => update({ alt: e.target.value })} disabled={disabled}
              placeholder="Descriere (alt text — pentru SEO și accesibilitate)"
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-indigo-400"
            />
          </div>
        )}

        {block.type === 'video' && (
          <input
            value={block.url || ''} onChange={e => update({ url: e.target.value })} disabled={disabled}
            placeholder="URL YouTube (https://youtube.com/watch?v=... sau ID direct)"
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-rose-400"
          />
        )}

        {block.type === 'divider' && (
          <div className="text-center text-slate-300 text-xs py-2">— separator vizual —</div>
        )}
      </div>
    </div>
  )
}

// ── Main Editor ──
export default function TheoryEditor({ value, onChange, disabled = false }) {
  // initialize from markdown only on first mount; after that, blocks are source of truth
  const [blocks, setBlocks] = useState(() => parseToBlocks(value || ''))
  const [view, setView] = useState('split') // 'edit' | 'split' | 'preview' | 'raw'
  const lastSerialized = useRef(value || '')

  const md = useMemo(() => {
    const out = blocksToMarkdown(blocks)
    if (out !== lastSerialized.current) {
      lastSerialized.current = out
      onChange?.(out)
    }
    return out
  }, [blocks])

  const update = (newBlocks) => setBlocks(newBlocks)
  const updateBlock = (i, b) => update(blocks.map((x, k) => k === i ? b : x))
  const removeBlock = (i) => update(blocks.filter((_, k) => k !== i))
  const moveBlock = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const arr = [...blocks]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    update(arr)
  }
  const addBlock = (type) => {
    if (!DEFAULTS[type]) return
    update([...blocks, DEFAULTS[type]()])
  }

  const replaceFromRaw = (raw) => {
    setBlocks(parseToBlocks(raw))
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-50 border border-slate-200 rounded-xl p-2">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">Vizualizare:</span>
        {[
          { k: 'edit', l: 'Editor' },
          { k: 'split', l: 'Editor + Preview' },
          { k: 'preview', l: 'Doar preview' },
          { k: 'raw', l: 'Markdown brut' },
        ].map(o => (
          <button key={o.k} type="button" onClick={() => setView(o.k)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition ${view === o.k ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            {o.l}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">{blocks.length} {blocks.length === 1 ? 'bloc' : 'blocuri'}</span>
      </div>

      {/* Raw markdown view */}
      {view === 'raw' && (
        <div className="space-y-2">
          <textarea
            value={md} onChange={e => replaceFromRaw(e.target.value)} disabled={disabled}
            rows={20}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl font-mono text-sm outline-none focus:border-indigo-400"
          />
          <p className="text-xs text-slate-500">⚠️ Editezi direct markdown-ul. Modificările vor fi reparseate în blocuri.</p>
        </div>
      )}

      {/* Edit / Split */}
      {(view === 'edit' || view === 'split') && (
        <div className={view === 'split' ? 'grid lg:grid-cols-2 gap-4' : ''}>
          {/* Editor column */}
          <div className="space-y-2">
            {blocks.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">Lecția nu are conținut. Adaugă primul bloc.</p>
              </div>
            ) : (
              blocks.map((b, i) => (
                <BlockEditor
                  key={b.id}
                  block={b}
                  idx={i}
                  total={blocks.length}
                  disabled={disabled}
                  onChange={(nb) => updateBlock(i, nb)}
                  onMove={moveBlock}
                  onRemove={removeBlock}
                />
              ))
            )}

            {/* Add block toolbar */}
            <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl p-3">
              <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                <PlusIcon className="w-3.5 h-3.5" /> Adaugă bloc
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {BLOCK_OPTIONS.map(o => {
                  const Icon = o.icon
                  return (
                    <button key={o.type} type="button" disabled={disabled} onClick={() => addBlock(o.type)}
                      className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-lg text-xs font-medium text-slate-700 disabled:opacity-50 transition">
                      <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{o.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Preview column */}
          {view === 'split' && (
            <div className="lg:sticky lg:top-4 lg:self-start">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                👁️ Preview live
              </div>
              <div className="bg-white border-2 border-slate-200 rounded-xl p-5 lg:max-h-[80vh] overflow-y-auto">
                {blocks.length === 0
                  ? <p className="text-sm text-slate-400 italic text-center py-10">Preview-ul va apărea aici...</p>
                  : blocks.map(b => <PreviewBlock key={b.id} b={b} />)
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview-only */}
      {view === 'preview' && (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
          {blocks.length === 0
            ? <p className="text-sm text-slate-400 italic text-center py-10">Lecția e goală. Comută la editor pentru a adăuga conținut.</p>
            : blocks.map(b => <PreviewBlock key={b.id} b={b} />)
          }
        </div>
      )}
    </div>
  )
}
