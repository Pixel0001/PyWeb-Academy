export const dynamic = 'force-dynamic'

import PermissionGuard from '@/components/admin/PermissionGuard'
import { getSystemSettings } from '@/lib/student-limits'
import AbonamenteForm from '@/components/admin/AbonamenteForm'

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">⚙️ Abonamente · Limite globale</h1>
        <p className="text-sm text-slate-500 mt-1">
          Cooldown între probleme, cap zilnic XP și curba de niveluri pentru toți elevii.
          Aplică în mod global; poți suprascrie per grupă sau per elev.
        </p>
      </div>
      <AbonamenteForm initial={settings} />
    </div>
  )
}
