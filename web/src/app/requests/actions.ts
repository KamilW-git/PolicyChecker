'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { RequestType, RequestCategory, Currency, Department, RequestStatus, Decision, Urgency, VendorRisk, AttachmentType } from '@prisma/client'
import { evaluateRequest } from '@/lib/engine'
import { toEur } from '@/lib/currency'
import { getCurrentUser } from '@/lib/session'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

import { createRequestSchema } from '@/lib/validations/request'

export async function createRequest(formData: FormData) {
  const rawDataCategories = formData.get('dataCategories') as string
  const dataCategoriesArray = rawDataCategories ? rawDataCategories.split(',').map(s => s.trim()) : []

  const payload = {
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type'),
    category: formData.get('category'),
    annualCost: parseFloat(formData.get('annualCost') as string) || 0,
    currency: formData.get('currency'),
    vendorName: formData.get('vendorName'),
    vendorCountry: formData.get('vendorCountry'),
    department: formData.get('department'),
    urgency: formData.get('urgency'),
    vendorRisk: formData.get('vendorRisk'),
    businessOwnerId: formData.get('businessOwnerId'),
    budgetOwnerId: formData.get('budgetOwnerId') || null,
    processesPersonalData: formData.get('processesPersonalData') === 'on' || formData.get('processesPersonalData') === 'true',
    hasDpa: formData.get('hasDpa') === 'on' || formData.get('hasDpa') === 'true',
    transferOutsideEEA: formData.get('transferOutsideEEA') === 'on' || formData.get('transferOutsideEEA') === 'true',
    securityQuestionnaire: formData.get('securityQuestionnaire') === 'on' || formData.get('securityQuestionnaire') === 'true',
    dataCategories: dataCategoriesArray
  }

  const parsed = createRequestSchema.parse(payload)
  const { title, description, type, category, annualCost, currency, vendorName, vendorCountry, department, urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories, businessOwnerId, budgetOwnerId } = parsed


  const isDraft = formData.get('isDraft') === 'true'

  const requester = await getCurrentUser()
  if (!requester) {
    throw new Error('Not authenticated')
  }
  if (requester.role === 'AUDITOR') {
    throw new Error('Audytor ma dostęp tylko do odczytu')
  }

  // businessOwnerId comes from payload now, but fallback if empty:
  let finalBusinessOwnerId = businessOwnerId
  if (!finalBusinessOwnerId) {
    const defaultBusinessOwner = await prisma.user.findFirst({ where: { role: 'POLICY_OWNER' } })
    if (!defaultBusinessOwner) {
      throw new Error('System nie posiada właściciela biznesowego')
    }
    finalBusinessOwnerId = defaultBusinessOwner.id
  }

  const inputSnapshot = {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
    urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
    annualCostEur: currency ? toEur(annualCost, currency) : annualCost
  }

  if (isDraft) {
    const request = await prisma.request.create({
      data: {
        title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
        urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
        status: RequestStatus.DRAFT,
        inputData: inputSnapshot,
        requesterId: requester.id,
        businessOwnerId: finalBusinessOwnerId,
        budgetOwnerId,
      }
    })
    revalidatePath('/requests')
    redirect(`/requests/${request.id}`)
  }

  // Uruchomienie dynamicznego silnika reguł (Policy Engine)
  const activeRules = await prisma.rule.findMany({
    where: {
      enabled: true,
      policyVersion: {
        status: 'PUBLISHED'
      }
    },
    include: {
      policyVersion: {
        include: { policy: true }
      }
    }
  })

  const evaluationResult = evaluateRequest(inputSnapshot, activeRules)
  const engineDecision = evaluationResult.decision

  let initialStatus: RequestStatus
  if (engineDecision === Decision.APPROVED) initialStatus = RequestStatus.AUTO_APPROVED
  else if (engineDecision === Decision.REJECTED) initialStatus = RequestStatus.REJECTED
  else if (engineDecision === Decision.MISSING_INFORMATION) initialStatus = RequestStatus.NEEDS_INFORMATION
  else initialStatus = RequestStatus.IN_REVIEW

  // 2. Utworzenie wniosku
  const request = await prisma.request.create({
    data: {
      title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
      urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
      status: initialStatus,
      decision: engineDecision,
      inputData: inputSnapshot,
      requesterId: requester.id,
      businessOwnerId: finalBusinessOwnerId,
      budgetOwnerId,
    }
  })

  // 3. Zapis ewaluacji
  const resultSnapshot = {
    reason: evaluationResult.reasons.join('\n'),
    missingFields: evaluationResult.missingFields,
    requiredRoles: evaluationResult.requiredRoles,
    riskPoints: evaluationResult.riskPoints,
    reasonCodes: evaluationResult.reasonCodes
  }

  const evaluation = await prisma.policyEvaluation.create({
    data: {
      requestId: request.id,
      decision: engineDecision,
      inputSnapshot: inputSnapshot,
      resultSnapshot: resultSnapshot,
      appliedPolicyVersions: Array.from(new Map(evaluationResult.appliedRules.map(r => [
        r.policyVersionId,
        {
          policyVersionId: r.policyVersionId,
          policyId: r.policyVersion.policyId,
          policyName: r.policyVersion.policy.name,
          version: r.policyVersion.version
        }
      ])).values())
    }
  })

  // Stwórz wpisy RuleMatch dla pełnego audytu (FR-4 / PolicyEvaluationRuleMatch)
  for (const rule of evaluationResult.appliedRules) {
    const effectsStr = Array.isArray(rule.effect) ? rule.effect.map((e: any) => e.type).join(', ') : ''
    await prisma.policyEvaluationRuleMatch.create({
      data: {
        policyEvaluationId: evaluation.id,
        ruleId: rule.id,
        policyVersionId: rule.policyVersionId,
        effectTriggered: effectsStr,
        details: rule.reason
      }
    })
  }

  // Audit log (P1-1): Zapisanie sztucznego przejścia przez SUBMITTED
  await prisma.auditEvent.create({
    data: {
      action: 'SUBMIT_REQUEST',
      entity: 'Request',
      entityId: request.id,
      userId: requester.id,
      details: {
        transition: `SUBMITTED -> ${initialStatus}`
      }
    }
  })

  await prisma.auditEvent.create({
    data: {
      action: 'CREATE_REQUEST',
      entity: 'Request',
      entityId: request.id,
      userId: requester.id
    }
  })

  revalidatePath('/requests')
  redirect(`/requests/${request.id}`)
}

export async function updateRequest(requestId: string, formData: FormData) {
  const requester = await getCurrentUser()
  if (!requester) throw new Error('Not authenticated')

  const request = await prisma.request.findUnique({ where: { id: requestId } })
  if (!request) throw new Error('Nie znaleziono wniosku')
  if (request.requesterId !== requester.id) throw new Error('Możesz edytować tylko swoje wnioski')
  if (request.status !== 'DRAFT') throw new Error('Można edytować tylko wnioski w wersji roboczej')

  const rawDataCategories = formData.get('dataCategories') as string
  const dataCategoriesArray = rawDataCategories ? rawDataCategories.split(',').map(s => s.trim()) : []

  const payload = {
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type'),
    category: formData.get('category'),
    annualCost: parseFloat(formData.get('annualCost') as string) || 0,
    currency: formData.get('currency'),
    vendorName: formData.get('vendorName'),
    vendorCountry: formData.get('vendorCountry'),
    department: formData.get('department'),
    urgency: formData.get('urgency'),
    vendorRisk: formData.get('vendorRisk'),
    businessOwnerId: formData.get('businessOwnerId') || request.businessOwnerId,
    budgetOwnerId: formData.get('budgetOwnerId') || null,
    processesPersonalData: formData.get('processesPersonalData') === 'on' || formData.get('processesPersonalData') === 'true',
    hasDpa: formData.get('hasDpa') === 'on' || formData.get('hasDpa') === 'true',
    transferOutsideEEA: formData.get('transferOutsideEEA') === 'on' || formData.get('transferOutsideEEA') === 'true',
    securityQuestionnaire: formData.get('securityQuestionnaire') === 'on' || formData.get('securityQuestionnaire') === 'true',
    dataCategories: dataCategoriesArray
  }

  const parsed = createRequestSchema.parse(payload)
  const { title, description, type, category, annualCost, currency, vendorName, vendorCountry, department, urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories, businessOwnerId, budgetOwnerId, transferOutsideEEA, securityQuestionnaire } = parsed

  const inputSnapshot = {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
    urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
    transferOutsideEEA, securityQuestionnaire,
    annualCostEur: currency ? toEur(annualCost, currency) : annualCost
  }

  await prisma.request.update({
    where: { id: requestId },
    data: {
      title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
      urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories, transferOutsideEEA, securityQuestionnaire,
      inputData: inputSnapshot,
      businessOwnerId: businessOwnerId || request.businessOwnerId,
      budgetOwnerId: budgetOwnerId
    }
  })

  revalidatePath('/requests')
  revalidatePath(`/requests/${requestId}`)
  redirect(`/requests/${requestId}`)
}

export async function submitDraftRequest(requestId: string) {
  const requester = await getCurrentUser()
  if (!requester) throw new Error('Not authenticated')

  const request = await prisma.request.findUnique({ where: { id: requestId } })
  if (!request) throw new Error('Nie znaleziono wniosku')
  if (request.requesterId !== requester.id) throw new Error('Brak uprawnień')
  if (request.status !== 'DRAFT') throw new Error('Wniosek nie jest szkicem')

  const activeRules = await prisma.rule.findMany({
    where: { enabled: true, policyVersion: { status: 'PUBLISHED' } },
    include: { policyVersion: { include: { policy: true } } }
  })

  const requestAttachments = await prisma.requestAttachment.findMany({ where: { requestId } })
  const hasUploadedDpa = requestAttachments.some(a => a.type === 'DPA')

  const inputSnapshot = {
    ...(request.inputData as any),
    hasDpa: (request.inputData as any).hasDpa || hasUploadedDpa
  }

  const evaluationResult = evaluateRequest(inputSnapshot, activeRules)
  const engineDecision = evaluationResult.decision

  let newStatus: RequestStatus
  if (engineDecision === Decision.APPROVED) newStatus = RequestStatus.AUTO_APPROVED
  else if (engineDecision === Decision.REJECTED) newStatus = RequestStatus.REJECTED
  else if (engineDecision === Decision.MISSING_INFORMATION) newStatus = RequestStatus.NEEDS_INFORMATION
  else newStatus = RequestStatus.IN_REVIEW

  await prisma.request.update({
    where: { id: requestId },
    data: { status: newStatus, decision: engineDecision }
  })

  const resultSnapshot = {
    reason: evaluationResult.reasons.join('\n'),
    missingFields: evaluationResult.missingFields,
    requiredRoles: evaluationResult.requiredRoles,
    riskPoints: evaluationResult.riskPoints,
    reasonCodes: evaluationResult.reasonCodes
  }

  const evaluation = await prisma.policyEvaluation.create({
    data: {
      requestId,
      decision: engineDecision,
      inputSnapshot: request.inputData as any,
      resultSnapshot,
      appliedPolicyVersions: Array.from(new Map(evaluationResult.appliedRules.map(r => [
        r.policyVersionId,
        {
          policyVersionId: r.policyVersionId,
          policyId: r.policyVersion.policyId,
          policyName: r.policyVersion.policy.name,
          version: r.policyVersion.version
        }
      ])).values())
    }
  })

  for (const rule of evaluationResult.appliedRules) {
    const effectsStr = Array.isArray(rule.effect) ? rule.effect.map((e: any) => e.type).join(', ') : ''
    await prisma.policyEvaluationRuleMatch.create({
      data: {
        policyEvaluationId: evaluation.id,
        ruleId: rule.id,
        policyVersionId: rule.policyVersionId,
        effectTriggered: effectsStr,
        details: rule.reason
      }
    })
  }

  await prisma.auditEvent.create({
    data: {
      action: 'SUBMIT_REQUEST',
      entity: 'Request',
      entityId: request.id,
      userId: requester.id,
      details: { transition: `SUBMITTED -> ${newStatus}` }
    }
  })

  revalidatePath('/requests')
  revalidatePath(`/requests/${requestId}`)
  redirect(`/requests/${requestId}`)
}

export async function resubmitRequest(requestId: string, formData: FormData) {
  const requester = await getCurrentUser()
  if (!requester) throw new Error('Not authenticated')

  const request = await prisma.request.findUnique({ where: { id: requestId } })
  if (!request) throw new Error('Nie znaleziono wniosku')
  if (request.requesterId !== requester.id) throw new Error('Brak uprawnień')
  if (request.status !== 'NEEDS_INFORMATION') throw new Error('Wniosek nie wymaga uzupełnienia')

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as RequestType
  const category = formData.get('category') as RequestCategory
  const annualCost = parseFloat(formData.get('annualCost') as string) || 0
  const currency = formData.get('currency') as Currency
  const vendorName = formData.get('vendorName') as string
  const vendorCountry = formData.get('vendorCountry') as string
  const department = formData.get('department') as Department
  
  const urgency = (formData.get('urgency') as Urgency) || Urgency.NORMAL
  const vendorRisk = (formData.get('vendorRisk') as VendorRisk) || VendorRisk.LOW
  const processesPersonalData = formData.get('processesPersonalData') === 'on' || formData.get('processesPersonalData') === 'true'
  const hasDpa = formData.get('hasDpa') === 'on' || formData.get('hasDpa') === 'true'
  const transferOutsideEEA = formData.get('transferOutsideEEA') === 'on' || formData.get('transferOutsideEEA') === 'true'
  const securityQuestionnaire = formData.get('securityQuestionnaire') === 'on' || formData.get('securityQuestionnaire') === 'true'
  
  const rawDataCategories = formData.get('dataCategories') as string
  const dataCategories = rawDataCategories ? rawDataCategories.split(',').map(s => s.trim()) : []

  const businessOwnerId = formData.get('businessOwnerId') as string
  const budgetOwnerId = formData.get('budgetOwnerId') as string || null

  const requestAttachments = await prisma.requestAttachment.findMany({ where: { requestId } })
  const hasUploadedDpa = requestAttachments.some(a => a.type === 'DPA')

  const inputSnapshot = {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
    urgency, vendorRisk, processesPersonalData, 
    hasDpa: hasDpa || hasUploadedDpa, 
    dataCategories,
    transferOutsideEEA, securityQuestionnaire,
    annualCostEur: currency ? toEur(annualCost, currency) : annualCost
  }

  const activeRules = await prisma.rule.findMany({
    where: { enabled: true, policyVersion: { status: 'PUBLISHED' } },
    include: { policyVersion: { include: { policy: true } } }
  })

  const evaluationResult = evaluateRequest(inputSnapshot, activeRules)
  const engineDecision = evaluationResult.decision

  let newStatus: RequestStatus
  if (engineDecision === Decision.APPROVED) newStatus = RequestStatus.AUTO_APPROVED
  else if (engineDecision === Decision.REJECTED) newStatus = RequestStatus.REJECTED
  else if (engineDecision === Decision.MISSING_INFORMATION) newStatus = RequestStatus.NEEDS_INFORMATION
  else newStatus = RequestStatus.IN_REVIEW

  await prisma.request.update({
    where: { id: requestId },
    data: {
      title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
      urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories, transferOutsideEEA, securityQuestionnaire,
      inputData: inputSnapshot,
      businessOwnerId: businessOwnerId || request.businessOwnerId,
      budgetOwnerId: budgetOwnerId,
      status: newStatus,
      decision: engineDecision
    }
  })

  const resultSnapshot = {
    reason: evaluationResult.reasons.join('\n'),
    missingFields: evaluationResult.missingFields,
    requiredRoles: evaluationResult.requiredRoles,
    riskPoints: evaluationResult.riskPoints,
    reasonCodes: evaluationResult.reasonCodes
  }

  const evaluation = await prisma.policyEvaluation.create({
    data: {
      requestId,
      decision: engineDecision,
      inputSnapshot: inputSnapshot,
      resultSnapshot,
      appliedPolicyVersions: Array.from(new Map(evaluationResult.appliedRules.map(r => [
        r.policyVersionId,
        {
          policyVersionId: r.policyVersionId,
          policyId: r.policyVersion.policyId,
          policyName: r.policyVersion.policy.name,
          version: r.policyVersion.version
        }
      ])).values())
    }
  })

  for (const rule of evaluationResult.appliedRules) {
    const effectsStr = Array.isArray(rule.effect) ? rule.effect.map((e: any) => e.type).join(', ') : ''
    await prisma.policyEvaluationRuleMatch.create({
      data: {
        policyEvaluationId: evaluation.id,
        ruleId: rule.id,
        policyVersionId: rule.policyVersionId,
        effectTriggered: effectsStr,
        details: rule.reason
      }
    })
  }

  await prisma.auditEvent.create({
    data: {
      action: 'RESUBMIT_REQUEST',
      entity: 'Request',
      entityId: request.id,
      userId: requester.id,
      details: { transition: `NEEDS_INFORMATION -> SUBMITTED -> ${newStatus}` }
    }
  })

  revalidatePath('/requests')
  revalidatePath(`/requests/${requestId}`)
  redirect(`/requests/${requestId}`)
}

export async function addComment(requestId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const content = formData.get('content') as string
  const isInternal = formData.get('isInternal') === 'true'

  if (isInternal && !['REVIEWER', 'ADMIN'].includes(user.role)) {
    throw new Error('Tylko recenzenci i administratorzy mogą dodawać komentarze wewnętrzne')
  }

  if (!content) return

  await prisma.requestComment.create({
    data: {
      requestId,
      authorId: user.id,
      content,
      isInternal
    }
  })

  await prisma.auditEvent.create({
    data: {
      action: 'ADD_COMMENT',
      entity: 'Request',
      entityId: requestId,
      userId: user.id,
      details: { isInternal }
    }
  })

  revalidatePath(`/requests/${requestId}`)
}

export async function uploadAttachment(requestId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const request = await prisma.request.findUnique({ where: { id: requestId } })
  if (!request) throw new Error('Wniosek nie istnieje')

  if (request.requesterId !== user.id && !['REVIEWER', 'ADMIN'].includes(user.role)) {
    throw new Error('Brak uprawnień do wgrywania załączników')
  }

  const file = formData.get('file') as File
  const type = formData.get('type') as AttachmentType

  if (!file || file.size === 0) throw new Error('Nie wybrano pliku')
  if (file.size > 10 * 1024 * 1024) throw new Error('Plik jest za duży (max 10MB)')

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  try {
    await mkdir(uploadDir, { recursive: true })
  } catch (e) {}

  const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const filePath = path.join(uploadDir, uniqueName)

  await writeFile(filePath, buffer)

  await prisma.requestAttachment.create({
    data: {
      requestId,
      filename: file.name,
      path: `/uploads/${uniqueName}`,
      mimeType: file.type,
      type: type || 'OTHER'
    }
  })

  await prisma.auditEvent.create({
    data: {
      action: 'UPLOAD_ATTACHMENT',
      entity: 'Request',
      entityId: requestId,
      userId: user.id,
      details: { filename: file.name, type }
    }
  })

  revalidatePath(`/requests/${requestId}`)
}

