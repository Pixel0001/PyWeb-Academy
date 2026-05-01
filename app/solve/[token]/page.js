import SolveSet from '@/components/public/SolveSet'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Set de probleme — PyWeb Academy',
  robots: { index: false, follow: false },
}

export default async function SolvePage({ params }) {
  const { token } = await params
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <SolveSet token={token} />
    </div>
  )
}
