// Guest dashboard pentru /learn — fara cont, fara DB writes, fara AI.
// Listeaza modulele active. Doar lectiile FREE sunt accesibile (link-uri activate).
// Restul lectiilor se afiseaza blocate cu CTA catre /inscriere.

export const revalidate = 3600 // cache 1 ora — toate guest-urile vad acelasi continut

import Link from 'next/link'
import prisma from '@/lib/prisma'
import {
  BookOpenIcon, RocketLaunchIcon, ChevronLeftIcon,
  AcademicCapIcon, SparklesIcon,
  TrophyIcon, BoltIcon, ChatBubbleLeftRightIcon,
  ShieldCheckIcon, FireIcon, UserGroupIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import GuestModuleAccordion from '@/components/learn/GuestModuleAccordion'

const MODULE_THEMES = [
  { from: 'from-amber-400', to: 'to-orange-500', soft: 'from-amber-50 to-orange-50', ring: 'ring-amber-200' },
  { from: 'from-yellow-400', to: 'to-amber-500', soft: 'from-yellow-50 to-amber-50', ring: 'ring-yellow-200' },
  { from: 'from-rose-400', to: 'to-pink-500', soft: 'from-rose-50 to-pink-50', ring: 'ring-rose-200' },
  { from: 'from-sky-400', to: 'to-blue-500', soft: 'from-sky-50 to-blue-50', ring: 'ring-sky-200' },
  { from: 'from-emerald-400', to: 'to-teal-500', soft: 'from-emerald-50 to-teal-50', ring: 'ring-emerald-200' },
  { from: 'from-violet-400', to: 'to-purple-500', soft: 'from-violet-50 to-purple-50', ring: 'ring-violet-200' },
]

const BENEFITS = [
  {
    icon: BookOpenIcon,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    title: 'Toate lecțiile deblocate',
    desc: 'Acces la 100% din conținut — teorie, exerciții și proiecte pentru fiecare modul.',
  },
  {
    icon: SparklesIcon,
    color: 'text-violet-600',
    bg: 'bg-violet-100',
    title: 'Mr. PyWeb — AI Tutor',
    desc: 'Întreabă AI-ul orice, primești explicații personalizate și feedback instant pe codul tău.',
  },
  {
    icon: CheckSolid,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    title: 'Progres salvat automat',
    desc: 'Lecțiile completate, XP-ul și nivelul tău se salvează și te așteaptă la revenire.',
  },
  {
    icon: TrophyIcon,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    title: 'Clasament & niveluri XP',
    desc: 'Câștigă XP la fiecare problemă rezolvată și urcă în clasamentul platformei.',
  },
  {
    icon: ChatBubbleLeftRightIcon,
    color: 'text-sky-600',
    bg: 'bg-sky-100',
    title: 'Feedback de la profesor',
    desc: 'Soluțiile tale ajung la profesor pentru recenzie, notare și feedback detaliat.',
  },
  {
    icon: FireIcon,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    title: 'Antrenament aleator',
    desc: 'Rezolvă probleme aleatoare din toată platforma pentru a-ți testa cunoștințele.',
  },
  {
    icon: BoltIcon,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    title: 'Bonus XP de la profesor',
    desc: 'Profesorul poate acorda puncte bonus pentru progres excepțional.',
  },
  {
    icon: UserGroupIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    title: 'Comunitate & notificări',
    desc: 'Primești notificări când ai teme de refăcut și faci parte din grupul tău.',
  },
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
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <Link href="/learn" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition shrink-0 p-1.5 rounded-lg hover:bg-white/10">
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Înapoi</span>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
            <AcademicCapIcon className="w-5 h-5 text-blue-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold leading-none">Mod demo</div>
            <h1 className="font-extrabold text-base sm:text-lg truncate leading-tight">PyWeb Academy — vizitator</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/learn/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-bold transition">
              Am cont
            </Link>
            <Link href="/inscriere"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-blue-900 rounded-lg text-sm font-bold transition">
              <RocketLaunchIcon className="w-3.5 h-3.5" />
              <span>Înscrie-te</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Hero banner */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-2xl p-5 sm:p-7 text-white shadow-lg overflow-hidden relative">
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-6 w-36 h-36 bg-amber-400/10 rounded-full pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/20 text-amber-300 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-3">
                <SparklesIcon className="w-3 h-3" /> Bine ai venit în modul demo
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Încearcă PyWeb Academy<br />
                <span className="text-amber-300">fără cont</span>
              </h2>
              <p className="text-blue-200 text-sm mt-2 leading-relaxed">
                Parcurge teorie și rezolvă exerciții la{' '}
                <strong className="text-white">{totalFreeLessons} lecții gratuite</strong> din{' '}
                {totalLessons} disponibile. Progresul nu se salvează și AI-ul este dezactivat.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 shrink-0">
              <Link href="/inscriere"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-blue-900 rounded-xl font-extrabold text-sm transition shadow-md active:scale-95">
                <RocketLaunchIcon className="w-4 h-4" />
                Înscrie-te gratuit
              </Link>
              <Link href="/learn/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition">
                <BookOpenIcon className="w-4 h-4" />
                Am deja cont
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits — ce pierzi fara abonament */}
        <div className="bg-white rounded-2xl shadow-md ring-1 ring-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Ce pierzi fără abonament</h3>
              <p className="text-xs text-slate-500">Înscrie-te pentru a debloca toate funcționalitățile platformei</p>
            </div>
          </div>
          <div className="p-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {BENEFITS.map((b, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 rounded-lg ${b.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <b.icon className={`w-4 h-4 ${b.color}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 leading-snug">{b.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <Link href="/inscriere"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-extrabold text-sm transition shadow-sm active:scale-[0.99]">
              <RocketLaunchIcon className="w-4 h-4" />
              Deblochează tot — Înscrie-te gratuit
            </Link>
          </div>
        </div>

        {/* Modules heading */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Module disponibile</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Apasă pe un modul ca să îl deschizi, apoi alege o lecție gratuită.
          </p>
        </div>

        {modules.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-slate-400">
            Nu exista module active momentan.
          </div>
        )}

        <div className="space-y-4">
          {modules.map((m, mi) => (
            <GuestModuleAccordion
              key={m.id}
              module={m}
              moduleIndex={mi}
              theme={MODULE_THEMES[mi % MODULE_THEMES.length]}
              defaultOpen={mi === 0}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
              <RocketLaunchIcon className="w-8 h-8 text-blue-900" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">
                Vrei tot conținutul, AI tutor și progres salvat?
              </h3>
              <p className="text-blue-200 text-sm mt-1.5 leading-relaxed">
                Înscrie-te gratuit și beneficiezi de toate lecțiile, Mr. PyWeb (AI tutor),
                feedback de la profesor și salvare automată a progresului tău.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link href="/inscriere"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-900 rounded-xl font-bold text-sm transition shadow active:scale-95">
                  <RocketLaunchIcon className="w-4 h-4" /> Înscrie-te gratuit
                </Link>
                <Link href="/learn/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-sm transition">
                  <BookOpenIcon className="w-4 h-4" /> Am deja cont
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </main>
    </div>
  )
}
