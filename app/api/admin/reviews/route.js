import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'

export async function GET() {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  const permCheck = await checkPermission('reviews.view')
  if (!permCheck.allowed) {
    return NextResponse.json({ error: 'Nu ai permisiunea să vezi recenziile' }, { status: 403 })
  }

  try {
    const reviews = await prisma.review.findMany({
      include: { course: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  const permCheck = await checkPermission('reviews.create')
  if (!permCheck.allowed) {
    return NextResponse.json({ error: 'Nu ai permisiunea să adaugi recenzii' }, { status: 403 })
  }

  try {
    const data = await request.json()

    const review = await prisma.review.create({
      data: {
        authorName: data.authorName,
        roleLabel: data.roleLabel || 'Părinte',
        rating: data.rating,
        message: data.message,
        avatarUrl: data.avatarUrl || null,
        courseId: data.courseId || null,
        published: data.published ?? true
      }
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
