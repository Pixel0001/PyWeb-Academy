export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import RandomProblemsRunner from '@/components/public/RandomProblemsRunner'
import { LockClosedIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { getStudentLearningAccess } from '@/lib/learning-access'

export default async function RandomPage({ params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({ where: { accessToken: token }, select: { id: true, fullName: true, active: true } })
  if (!student) notFound()
  if (student.active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md bg-white rounded-2xl shadow-lg border border-rose-200 p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900">Cont dezactivat</h1>
          <p className="text-sm text-gray-600 mt-2">Contul tău este momentan dezactivat.</p>
        </div>
      </div>
    )
  }

  // Antrenamentul aleatoriu necesită abonament activ
  const access = await getStudentLearningAccess(student.id)
  if (!access.canAccessRandom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-rose-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-rose-100 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Antrenament dezactivat</h1>
          <p className="text-slate-600 text-sm mb-2">
            Probleme aleatorii sunt disponibile doar cu abonament activ.
          </p>
          <p className="text-slate-500 text-sm mb-5">
            Vorbește cu profesorul pentru a achita abonamentul. <span className="text-emerald-600 font-semibold">Progresul tău este salvat.</span>
          </p>
          <Link href={`/learn/${token}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
            <ChevronLeftIcon className="w-4 h-4" /> Înapoi la modulele tale
          </Link>
        </div>
      </div>
    )
  }

  const modules = await prisma.learningModule.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: { id: true, slug: true, title: true, language: true },
  })

  return <RandomProblemsRunner token={token} student={student} modules={modules} />
}
