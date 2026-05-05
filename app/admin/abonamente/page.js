export const dynamic = 'force-dynamic'

import PermissionGuard from '@/components/admin/PermissionGuard'
import { getSystemSettings } from '@/lib/student-limits'
import AbonamenteForm from '@/components/admin/AbonamenteForm'
import Link from 'next/link'
import { BanknotesIcon } from '@heroicons/react/24/outline'

export default async function AbonamentePage() {
  return (
    <PermissionGuard permission="system.settings">
      <Content />
    </PermissionGuard>
  )
}

async function Content() {
  const settings = await getSystemSettings({ fresh: true })
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">⚙️ Abonamente · Limite globale</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cooldown între probleme, cap zilnic XP și curba de niveluri pentru toți elevii.
            Aplică în mod global; poți suprascrie per grupă sau per elev.
          </p>
        </div>
        <Link
          href="/admin/abonamente/conturi"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors shrink-0"
        >
          <BanknotesIcon className="w-4 h-4" />
          Conturi & Plăți elevi
        </Link>
      </div>
      <AbonamenteForm initial={settings} />
    </div>
  )
}
