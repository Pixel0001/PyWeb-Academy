'use client'
import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function ModuleAccordion({ defaultOpen, header, progressBar, children, moduleId }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div id={`module-${moduleId}`}>
      {/* Clickable header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left"
        aria-expanded={open}
      >
        {header}

        {/* Chevron row */}
        <div className="flex items-center justify-between px-5 py-2 bg-white border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {open ? 'Ascunde lecțiile' : 'Arată lecțiile'}
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Progress bar — always visible */}
      {progressBar}

      {/* Lessons — collapsible */}
      {open && children}
    </div>
  )
}
