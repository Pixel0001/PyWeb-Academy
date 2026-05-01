'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DIFF = { EASY: '🟢', MEDIUM: '🟡', HARD: '🔴' }
const STATUS_BADGE = {
  PENDING: 'bg-amber-100 text-amber-700',
  GRADED: 'bg-emerald-100 text-emerald-700',
  NEEDS_REVISION: 'bg-red-100 text-red-700',
}

export default function SubmissionsList({ submissions, students, currentStudent, status, basePath = '/teacher/submissions' }) {
  const router = useRouter()

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center bg-white rounded-xl border border-gray-100 p-3">
        <label className="text-sm text-gray-600">Filtrează după elev:</label>
        <select value={currentStudent} onChange={e => {
          const s = e.target.value
          router.push(`${basePath}?status=${status}${s ? `&studentId=${s}` : ''}`)
        }} className="flex-1 px-3 py-1.5 border rounded-lg text-sm">
          <option value="">— Toți elevii —</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
          Nicio submisie pentru filtrele selectate. 🎉
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left">Elev</th>
                  <th className="px-4 py-3 text-left">Problemă</th>
                  <th className="px-4 py-3 text-left">Sursa</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Notă</th>
                  <th className="px-4 py-3 text-left">Trimis</th>
                  <th className="px-4 py-3 text-right">Acțiune</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{s.student?.fullName || '?'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span>{DIFF[s.problem?.difficulty]}</span>
                        <span className="font-medium">{s.problem?.title}</span>
                      </div>
                      <div className="text-xs text-gray-500">{s.problem?.topic} • {s.problem?.type}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {s.source === 'lesson' && s.lesson ? (
                        <div>
                          <div className="font-medium">📖 {s.lesson.title}</div>
                          <div className="text-gray-500">{s.lesson.module?.title}</div>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">🎲 random</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                      {s.autoCorrect === true && <div className="text-emerald-600 text-xs mt-0.5">✓ auto</div>}
                      {s.autoCorrect === false && <div className="text-red-600 text-xs mt-0.5">✗ auto</div>}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">{s.grade ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.createdAt).toLocaleString('ro-RO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`${basePath}/${s.id}`} className="text-indigo-600 text-sm font-medium">
                        {s.status === 'PENDING' ? 'Verifică →' : 'Vezi'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {submissions.map(s => (
              <Link key={s.id} href={`${basePath}/${s.id}`} className="block p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{s.student?.fullName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                </div>
                <div className="text-sm mt-1">
                  {DIFF[s.problem?.difficulty]} {s.problem?.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-between">
                  <span>{s.source === 'lesson' ? s.lesson?.title : '🎲 random'}</span>
                  <span>{new Date(s.createdAt).toLocaleDateString('ro-RO')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
