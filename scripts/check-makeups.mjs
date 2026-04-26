import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  
  const yesterdayEnd = new Date(yesterday)
  yesterdayEnd.setHours(23, 59, 59, 999)

  console.log('=== Toate lecțiile de recuperare ===\n')
  
  const allMakeups = await prisma.makeupLesson.findMany({
    include: {
      teacher: true,
      group: { include: { course: true } },
      students: { include: { student: true } }
    },
    orderBy: { scheduledAt: 'desc' }
  })

  for (const m of allMakeups) {
    const scheduledDate = new Date(m.scheduledAt)
    const isPast = scheduledDate < new Date()
    const wasYesterday = scheduledDate >= yesterday && scheduledDate <= yesterdayEnd
    
    console.log(`📚 ID: ${m.id}`)
    console.log(`   Grupă: ${m.group?.name || 'N/A'}`)
    console.log(`   Profesor: ${m.teacher?.name || 'N/A'}`)
    console.log(`   Programat: ${scheduledDate.toLocaleDateString('ro-RO')} ${scheduledDate.toLocaleTimeString('ro-RO')}`)
    console.log(`   Status: ${m.status}`)
    console.log(`   lessonsDeducted: ${m.lessonsDeducted}`)
    console.log(`   Elevi: ${m.students.map(s => s.student.fullName).join(', ') || 'N/A'}`)
    console.log(`   Era ieri? ${wasYesterday ? '✅ DA' : '❌ NU'}`)
    console.log(`   E în trecut? ${isPast ? '✅ DA' : '❌ NU'}`)
    
    // Verifică dacă ar trebui să fie considerată ratată
    if (isPast && m.status === 'SCHEDULED' && !m.lessonsDeducted) {
      console.log(`   ⚠️ RATATĂ - nu a fost completată!`)
    }
    console.log('')
  }

  // Verifică ce caută cron-ul pentru makeup-uri ratate
  console.log('\n=== Makeup-uri care ar trebui detectate de cron (ieri, SCHEDULED, !lessonsDeducted) ===')
  const missedMakeups = await prisma.makeupLesson.findMany({
    where: {
      scheduledAt: {
        gte: yesterday,
        lte: yesterdayEnd
      },
      status: 'SCHEDULED',
      lessonsDeducted: false
    },
    include: {
      teacher: true,
      group: { include: { course: true } }
    }
  })

  if (missedMakeups.length === 0) {
    console.log('  (niciuna găsită cu criteriile cron-ului)')
  } else {
    for (const m of missedMakeups) {
      console.log(`- ${m.group?.name}: ${new Date(m.scheduledAt).toLocaleString('ro-RO')}`)
    }
  }

  // Verifică notificările pentru missed makeup
  console.log('\n=== Notificări MISSED_SESSION existente ===')
  const notifications = await prisma.notification.findMany({
    where: { type: 'MISSED_SESSION' },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  if (notifications.length === 0) {
    console.log('  (nicio notificare de acest tip)')
  }
  for (const n of notifications) {
    console.log(`- ${n.createdAt.toLocaleDateString('ro-RO')}: ${n.title}`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
