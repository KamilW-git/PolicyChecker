'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { RequestType, RequestCategory, Currency, Department, RequestStatus, Decision } from '@prisma/client'
import { evaluateRequest } from '@/lib/engine'

export async function createRequest(formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as RequestType
  const category = formData.get('category') as RequestCategory
  const annualCost = parseFloat(formData.get('annualCost') as string)
  const currency = formData.get('currency') as Currency
  const vendorName = formData.get('vendorName') as string
  const vendorCountry = formData.get('vendorCountry') as string
  const department = formData.get('department') as Department

  // MVP: Hardcoded users from seed
  const requester = await prisma.user.findFirst({ where: { role: 'REQUESTER' } })
  const businessOwner = await prisma.user.findFirst({ where: { role: 'POLICY_OWNER' } })
  
  if (!requester || !businessOwner) {
    throw new Error('Seed users not found')
  }

  // 1. Uruchomienie dynamicznego silnika reguł (Policy Engine)
  const inputSnapshot = {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry, department
  }

  // Fetch all active rules from published policies
  const activeRules = await prisma.rule.findMany({
    where: {
      enabled: true,
      policyVersion: {
        status: 'PUBLISHED'
      }
    }
  })

  const { decision: engineDecision, reasons, appliedRules } = evaluateRequest(inputSnapshot, activeRules)

  const initialStatus = engineDecision === Decision.APPROVED ? RequestStatus.AUTO_APPROVED : RequestStatus.IN_REVIEW
  const initialDecision = engineDecision
  const ruleReason = reasons.join('\n')

  // 2. Utworzenie wniosku
  const request = await prisma.request.create({
    data: {
      title,
      description,
      type,
      category,
      annualCost,
      currency,
      vendorName,
      vendorCountry,
      department,
      status: initialStatus,
      decision: initialDecision,
      inputData: inputSnapshot,
      requesterId: requester.id,
      businessOwnerId: businessOwner.id,
    }
  })

  // 3. Zapis ewaluacji
  await prisma.policyEvaluation.create({
    data: {
      requestId: request.id,
      decision: initialDecision,
      inputSnapshot: inputSnapshot,
      resultSnapshot: { reason: ruleReason },
      appliedPolicyVersions: appliedRules.map(r => r.policyVersionId)
    }
  })

  revalidatePath('/requests')
  redirect(`/requests/${request.id}`)
}
