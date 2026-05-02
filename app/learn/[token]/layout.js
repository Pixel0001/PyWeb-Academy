import TokenSaver from '@/components/public/TokenSaver'

export default async function LearnTokenLayout({ children, params }) {
  const { token } = await params
  return (
    <>
      <TokenSaver token={token} />
      {children}
    </>
  )
}
