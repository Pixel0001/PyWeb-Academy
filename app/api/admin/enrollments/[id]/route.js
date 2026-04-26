import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkPermission } from '@/lib/permissions'

// Map status between Enrollment and Inscriere models
const statusToInscriere = {
  'NEW': 'NOU',
  'CONTACTED': 'CONTACTAT',
  'CONFIRMED': 'CONFIRMAT',
  'REJECTED': 'RESPINS'
}

export async function PUT(request, { params }) {
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
    const body = await request.json()

    const { status, notes, source } = body

    // Try to find in Enrollment first
    let enrollment = await prisma.enrollment.findUnique({ where: { id } })
    
    if (enrollment) {
      // Update Enrollment
      enrollment = await prisma.enrollment.update({
        where: { id },
        data: { status, notes }
      })
      return NextResponse.json(enrollment)
    }

    // If not found, try Inscriere
    let inscriere = await prisma.inscriere.findUnique({ where: { id } })
    
    if (inscriere) {
      // Convert status to Inscriere format
      const inscriereStatus = statusToInscriere[status] || 'NOU'
      
      inscriere = await prisma.inscriere.update({
        where: { id },
        data: { 
          status: inscriereStatus, 
          notes 
        }
      })
      return NextResponse.json(inscriere)
    }

    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  } catch (error) {
    console.error('Error updating enrollment:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check permission for deleting enrollments
    const permCheck = await checkPermission('inscrieri.delete')
    if (!permCheck.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să ștergi înscrierile' }, { status: 403 })
    }

    const { id } = await params

    // Try to delete from Enrollment first
    try {
      await prisma.enrollment.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (e) {
      // If not found in Enrollment, try Inscriere
      try {
        await prisma.inscriere.delete({ where: { id } })
        return NextResponse.json({ success: true })
      } catch (e2) {
        return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
      }
    }
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete enrollment' }, { status: 500 })
  }
}
