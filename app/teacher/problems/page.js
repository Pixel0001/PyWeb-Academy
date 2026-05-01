export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

const DIFF_LABEL = { EASY: '🟢 Ușor', MEDIUM: '🟡 Mediu', HARD: '🔴 Greu' }
const TYPE_LABEL = { MULTIPLE_CHOICE: 'Grilă', SHORT_ANSWER: 'Răspuns scurt', CODING: 'Cod', INPUT_OUTPUT: 'I/O' }

export default async function TeacherProblemsPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const sp = (await searchParams) || {}
  const topic = sp.topic || undefined
  const difficulty = sp.difficulty || undefined

  const where = { active: true }
  if (topic) where.topic = topic
  if (difficulty) where.difficulty = difficulty

  const [problems, topics] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { _count: { select: { attempts: true, submissions: true } } },
    }),
    prisma.problem.findMany({ where: { active: true }, distinct: ['topic'], select: { topic: true } }),
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold">🧠 Banca de Probleme</h1>
          <p className="text-sm text-gray-600">Vezi & creează probleme pentru elevii tăi</p>
        </div>
        <Link href="/admin/problems/new" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">
          + Adaugă problemă
        </Link>
      </div>

      <form className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-wrap gap-2" method="GET">
        <select name="topic" defaultValue={topic || ''} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Toate topic-urile</option>
          {[...new Set(topics.map(t => t.topic).filter(Boolean))].sort().map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="difficulty" defaultValue={difficulty || ''} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Toate dificultățile</option>
          <option value="EASY">EASY</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HARD">HARD</option>
        </select>
        <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">Filtrează</button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Titlu</th>
                <th className="px-4 py-3 text-left">Topic</th>
                <th className="px-4 py-3 text-left">Tip</th>
                <th className="px-4 py-3 text-left">Diff</th>
                <th className="px-4 py-3 text-left">Folosiri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {problems.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nicio problemă.</td></tr>
              ) : problems.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-sm"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">{p.topic}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{TYPE_LABEL[p.type]}</td>
                  <td className="px-4 py-3 text-sm">{DIFF_LABEL[p.difficulty]}</td>
                  <td className="px-4 py-3 text-xs">📚 {p._count.attempts + p._count.submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
