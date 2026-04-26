import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'

export async function GET(request, { params }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  const permCheck = await checkPermission('reviews.view')
  if (!permCheck.allowed) {
    return NextResponse.json({ error: 'Nu ai permisiunea să vezi recenziile' }, { status: 403 })
  }

  const { id } = await params

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { course: true }
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  const permCheck = await checkPermission('reviews.edit')
  if (!permCheck.allowed) {
    return NextResponse.json({ error: 'Nu ai permisiunea să editezi recenziile' }, { status: 403 })
  }

  const { id } = await params

  try {
    const data = await request.json()

    const review = await prisma.review.update({
      where: { id },
      data: {
        authorName: data.authorName,
        roleLabel: data.roleLabel,
        rating: data.rating,
        message: data.message,
        avatarUrl: data.avatarUrl || null,
        courseId: data.courseId || null,
        published: data.published
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check permission
  const permCheck = await checkPermission('reviews.delete')
  if (!permCheck.allowed) {
    return NextResponse.json({ error: 'Nu ai permisiunea să ștergi recenziile' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.review.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
