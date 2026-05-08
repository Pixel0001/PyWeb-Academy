export const revalidate = 60 // ISR: profil revalidat la fiecare 60s

import { Suspense } from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getStudentByToken, preloadStudent } from '@/lib/student-cache'
import ProfilLoading from './loading'
import {
  ArrowLeftIcon, UserCircleIcon, AcademicCapIcon, BookOpenIcon,
  CurrencyDollarIcon, CalendarDaysIcon, CheckCircleIcon, XCircleIcon,
  ClockIcon, CreditCardIcon, ChartBarIcon, MapPinIcon, LockClosedIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL = {
  ACTIVE: { label: 'Activ', cls: 'bg-emerald-100 text-emerald-800' },
  PAUSED: { label: 'Pauză', cls: 'bg-amber-100 text-amber-800' },
  LEFT: { label: 'Plecat', cls: 'bg-slate-200 text-slate-700' },
  COMPLETED: { label: 'Finalizat', cls: 'bg-blue-100 text-blue-800' },
  TRANSFERRED: { label: 'Transferat', cls: 'bg-purple-100 text-purple-800' },
}

async function ProfilContent({ token }) {

  const student = await getStudentByToken(token)
  if (!student) notFound()

  // ── BATCH 2: groupStudents se pornește primul (necesar pentru gsIds la payments) ──
  // Toate celelalte query-uri pornesc în paralel imediat; payments pornește imediat ce
  // groupStudents se întoarce (race pattern — nu mai există BATCH 3 secvențial).
  const groupStudentsPromise = prisma.groupStudent.findMany({
    where: { studentId: student.id },
    include: {
      group: {
        include: {
          course: { select: { title: true, slug: true } },
          teacher: { select: { name: true } },
          branch: { select: { name: true, address: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  // Pornim payments în paralel cu restul imediat ce avem gsIds
  const paymentsPromise = groupStudentsPromise.then(gs => {
    const gsIds = gs.map(g => g.id)
    if (!gsIds.length) return []
    return prisma.payment.findMany({
      where: { groupStudentId: { in: gsIds } },
      include: {
        groupStudent: { include: { group: { include: { course: { select: { title: true } } } } } },
      },
      orderBy: { paymentDate: 'desc' },
      take: 30,
    })
  })

  const [groupStudents, learningPayments, transactions, attendances, lessonProgresses, totalSubs, gradedSubs, payments] = await Promise.all([
    groupStudentsPromise,
    prisma.learningPayment.findMany({
      where: { studentId: student.id },
      orderBy: { paymentDate: 'desc' },
      take: 20,
    }),
    prisma.lessonTransaction.findMany({
      where: { studentId: student.id },
      include: { group: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id },
      include: {
        session: {
          select: {
            date: true,
            group: { select: { name: true, course: { select: { title: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.lessonProgress.findMany({
      where: { studentId: student.id, completedAt: { not: null } },
      include: { lesson: { select: { title: true, module: { select: { title: true, slug: true } } } } },
      orderBy: { completedAt: 'desc' },
      take: 20,
    }),
    prisma.problemSubmission.count({ where: { studentId: student.id } }),
    prisma.problemSubmission.count({ where: { studentId: student.id, status: 'GRADED' } }),
    paymentsPromise,
  ])

  const totalLessonsRemaining = groupStudents.reduce((sum, gs) => sum + (gs.lessonsRemaining || 0), 0)
  const activeGroups = groupStudents.filter(gs => gs.status === 'ACTIVE')
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length
  const absentCount = attendances.filter(a => a.status === 'ABSENT').length

  const latestLearningPayment = learningPayments[0]
  const learningExpired = latestLearningPayment
    ? new Date(latestLearningPayment.expiresAt) < new Date()
    : true

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/learn/${token}`}
            className="p-2 rounded-lg hover:bg-white transition"
            aria-label="Înapoi la dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-700" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">Cabinetul meu</h1>
            <p className="text-slate-500 text-sm">Cursuri, plăți și istoric lecții</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden mb-6">
          {/* Banner area — primește background dacă PROFILE_BANNER e echipat */}
          <div className="pyweb-profile-banner h-20 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <div className="p-5 -mt-8">
          <div className="flex items-start gap-4">
            <div className="pyweb-me-avatar w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 ring-4 ring-white">
              <UserCircleIcon className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0 pt-8">
              <h2 className="pyweb-me-name text-xl font-bold text-slate-900 leading-tight">{student.fullName}</h2>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {student.superStudent && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-[11px] font-bold">⭐ Super Student</span>
                )}
                {student.age && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-semibold">{student.age} ani</span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm text-slate-600">
                {student.parentName && <div><span className="text-slate-400">Părinte:</span> {student.parentName}</div>}
                {student.parentEmail && <div><span className="text-slate-400">Email:</span> {student.parentEmail}</div>}
                {student.parentPhone && <div><span className="text-slate-400">Telefon:</span> {student.parentPhone}</div>}
                <div><span className="text-slate-400">Înscris la:</span> {fmtDate(student.createdAt)}</div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-200">
            <BookOpenIcon className="w-5 h-5 text-blue-600 mb-1.5" />
            <div className="text-2xl font-extrabold text-slate-900">{totalLessonsRemaining}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Lecții rămase</div>
          </div>
          <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-200">
            <AcademicCapIcon className="w-5 h-5 text-emerald-600 mb-1.5" />
            <div className="text-2xl font-extrabold text-slate-900">{activeGroups.length}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Grupe active</div>
          </div>
          <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-200">
            <CheckCircleIcon className="w-5 h-5 text-violet-600 mb-1.5" />
            <div className="text-2xl font-extrabold text-slate-900">{lessonProgresses.length}</div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Lecții terminate</div>
          </div>
          <div className="bg-white rounded-2xl p-4 ring-1 ring-slate-200">
            <ChartBarIcon className="w-5 h-5 text-amber-600 mb-1.5" />
            <div className="text-2xl font-extrabold text-slate-900">{gradedSubs}<span className="text-slate-400 text-base font-normal">/{totalSubs}</span></div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Probleme corectate</div>
          </div>
        </div>

        {/* Grupe / Cursuri */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AcademicCapIcon className="w-5 h-5 text-emerald-600" /> Cursurile mele
          </h3>
          {groupStudents.length === 0 ? (
            <p className="text-sm text-slate-500">Nu ești înscris în nicio grupă momentan.</p>
          ) : (
            <div className="space-y-3">
              {groupStudents.map(gs => {
                const status = STATUS_LABEL[gs.status] || { label: gs.status, cls: 'bg-slate-100 text-slate-700' }
                return (
                  <div key={gs.id} className="border border-slate-200 rounded-xl p-3.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900">{gs.group?.course?.title || '—'}</div>
                        <div className="text-sm text-slate-600">Grupa: <span className="font-medium">{gs.group?.name}</span></div>
                        {gs.group?.teacher?.name && (
                          <div className="text-xs text-slate-500 mt-0.5">Profesor: {gs.group.teacher.name}</div>
                        )}
                        {gs.group?.scheduleDays?.length > 0 && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3 shrink-0" />
                            {gs.group.scheduleDays.join(', ')} {gs.group.scheduleTime && `· ${gs.group.scheduleTime}`}
                          </div>
                        )}
                        {gs.group?.branch?.name && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3 shrink-0" />
                            {gs.group.branch.name}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${status.cls}`}>{status.label}</span>
                        <div className="text-right">
                          <div className="text-xl font-extrabold text-blue-700">{gs.lessonsRemaining}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Lecții rămase</div>
                        </div>
                      </div>
                    </div>
                    {gs.statusNote && (
                      <div className="mt-2 text-xs text-slate-500 italic">„{gs.statusNote}”</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Plăți pentru curs (în clasă) */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-emerald-600" /> Plăți curs
            </h3>
            {payments.length > 0 && (
              <div className="text-sm text-slate-600">
                Total achitat: <span className="font-bold text-emerald-700">{totalPaid.toFixed(2)} MDL</span>
              </div>
            )}
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">Nicio plată înregistrată.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-left text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-2 py-2 font-semibold">Data</th>
                    <th className="px-2 py-2 font-semibold">Curs / Grupa</th>
                    <th className="px-2 py-2 font-semibold text-right">Sumă</th>
                    <th className="px-2 py-2 font-semibold text-center">Lecții</th>
                    <th className="px-2 py-2 font-semibold">Metodă</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-2 text-slate-700 whitespace-nowrap">{fmtDate(p.paymentDate)}</td>
                      <td className="px-2 py-2 text-slate-700">
                        <div className="font-medium">{p.groupStudent?.group?.course?.title || p.courseTitleSnapshot || '—'}</div>
                        <div className="text-xs text-slate-500">{p.groupStudent?.group?.name || p.groupNameSnapshot || ''}</div>
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">{(p.amount || 0).toFixed(2)} MDL</td>
                      <td className="px-2 py-2 text-center text-slate-700">{p.lessonsAdded ?? '—'}</td>
                      <td className="px-2 py-2 text-slate-500 text-xs">{p.paymentMethod || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Abonament platformă (learning) */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-blue-600" /> Abonament platformă online
          </h3>
          {latestLearningPayment ? (
            <div className={`rounded-xl p-3.5 mb-3 ${learningExpired ? 'bg-rose-50 ring-1 ring-rose-200' : 'bg-emerald-50 ring-1 ring-emerald-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className={`text-sm font-bold flex items-center gap-1.5 ${learningExpired ? 'text-rose-900' : 'text-emerald-900'}`}>
                    {learningExpired
                      ? <><LockClosedIcon className="w-4 h-4" /> Expirat</>
                      : <><CheckCircleSolid className="w-4 h-4" /> Activ</>
                    }
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Expiră: {fmtDate(latestLearningPayment.expiresAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{(latestLearningPayment.amount || 0).toFixed(2)} MDL</div>
                  <div className="text-[10px] text-slate-500">{fmtDate(latestLearningPayment.paymentDate)}</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-3">Niciun abonament la platformă.</p>
          )}
          {learningPayments.length > 1 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600 font-medium">Istoric ({learningPayments.length})</summary>
              <ul className="mt-2 space-y-1.5">
                {learningPayments.slice(1).map(lp => (
                  <li key={lp.id} className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-1.5 last:border-0">
                    <span>{fmtDate(lp.paymentDate)} → {fmtDate(lp.expiresAt)}</span>
                    <span className="font-bold">{(lp.amount || 0).toFixed(2)} MDL</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* Istoric prezență */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-violet-600" /> Istoric lecții (prezență)
            </h3>
            {attendances.length > 0 && (
              <div className="text-xs text-slate-600 flex gap-3">
                <span className="flex items-center gap-1"><CheckCircleIcon className="w-4 h-4 text-emerald-600" /> {presentCount} prezent</span>
                <span className="flex items-center gap-1"><XCircleIcon className="w-4 h-4 text-rose-500" /> {absentCount} absent</span>
              </div>
            )}
          </div>
          {attendances.length === 0 ? (
            <p className="text-sm text-slate-500">Niciun istoric de prezență încă.</p>
          ) : (
            <ul className="space-y-1.5">
              {attendances.map(a => (
                <li key={a.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.status === 'PRESENT'
                      ? <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      : <XCircleIcon className="w-4 h-4 text-rose-500 shrink-0" />
                    }
                    <div className="min-w-0">
                      <div className="text-sm text-slate-900 truncate">
                        {a.session?.group?.course?.title || '—'} <span className="text-slate-400">·</span> {a.session?.group?.name}
                      </div>
                      <div className="text-xs text-slate-500">{fmtDateTime(a.session?.date)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tranzacții lecții (audit) */}
        {transactions.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-slate-600" /> Tranzacții lecții
            </h3>
            <ul className="space-y-1.5 text-sm">
              {transactions.map(t => (
                <li key={t.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                  <div className="min-w-0">
                    <span className={`font-bold ${t.delta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {t.delta > 0 ? '+' : ''}{t.delta}
                    </span>
                    <span className="text-slate-700 ml-2">{t.reason || (t.delta < 0 ? 'Lecție folosită' : 'Lecție adăugată')}</span>
                    <span className="text-slate-400 text-xs ml-2">· {t.group?.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{fmtDate(t.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Lecții online completate */}
        {lessonProgresses.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5 text-blue-600" /> Lecții online completate
            </h3>
            <ul className="space-y-1.5 text-sm">
              {lessonProgresses.map(p => (
                <li key={p.lessonId} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{p.lesson?.title}</div>
                    <div className="text-xs text-slate-500">{p.lesson?.module?.title}</div>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{fmtDate(p.completedAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

export default async function StudentProfilePage({ params }) {
  const { token } = await params
  // Warm React cache — ProfilContent gets a cache hit on student (~0ms)
  preloadStudent(token)
  return (
    <Suspense fallback={<ProfilLoading />}>
      <ProfilContent token={token} />
    </Suspense>
  )
}
