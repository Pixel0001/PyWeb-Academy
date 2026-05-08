export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getStudentByToken, getShopCosmetics, getShopChests, getAllThemes, getStudentShopData } from '@/lib/student-cache'
import ShopClient from '@/components/public/ShopClient'

// Skeleton shown while data loads — gives instant FCP
function ShopSkeleton() {
  return (
    <div className="min-h-screen bg-slate-100 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-10 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-slate-200 rounded-lg" />
          <div className="h-8 w-36 bg-slate-200 rounded-xl" />
        </div>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-9 w-20 bg-white rounded-xl shadow-sm" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-48 bg-white rounded-2xl shadow-sm" />)}
        </div>
      </div>
    </div>
  )
}

// Async data-fetcher — runs inside Suspense so the skeleton above shows first
async function ShopDataFetcher({ token }) {
  const student = await getStudentByToken(token)
  if (!student) notFound()

  const [cosmetics, chests, themes, { econ, inventory, equipped, activeEvents }] = await Promise.all([
    getShopCosmetics(),
    getShopChests(),
    getAllThemes(),
    getStudentShopData(student.id),
  ])

  const initialData = {
    economy: econ,
    cosmetics,
    chests,
    themes,
    inventory: inventory.map(i => ({ ...i.cosmetic, acquiredAt: i.acquiredAt })),
    equipped: equipped.map(e => ({ type: e.type, cosmeticId: e.cosmeticId, cosmetic: e.cosmetic })),
    activeEvents,
  }

  return <ShopClient token={token} studentName={student.fullName} initialData={initialData} />
}

export default async function ShopPage({ params }) {
  const { token } = await params
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopDataFetcher token={token} />
    </Suspense>
  )
}
