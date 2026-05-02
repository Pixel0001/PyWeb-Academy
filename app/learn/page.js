import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  CodeBracketIcon, BookOpenIcon, PuzzlePieceIcon, AcademicCapIcon,
  SparklesIcon, RocketLaunchIcon, LockClosedIcon, CheckCircleIcon,
  ChevronRightIcon, StarIcon, UserGroupIcon, ClockIcon, TrophyIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid'
import LearnPWARedirect from '@/components/public/LearnPWARedirect'

export const metadata = {
  title: 'Module de învățare online — PyWeb Academy',
  description: 'Platformă interactivă de programare pentru copii și adolescenți. Module structurate de Python, JavaScript, HTML și CSS cu exerciții și proiecte reale.',
  alternates: { canonical: 'https://pyweb.online/learn' },
  openGraph: {
    title: 'Învață programare pas cu pas — PyWeb Academy',
    description: 'Module interactive de Python, JS, HTML, CSS. Lecții cu teorie + exerciții, timer, feedback instant.',
    url: 'https://pyweb.online/learn',
    images: [{ url: 'https://pyweb.online/og-learn.jpg', width: 1200, height: 630 }],
  },
}

const MODULE_THEMES = [
  { gradient: 'from-amber-500 to-orange-500', soft: 'from-amber-50 to-orange-50', ring: 'ring-amber-200', dot: 'bg-amber-400', tag: 'bg-amber-100 text-amber-800' },
  { gradient: 'from-sky-500 to-blue-600', soft: 'from-sky-50 to-blue-50', ring: 'ring-sky-200', dot: 'bg-sky-400', tag: 'bg-sky-100 text-sky-800' },
  { gradient: 'from-emerald-500 to-teal-600', soft: 'from-emerald-50 to-teal-50', ring: 'ring-emerald-200', dot: 'bg-emerald-400', tag: 'bg-emerald-100 text-emerald-800' },
  { gradient: 'from-violet-500 to-purple-600', soft: 'from-violet-50 to-purple-50', ring: 'ring-violet-200', dot: 'bg-violet-400', tag: 'bg-violet-100 text-violet-800' },
  { gradient: 'from-rose-500 to-pink-600', soft: 'from-rose-50 to-pink-50', ring: 'ring-rose-200', dot: 'bg-rose-400', tag: 'bg-rose-100 text-rose-800' },
  { gradient: 'from-indigo-500 to-blue-600', soft: 'from-indigo-50 to-blue-50', ring: 'ring-indigo-200', dot: 'bg-indigo-400', tag: 'bg-indigo-100 text-indigo-800' },
]

const STATS = [
  { icon: UserGroupIcon, label: 'Elevi activi', value: '150+' },
  { icon: BookOpenIcon, label: 'Lecții interactive', value: '80+' },
  { icon: PuzzlePieceIcon, label: 'Exerciții & probleme', value: '400+' },
  { icon: TrophyIcon, label: 'Ani de experiență', value: '5+' },
]

const FEATURES = [
  { icon: AcademicCapIcon, title: 'Teorie structurată', desc: 'Fiecare lecție începe cu concepte explicate clar, cu exemple reale.' },
  { icon: PuzzlePieceIcon, title: 'Exerciții practice', desc: 'Probleme cu alegere multiplă, completare, cod și răspuns liber — cu timer.' },
  { icon: CheckSolid, title: 'Feedback instant', desc: 'Răspunsurile sunt verificate automat sau de profesor în mai puțin de 24h.' },
  { icon: RocketLaunchIcon, title: 'Progres vizibil', desc: 'Dashboard personal cu progres pe fiecare modul și lecție.' },
  { icon: LockClosedIcon, title: 'Acces protejat', desc: 'Cont personal cu link unic de acces. Siguranța datelor garantată.' },
  { icon: TrophyIcon, title: 'Avans la nivel următor', desc: 'Termini un modul → profesorul îți deblochează accesul la cel următor.' },
]

export default async function PublicLearnPage() {
  const modules = await prisma.learningModule.findMany({
    where: { active: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true, title: true, description: true, language: true,
      _count: { select: { lessons: true } },
      lessons: {
        where: { active: true },
        orderBy: { order: 'asc' },
        take: 5,
        select: { id: true, title: true, isFree: true, _count: { select: { problems: true } } },
      },
    },
  })

  const totalLessons = modules.reduce((s, m) => s + m._count.lessons, 0)
  const totalProblems = await prisma.problem.count({ where: { lesson: { active: true } } })

  return (
    <div className="min-h-screen bg-white">
      {/* Redirect PWA: dacă e deschis din Home Screen, merge la /learn/[token] */}
      <LearnPWARedirect />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm font-semibold mb-6 ring-1 ring-white/20">
            <SparklesIcon className="w-4 h-4 text-yellow-300" />
            Platformă interactivă de programare pentru copii
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Învață să programezi<br />
            <span className="text-yellow-300">pas cu pas</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Module structurate de <strong className="text-white">Python, JavaScript, HTML și CSS</strong> — cu lecții interactive,
            exerciții cu feedback instant și progres vizibil după fiecare sesiune.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/inscriere"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-amber-900 font-bold text-lg rounded-2xl shadow-lg transition hover:-translate-y-0.5">
              <RocketLaunchIcon className="w-5 h-5" />
              Înscrie-te gratuit
            </Link>
            <a href="#module"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-semibold text-lg rounded-2xl ring-1 ring-white/30 transition">
              <BookOpenIcon className="w-5 h-5" />
              Vezi modulele
            </a>
            <Link href="/learn/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold text-lg rounded-2xl ring-1 ring-white/20 transition">
              <AcademicCapIcon className="w-5 h-5" />
              Autentificare elev
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-white/20">
                <s.icon className="w-6 h-6 text-yellow-300 mb-1.5 mx-auto" />
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-xs text-white/70 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CUM FUNCȚIONEAZĂ ─────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Cum funcționează platforma?</h2>
            <p className="mt-3 text-slate-600 text-lg max-w-xl mx-auto">
              Un sistem de învățare gândit pentru copii și adolescenți (10–18 ani), fără experiență anterioară.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 ring-1 ring-slate-200 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES GRID ─────────────────────────────────────────────── */}
      <section id="module" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Module disponibile</h2>
            <p className="mt-3 text-slate-600 text-lg">
              {modules.length} module · {totalLessons} lecții · {totalProblems}+ exerciții
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {modules.map((m, idx) => {
              const theme = MODULE_THEMES[idx % MODULE_THEMES.length]
              return (
                <div key={m.id} className={`rounded-3xl overflow-hidden ring-1 ${theme.ring} shadow-sm hover:shadow-xl transition-shadow`}>
                  {/* Header */}
                  <div className={`bg-gradient-to-br ${theme.soft} p-6 border-b border-white/60`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                        <CodeBracketIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${theme.tag}`}>
                            Modul {idx + 1}
                          </span>
                          {m.language && (
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900 text-white">
                              {m.language}
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-900">{m.title}</h3>
                        {m.description && <p className="text-slate-600 text-sm mt-1">{m.description}</p>}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpenIcon className="w-4 h-4" /> {m._count.lessons} lecții
                      </span>
                    </div>
                  </div>

                  {/* Lesson preview */}
                  <div className="bg-white p-5 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Primele lecții</p>
                    {m.lessons.map((l, li) => (
                      <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${li === 0 ? `bg-gradient-to-br ${theme.gradient} text-white` : 'bg-slate-100 text-slate-600'}`}>
                          {li === 0 ? <StarIcon className="w-4 h-4" /> : li + 1}
                        </div>
                        <span className="text-sm text-slate-800 flex-1">{l.title}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {l.isFree && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                              Gratis
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5">
                            <PuzzlePieceIcon className="w-3 h-3" /> {l._count.problems}
                          </span>
                          {!l.isFree && <LockClosedIcon className="w-3.5 h-3.5 text-slate-300" />}
                        </div>
                      </div>
                    ))}
                    {m._count.lessons > 5 && (
                      <p className="text-center text-xs text-slate-400 pt-1">
                        + {m._count.lessons - 5} lecții disponibile după înscriere
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALE RAPIDE ───────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-50 to-indigo-50 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Ce spun părinții</h2>
          <p className="text-slate-600 text-lg mb-10">Feedback real de la familii care studiază la PyWeb Academy.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Maria C.', role: 'Mamă, elev 13 ani', text: 'Fiul meu a creat primul joc în Python după 2 luni. Modulele sunt structurate perfect.' },
              { name: 'Alexandru T.', role: 'Tată, elev 15 ani', text: 'Platforma e foarte intuitivă. Îmi place că văd exact ce lecții a terminat și cât timp a petrecut.' },
              { name: 'Elena M.', role: 'Mamă, elev 12 ani', text: 'Lecția gratuită ne-a convins imediat. Profesorii sunt răbdători și exercițiile sunt interesante.' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-5 ring-1 ring-slate-200 shadow-sm text-left">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-700 mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-20 text-white text-center">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4">
          <RocketLaunchIcon className="w-14 h-14 mx-auto mb-5 text-yellow-300" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Gata să începi?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Prima lecție este <strong className="text-white">100% gratuită</strong>, fără card și fără angajament.
            Te contactăm în mai puțin de 24 de ore.
          </p>
          <Link href="/inscriere"
            className="inline-flex items-center gap-2 px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-amber-900 font-bold text-xl rounded-2xl shadow-2xl transition hover:-translate-y-0.5">
            <SparklesIcon className="w-6 h-6" />
            Înscrie-te gratuit acum
          </Link>
          <p className="mt-4 text-white/60 text-sm">
            Sau sună-ne direct — <a href="tel:+37368000000" className="underline text-white/80 hover:text-white">+373 68 000 000</a>
          </p>
        </div>
      </section>
    </div>
  )
}
