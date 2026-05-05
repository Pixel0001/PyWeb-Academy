// Guest dashboard pentru /learn — fără cont, fără DB writes, fără AI.
// Listează modulele active. Doar lecțiile FREE sunt accesibile (link-uri activate).
// Restul lecțiilor se afișează blocate cu CTA către /inscriere.

export const revalidate = 3600 // cache 1 oră — toate guest-urile văd același conținut

import Link from 'next/link'
import prisma from '@/lib/prisma'
import {
  PuzzlePieceIcon, BookOpenIcon, LockClosedIcon, ChevronRightIcon,
  AcademicCapIcon, SparklesIcon, RocketLaunchIcon, ChevronLeftIcon,
} from '@heroicons/react/24/outline'

const MODULE_THEMES = [
  { from: 'from-amber-400', to: 'to-orange-500', soft: 'from-amber-50 to-orange-50', ring: 'ring-amber-200' },
  { from: 'from-yellow-400', to: 'to-amber-500', soft: 'from-yellow-50 to-amber-50', ring: 'ring-yellow-200' },
  { from: 'from-rose-400', to: 'to-pink-500', soft: 'from-rose-50 to-pink-50', ring: 'ring-rose-200' },
  { from: 'from-sky-400', to: 'to-blue-500', soft: 'from-sky-50 to-blue-50', ring: 'ring-sky-200' },
  { from: 'from-emerald-400', to: 'to-teal-500', soft: 'from-emerald-50 to-teal-50', ring: 'ring-emerald-200' },
  { from: 'from-violet-400', to: 'to-purple-500', soft: 'from-violet-50 to-purple-50', ring: 'ring-violet-200' },
]

export const metadata = {
  title: 'Mod demo — PyWeb Academy',
  description: 'Încearcă platforma PyWeb Academy fără cont. Lecții gratuite și exerciții interactive.',
  robots: { index: false, follow: false },
}

export default async function GuestDashboard() {
  const modules = await prisma.learningModule.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true, title: true, description: true, language: true, order: true,
      lessons: {
        where: { active: true },
        orderBy: { order: 'asc' },
        select: {
          id: true, title: true, slug: true, order: true, isFree: true,
          _count: { select: { problems: true } },
        },
      },
    },
  })

  const totalFreeLessons = modules.reduce((s, m) => s + m.lessons.filter(l => l.isFree).length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
      {/* Top bar */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/learn" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition shrink-0">
            <ChevronLeftIcon className="w-4 h-4" /> <span className="hidden sm:inline">Înapoi</span>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <AcademicCapIcon className="w-6 h-6 text-blue-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">Mod demo</div>
            <h1 className="font-extrabold text-lg sm:text-xl truncate">PyWeb Academy — vizitator</h1>
          </div>
          <Link href="/learn/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-bold transition">
            Autentifică-te
          </Link>
        </div>
      </header>

      {/* Guest banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-start sm:items-center gap-3 flex-wrap">
          <div className="flex items-start gap-2 flex-1 min-w-[200px] text-amber-900 text-sm">
            <SparklesIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong>Bine ai venit în modul demo!</strong> Poți parcurge teorie și încerca probleme la <strong>{totalFreeLessons}</strong> lecții gratuite.
              Progresul tău <em>nu se salvează</em>, AI și submisiile sunt dezactivate.
            </div>
          </div>
          <Link href="/inscriere"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition shrink-0">
            <RocketLaunchIcon className="w-4 h-4" /> Înscrie-te gratuit
          </Link>
        </div>
      </div>

      {/* Modules */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Module disponibile</h2>
          <p className="text-sm text-slate-600 mt-1">Apasă pe o lecție gratuită ca să o încerci în mod demo.</p>
        </div>

        {modules.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-slate-400">
            Nu există module active momentan.
          </div>
        )}

        {modules.map((m, mi) => {
          const theme = MODULE_THEMES[mi % MODULE_THEMES.length]
          const freeCount = m.lessons.filter(l => l.isFree).length
          return (
            <section key={m.id} className={`bg-gradient-to-br ${theme.soft} rounded-2xl shadow-sm overflow-hidden ring-1 ${theme.ring}`}>
              <div className={`bg-gradient-to-r ${theme.from} ${theme.to} text-white px-5 py-4 flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 font-extrabold text-lg">
                  {mi + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-lg truncate">{m.title}</h3>
                  {m.description && <p className="text-white/80 text-xs truncate">{m.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase tracking-wider text-white/70 font-bold">{m.language || ''}</div>
                  <div className="text-xs font-bold">{freeCount} / {m.lessons.length} gratuite</div>
                </div>
              </div>

              <div className="p-3 sm:p-4 space-y-1.5">
                {m.lessons.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-6">Nicio lecție în acest modul.</div>
                )}
                {m.lessons.map((l, li) => {
                  if (l.isFree) {
                    return (
                      <Link
                        key={l.id}
                        href={`/learn/guest/lesson/${l.id}`}
                        className="flex items-center gap-3 px-3 py-3 bg-white hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-200 transition group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {li + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 text-sm truncate">{l.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <PuzzlePieceIcon className="w-3.5 h-3.5" />
                            {l._count.problems} {l._count.problems === 1 ? 'problemă' : 'probleme'}
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider">Gratuit</span>
                          </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-blue-600 shrink-0 transition" />
                      </Link>
                    )
                  }
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-3 py-3 bg-white/50 rounded-xl opacity-70">
                      <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                        <LockClosedIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-500 text-sm truncate">{l.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Doar pentru elevi înscriși</div>
                      </div>
                      <Link href="/inscriere"
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 underline shrink-0">
                        Deblochează
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <RocketLaunchIcon className="w-7 h-7 text-blue-900" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-extrabold">Vrei tot conținutul, AI tutor și progres salvat?</h3>
              <p className="text-blue-100 text-sm mt-2">
                Înscrie-te gratuit și beneficiezi de toate lecțiile, Mr. PyWeb (AI tutor),
                feedback de la profesor și salvare automată a progresului tău.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link href="/inscriere"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-900 rounded-xl font-bold text-sm transition">
                  <RocketLaunchIcon className="w-4 h-4" /> Înscrie-te gratuit
                </Link>
                <Link href="/learn/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-sm transition">
                  <BookOpenIcon className="w-4 h-4" /> Am deja cont
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
