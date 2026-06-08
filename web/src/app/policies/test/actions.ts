'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { evaluateRequest } from '@/lib/engine'
import { toEur } from '@/lib/currency'

export async function testRules(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const policyVersionId = formData.get('policyVersionId') as string | null
  const inputJson = formData.get('inputJson') as string

  let inputSnapshot: any
  try {
    inputSnapshot = JSON.parse(inputJson)
    if (inputSnapshot.currency && inputSnapshot.annualCost) {
      inputSnapshot.annualCostEur = toEur(inputSnapshot.annualCost, inputSnapshot.currency)
    }
  } catch (e) {
    throw new Error('Nieprawidłowy format JSON')
  }

  let rulesToTest: any[] = []

  if (policyVersionId) {
    // Testuj konkretną wersję polityki
    rulesToTest = await prisma.rule.findMany({
      where: { policyVersionId, enabled: true },
      include: { policyVersion: { include: { policy: true } } }
    })
  } else {
    // Testuj wszystkie aktualnie aktywne zasady (z PUBLISHED)
    rulesToTest = await prisma.rule.findMany({
      where: { enabled: true, policyVersion: { status: 'PUBLISHED' } },
      include: { policyVersion: { include: { policy: true } } }
    })
  }

  const result = evaluateRequest(inputSnapshot, rulesToTest)
  return result
}
