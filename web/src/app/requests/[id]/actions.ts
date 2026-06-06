'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function overrideRequest(requestId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['REVIEWER', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const decision = formData.get('decision') as any // 'APPROVED' | 'APPROVED_WITH_EXCEPTION' | 'REJECTED' | 'REQUIRES_REVIEW'
  const reason = formData.get('reason') as string
  const comment = formData.get('comment') as string
  const approvedBy = formData.get('approvedBy') as string

  if (!reason || !decision || !comment || !approvedBy) {
    throw new Error('Brak wymaganych danych')
  }

  await prisma.$transaction(async (tx) => {
    // Znajdź obecny wniosek by pobrać originalDecision
    const req = await tx.request.findUnique({ where: { id: requestId } })
    if (!req) throw new Error('Wniosek nie istnieje')

    const originalDecision = req.decision

    // Zapisz manualne nadpisanie
    await tx.manualOverride.create({
      data: {
        requestId,
        originalDecision,
        overrideDecision: decision,
        reason,
        comment,
        approvedBy,
        createdById: user.id
      }
    })

    // Aktualizacja wniosku
    const newStatus = decision.includes('APPROVED') ? 'APPROVED' : 
                      decision === 'REJECTED' ? 'REJECTED' : 'IN_REVIEW'
    
    await tx.request.update({
      where: { id: requestId },
      data: {
        status: newStatus as any,
        decision
      }
    })

    // Audyt
    await tx.auditEvent.create({
      data: {
        action: 'MANUAL_OVERRIDE',
        entity: 'Request',
        entityId: requestId,
        userId: user.id,
        details: {
          originalDecision,
          overrideDecision: decision,
          reason,
          approvedBy
        }
      }
    })
  })

  revalidatePath(`/requests/${requestId}`)
  revalidatePath('/requests')
}
