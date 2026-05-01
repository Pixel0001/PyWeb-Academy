export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/lib/prisma'
import PermissionGuard from '@/components/admin/PermissionGuard'
import { checkPermission } from '@/lib/permissions'
import DeleteProblemButton from '@/components/admin/DeleteProblemButton'
import ProblemFilters from '@/components/admin/ProblemFilters'

const DIFF_LABEL = { EASY: '🟢 Ușor', MEDIUM: '🟡 Mediu', HARD: '🔴 Greu' }
const TYPE_LABEL = {
  MULTIPLE_CHOICE: 'Grilă',
  SHORT_ANSWER: 'Răspuns scurt',
  CODING: 'Cod',
  INPUT_OUTPUT: 'Input/Output',
}

export default async function AdminProblemsPage({ searchParams }) {
  return (
    <PermissionGuard permission="problems.view">
      <Content searchParams={searchParams} />
    </PermissionGuard>
  )
}

async function Content({ searchParams }) {
  const sp = (await searchParams) || {}
  const topic = sp.topic || undefined
  const difficulty = sp.difficulty || undefined
  const type = sp.type || undefined
  const q = sp.q || undefined

  const [canCreate, canEdit, canDelete, canAssign] = await Promise.all([
    checkPermission('problems.create'),
    checkPermission('problems.edit'),
    checkPermission('problems.delete'),
    checkPermission('problems.assign'),
  ])

  const where = { active: true }
  if (topic) where.topic = topic
  if (difficulty) where.difficulty = difficulty
  if (type) where.type = type
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [problems, allTopics, statsAgg] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { attempts: true, setProblems: true } } },
    }),
    prisma.problem.findMany({
      where: { active: true },
      select: { topic: true },
      distinct: ['topic'],
    }),
    prisma.problem.count({ where: { active: true } }),
  ])

  const topics = [...new Set(allTopics.map(t => t.topic))].sort()

  return (
    <div className="space-y-4 xs:space-y-6">
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-gray-900">🧠 Banca de Probleme</h1>
          <p className="text-sm text-gray-600">
            {statsAgg} {statsAgg === 1 ? 'problemă activă' : 'probleme active'} • Generează seturi pentru elevi
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/problems/stats"
            className="px-3 xs:px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            📊 Statistici
          </Link>
          {canAssign.allowed && (
            <Link
              href="/admin/problems/sets"
              className="px-3 xs:px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
            >
              📚 Seturi generate
            </Link>
          )}
          {canAssign.allowed && (
            <Link
              href="/admin/problems/sets/new"
              className="px-3 xs:px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              ✨ Generează set nou
            </Link>
          )}
          {canCreate.allowed && (
            <Link
              href="/admin/problems/new"
              className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              + Adaugă problemă
            </Link>
          )}
        </div>
      </div>

      <ProblemFilters topics={topics} initial={{ topic, difficulty, type, q }} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titlu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diff</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pct</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folosiri</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {problems.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Nicio problemă încă. Adaugă prima!
                </td></tr>
              ) : problems.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.title}</div>
                    {p.tags?.length > 0 && (
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {p.tags.slice(0, 4).map(t => `#${t}`).join(' ')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                      {p.topic}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{TYPE_LABEL[p.type] || p.type}</td>
                  <td className="px-4 py-3 text-sm">{DIFF_LABEL[p.difficulty] || p.difficulty}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">{p.points}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div>📚 {p._count.setProblems} set-uri</div>
                    <div>✏️ {p._count.attempts} încercări</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {canEdit.allowed && (
                        <Link href={`/admin/problems/${p.id}/edit`} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          Editează
                        </Link>
                      )}
                      {canDelete.allowed && <DeleteProblemButton id={p.id} title={p.title} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {problems.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500 text-sm">Nicio problemă încă.</div>
          ) : problems.map(p => (
            <div key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{p.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{p.topic}</span>
                    <span className="text-xs">{DIFF_LABEL[p.difficulty]}</span>
                    <span className="text-xs text-gray-600">{TYPE_LABEL[p.type]}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-700 font-medium whitespace-nowrap">{p.points} pct</span>
              </div>
              <div className="flex gap-3 mt-3 text-sm">
                {canEdit.allowed && <Link href={`/admin/problems/${p.id}/edit`} className="text-indigo-600 font-medium">Editează</Link>}
                {canDelete.allowed && <DeleteProblemButton id={p.id} title={p.title} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
