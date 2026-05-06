import TokenSaver from '@/components/public/TokenSaver'
import SessionGuard from '@/components/public/SessionGuard'

export default async function LearnTokenLayout({ children, params }) {
  const { token } = await params
  return (
    <>
      <TokenSaver token={token} />
      <SessionGuard token={token} />
      {children}
    </>
  )
}
