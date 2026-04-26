import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { notifyNewEnrollment } from '@/lib/telegram'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(request) {
  try {
    // Rate limiting: 2 requests per minute
    const clientIP = getClientIP(request)
    const rateLimitKey = `enrollments:${clientIP}`
    const { success, remaining, resetIn } = checkRateLimit(rateLimitKey, 2, 60000)

    if (!success) {
      return NextResponse.json(
        { error: `Prea multe cereri. Încercați din nou în ${Math.ceil(resetIn / 1000)} secunde.` },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000))
          }
        }
      )
    }

    const body = await request.json()
    
    const { courseId, studentName, studentAge, parentName, parentPhone, parentEmail, city, observations } = body

    // Validation
    if (!courseId || !studentName || !parentName || !parentPhone || !parentEmail) {
      return NextResponse.json(
        { error: 'Câmpurile obligatorii lipsesc' },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Cursul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        studentName,
        studentAge: studentAge ? parseInt(studentAge) : null,
        parentName,
        parentPhone,
        parentEmail,
        city: city || null,
        observations: observations || null,
        status: 'NEW'
      }
    })

    // Trimite notificare pe Telegram
    await notifyNewEnrollment(
      studentName,
      parentName,
      parentPhone,
      parentEmail,
      course.title,
      studentAge ? `Vârsta: ${studentAge} ani${city ? ` • Oraș: ${city}` : ''}${observations ? `\nObservații: ${observations}` : ''}` : (city ? `Oraș: ${city}${observations ? `\nObservații: ${observations}` : ''}` : observations || null)
    )

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      { error: 'A apărut o eroare la trimiterea înscrierii' },
      { status: 500 }
    )
  }
}
