export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import ShopClient from '@/components/public/ShopClient'

export default async function ShopPage({ params }) {
  const { token } = await params
  const student = await prisma.student.findFirst({
    where: { accessToken: token },
    select: { id: true, fullName: true, active: true },
  })
  if (!student) notFound()
  return <ShopClient token={token} studentName={student.fullName} />
}
