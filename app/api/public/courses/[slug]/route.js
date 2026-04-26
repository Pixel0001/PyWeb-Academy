import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const { slug } = await params

    const course = await prisma.course.findUnique({
      where: { slug },
    })

    if (!course) {
      return NextResponse.json({ error: 'Cursul nu a fost găsit' }, { status: 404 })
    }

    // Returnează cursul doar dacă este activ
    if (!course.active) {
      return NextResponse.json({ error: 'Cursul nu este disponibil' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}
