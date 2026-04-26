import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permission
    const permCheck = await checkPermission('inscrieri.view')
    if (!permCheck.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să vezi înscrierile' }, { status: 403 })
    }

    const { id } = await params

    const inscriere = await prisma.inscriere.findUnique({
      where: { id }
    })

    if (!inscriere) {
      return NextResponse.json({ error: 'Înscriere negăsită' }, { status: 404 })
    }

    return NextResponse.json(inscriere)
  } catch (error) {
    console.error('Eroare:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permission - view permission allows status/notes updates
    const permCheck = await checkPermission('inscrieri.view')
    if (!permCheck.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să gestionezi înscrierile' }, { status: 403 })
    }

    const { id } = await params
    const data = await request.json()

    const updateData = {}
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const inscriere = await prisma.inscriere.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(inscriere)
  } catch (error) {
    console.error('Eroare:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permission
    const permCheck = await checkPermission('inscrieri.delete')
    if (!permCheck.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să ștergi înscrierile' }, { status: 403 })
    }

    const { id } = await params

    await prisma.inscriere.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Eroare:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}
