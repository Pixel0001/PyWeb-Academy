'use client'

/**
 * Numele contului, editabil pe loc. E și numele cu care se semnează
 * mesajele de WhatsApp ({{numele_meu}}).
 */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

export default function NumeCont({ nume, onSalvat }) {
  const [editez, setEditez] = useState(false)
  const [text, setText] = useState(nume || '')
  const [salvez, setSalvez] = useState(false)

  async function salveaza() {
    const curat = text.trim().replace(/\s+/g, ' ')
    if (curat === (nume || '')) return setEditez(false)
    setSalvez(true)
    try {
      const r = await fetch('/api/admin/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: curat }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Nu am putut salva numele')
      setEditez(false)
      toast.success(`Numele e acum „${d.name}"`)
      await onSalvat?.(d.name)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSalvez(false)
    }
  }

  if (!editez) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="font-medium text-gray-900">{nume || '—'}</span>
        <button
          type="button"
          onClick={() => {
            setText(nume || '')
            setEditez(true)
          }}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
          title="Schimbă numele"
        >
          <PencilSquareIcon className="h-4 w-4" />
        </button>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5">
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') salveaza()
          if (e.key === 'Escape') setEditez(false)
        }}
        className="w-48 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={salveaza}
        disabled={salvez || text.trim().length < 2}
        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {salvez ? 'Salvez…' : 'Salvează'}
      </button>
      <button type="button" onClick={() => setEditez(false)} className="text-xs text-gray-500 hover:underline">
        renunță
      </button>
    </span>
  )
}
