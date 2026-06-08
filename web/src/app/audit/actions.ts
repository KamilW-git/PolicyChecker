'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export async function exportAuditCsv() {
  const user = await getCurrentUser()
  if (!user || !['AUDITOR', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const logs = await prisma.auditEvent.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })

  // Basic CSV generation
  let csv = 'ID,Data,Uzytkownik,Rola,Akcja,Typ Encji,ID Encji,Szczegoly\n'
  
  logs.forEach(log => {
    const date = log.createdAt.toISOString()
    const userName = log.user?.name || 'System'
    const role = log.user?.role || 'SYSTEM'
    const action = log.action
    const entity = log.entity
    const entityId = log.entityId
    const details = JSON.stringify(log.details || {}).replace(/"/g, '""') // escape quotes for CSV

    csv += `${log.id},${date},"${userName}",${role},${action},${entity},${entityId},"${details}"\n`
  })

  return csv
}
