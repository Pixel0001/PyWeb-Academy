import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// POST - Create a new note
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    // Check permission - view permission allows adding notes
    const permCheck = await checkPermission('inscrieri.view')
    if (!permCheck.allowed) {
      return NextResponse.json({ error: 'Nu aveți permisiunea de a adăuga notițe' }, { status: 403 })
    }

    const data = await request.json()
    const { enrollmentId, inscriereId, content } = data

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Conținutul notiței este obligatoriu' }, { status: 400 })
    }

    if (!enrollmentId && !inscriereId) {
      return NextResponse.json({ error: 'ID-ul înscrierii este obligatoriu' }, { status: 400 })
    }

    const note = await prisma.enrollmentNote.create({
      data: {
        enrollmentId: enrollmentId || undefined,
        inscriereId: inscriereId || undefined,
        content: content.trim()
      }
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json({ error: 'Eroare la crearea notiței' }, { status: 500 })
  }
}

// GET - Get notes for an enrollment
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')
    const inscriereId = searchParams.get('inscriereId')

    if (!enrollmentId && !inscriereId) {
      return NextResponse.json({ error: 'ID-ul înscrierii este obligatoriu' }, { status: 400 })
    }

    const notes = await prisma.enrollmentNote.findMany({
      where: enrollmentId 
        ? { enrollmentId } 
        : { inscriereId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Eroare la încărcarea notițelor' }, { status: 500 })
  }
}
