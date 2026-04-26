import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/session'
import { require2FAToken } from '@/lib/security/action-tokens'
import { checkPermission } from '@/lib/permissions'

export async function GET(request, { params }) {
  try {
    await requireAdmin()
    
    const canView = await checkPermission('groups.view')
    if (!canView.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea de a vedea grupele' }, { status: 403 })
    }
    
    const { id } = await params

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        course: true,
        teacher: {
          select: { id: true, name: true, email: true }
        },
        branch: true,
        groupStudents: {
          include: {
            student: true
          },
          orderBy: {
            student: { fullName: 'asc' }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdmin()
    
    const canEdit = await checkPermission('groups.edit')
    if (!canEdit.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea de a edita grupele' }, { status: 403 })
    }
    
    const sessionUser = await getCurrentUser()
    const { id } = await params
    const body = await request.json()

    // Verify 2FA if user has it enabled
    const currentUser = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { twoFactorEnabled: true }
    })
    
    const twoFACheck = require2FAToken(body.actionToken, sessionUser.email, currentUser?.twoFactorEnabled)
    if (!twoFACheck.valid && !twoFACheck.skip) {
      return NextResponse.json({ 
        error: twoFACheck.error, 
        requires2FA: true 
      }, { status: 403 })
    }

    const { name, courseId, teacherId, branchId, scheduleDays, scheduleTime,
            locationType, locationDetails, startDate, active } = body

    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        courseId,
        teacherId,
        branchId: branchId || null,
        scheduleDays,
        scheduleTime,
        locationType,
        locationDetails,
        startDate: startDate ? new Date(startDate) : null,
        active
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error updating group:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    
    const canDelete = await checkPermission('groups.delete')
    if (!canDelete.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea de a șterge grupele' }, { status: 403 })
    }
    
    const sessionUser = await getCurrentUser()
    const { id } = await params

    // Get action token from header
    const actionToken = request.headers.get('x-action-token')

    // Verify 2FA if user has it enabled
    const currentUser = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { twoFactorEnabled: true }
    })
    
    const twoFACheck = require2FAToken(actionToken, sessionUser.email, currentUser?.twoFactorEnabled)
    if (!twoFACheck.valid && !twoFACheck.skip) {
      return NextResponse.json({ 
        error: twoFACheck.error, 
        requires2FA: true 
      }, { status: 403 })
    }

    await prisma.group.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
