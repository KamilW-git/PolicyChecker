'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addRuleAction(policyVersionId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const reason = formData.get('reason') as string
  const severity = formData.get('severity') as 'INFO' | 'WARNING' | 'BLOCKER'
  const conditionStr = formData.get('condition') as string
  
  if (!name || !reason || !severity || !conditionStr) {
    throw new Error('Brak wymaganych danych')
  }

  let condition = {}
  try {
    condition = JSON.parse(conditionStr)
  } catch (e) {
    throw new Error('Nieprawidłowy format JSON w polu warunku')
  }

  await prisma.rule.create({
    data: {
      name,
      reason,
      severity,
      condition,
      effect: [{ type: 'EVALUATE' }],
      policyVersionId,
      priority: 10
    }
  })

  // Hack for MVP to re-render pages
  const version = await prisma.policyVersion.findUnique({
    where: { id: policyVersionId }
  })
  if (version) {
    revalidatePath(`/policies/${version.policyId}`)
  }
}

export async function editRuleAction(ruleId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const reason = formData.get('reason') as string
  const severity = formData.get('severity') as 'INFO' | 'WARNING' | 'BLOCKER'
  const conditionStr = formData.get('condition') as string
  
  if (!name || !reason || !severity || !conditionStr) {
    throw new Error('Brak wymaganych danych')
  }

  let condition = {}
  try {
    condition = JSON.parse(conditionStr)
  } catch (e) {
    throw new Error('Nieprawidłowy format JSON w polu warunku')
  }

  const rule = await prisma.rule.update({
    where: { id: ruleId },
    data: {
      name,
      reason,
      severity,
      condition,
    },
    include: {
      policyVersion: true
    }
  })

  revalidatePath(`/policies/${rule.policyVersion.policyId}`)
  redirect(`/policies/${rule.policyVersion.policyId}?success=true`)
}

export async function deleteRuleAction(ruleId: string) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const rule = await prisma.rule.delete({
    where: { id: ruleId },
    include: {
      policyVersion: true
    }
  })

  revalidatePath(`/policies/${rule.policyVersion.policyId}`)
}

