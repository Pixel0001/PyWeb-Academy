export const dynamic = 'force-dynamic'

import TokenSaver from '@/components/public/TokenSaver'
import SessionGuard from '@/components/public/SessionGuard'
import StudentThemeShell from '@/components/public/StudentThemeShell'

export default async function LearnTokenLayout({ children, params }) {
  const { token } = await params
  return (
    <>
      <TokenSaver token={token} />
      <SessionGuard token={token} />
      <StudentThemeShell token={token}>
        {children}
      </StudentThemeShell>
    </>
  )
}
