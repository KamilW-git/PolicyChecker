'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function overrideRequest(requestId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'REVIEWER') {
    throw new Error('Unauthorized')
  }

  const reason = formData.get('reason') as string
  const decision = formData.get('decision') as 'APPROVED' | 'REJECTED'

  if (!reason || !decision) {
    throw new Error('Brak wymaganych danych')
  }

  await prisma.$transaction(async (tx) => {
    // 1. Znajdujemy ostatnią ewaluację dla tego wniosku
    const latestEval = await tx.policyEvaluation.findFirst({
      where: { requestId },
      orderBy: { evaluatedAt: 'desc' }
    })

    if (!latestEval) {
      throw new Error('Brak ewaluacji dla tego wniosku - nie można nadpisać')
    }

    // 2. Zapisujemy audyt manualnego nadpisania
    await tx.manualOverride.create({
      data: {
        evaluationId: latestEval.id,
        approvedById: user.id,
        reason,
        newDecision: decision
      }
    })

    // 2. Aktualizujemy wniosek
    await tx.request.update({
      where: { id: requestId },
      data: {
        status: decision === 'APPROVED' ? 'MANUAL_APPROVED' : 'REJECTED',
        decision
      }
    })
  })

  revalidatePath(`/requests/${requestId}`)
  revalidatePath('/requests')
}
