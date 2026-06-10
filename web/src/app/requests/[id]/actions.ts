'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { savePrivateFile } from '@/lib/attachments'

export async function overrideRequest(requestId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['REVIEWER', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const outcome = formData.get('decision') as string
  const reason = formData.get('reason') as string
  const comment = formData.get('comment') as string
  const approvedBy = formData.get('approvedBy') as string
  const file = formData.get('attachment') as File | null

  if (!reason || !outcome || !comment || !approvedBy) {
    throw new Error('Brak wymaganych danych')
  }

  let attachmentPath: string | null = null
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) throw new Error('Plik za duży (max 10MB)')
    const buffer = Buffer.from(await file.arrayBuffer())
    attachmentPath = await savePrivateFile('overrides', file.name, buffer)
  }

  let overrideDecision: any
  let overrideStatus: any

  switch (outcome) {
    case 'APPROVED':
      overrideDecision = 'APPROVED'
      overrideStatus = 'APPROVED'
      break
    case 'APPROVED_WITH_EXCEPTION':
      overrideDecision = 'APPROVED'
      overrideStatus = 'APPROVED_WITH_EXCEPTION'
      break
    case 'REJECTED':
      overrideDecision = 'REJECTED'
      overrideStatus = 'REJECTED'
      break
    case 'REQUIRES_REVIEW':
      overrideDecision = 'REQUIRES_REVIEW'
      overrideStatus = 'IN_REVIEW'
      break
    default:
      throw new Error('Nieznana decyzja')
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
        overrideDecision,
        overrideStatus,
        reason,
        comment,
        approvedBy,
        createdById: user.id,
        attachmentPath
      }
    })

    // Aktualizacja statusu wniosku (NFR-7: nie nadpisuj systemowej decision)
    await tx.request.update({
      where: { id: requestId },
      data: {
        status: overrideStatus
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
          overrideDecision,
          overrideStatus,
          reason,
          approvedBy
        }
      }
    })
  })

  revalidatePath(`/requests/${requestId}`)
  revalidatePath('/requests')
}
