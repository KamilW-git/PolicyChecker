'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { RequestStatus, AttachmentType } from '@prisma/client'
import { toEur } from '@/lib/currency'
import { getCurrentUser } from '@/lib/session'
import { savePrivateFile } from '@/lib/attachments'
import { evaluateAndFinalizeRequest } from '@/lib/requestEvaluation'
import { createRequestSchema } from '@/lib/validations/request'

function buildInputSnapshot(parsed: ReturnType<typeof createRequestSchema.parse>) {
  const {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry,
    department, urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
    transferOutsideEEA, securityQuestionnaire,
  } = parsed

  return {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
    urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
    transferOutsideEEA, securityQuestionnaire,
    annualCostEur: currency ? toEur(annualCost, currency) : annualCost,
  }
}

function parseRequestFormData(formData: FormData) {
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
    dataCategories: dataCategoriesArray,
  }

  return createRequestSchema.parse(payload)
}

export async function createRequest(formData: FormData) {
  const parsed = parseRequestFormData(formData)
  const {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry,
    department, urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
    transferOutsideEEA, securityQuestionnaire, businessOwnerId, budgetOwnerId,
  } = parsed

  const isDraft = formData.get('isDraft') === 'true'

  const requester = await getCurrentUser()
  if (!requester) throw new Error('Not authenticated')
  if (requester.role === 'AUDITOR') throw new Error('Audytor ma dostęp tylko do odczytu')

  let finalBusinessOwnerId = businessOwnerId
  if (!finalBusinessOwnerId) {
    const defaultBusinessOwner = await prisma.user.findFirst({ where: { role: 'POLICY_OWNER' } })
    if (!defaultBusinessOwner) throw new Error('System nie posiada właściciela biznesowego')
    finalBusinessOwnerId = defaultBusinessOwner.id
  }

  const inputSnapshot = buildInputSnapshot(parsed)

  const requestData = {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
    urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
    transferOutsideEEA, securityQuestionnaire,
    inputData: inputSnapshot,
    requesterId: requester.id,
    businessOwnerId: finalBusinessOwnerId,
    budgetOwnerId,
  }

  if (isDraft) {
    const request = await prisma.request.create({
      data: { ...requestData, status: RequestStatus.DRAFT },
    })
    revalidatePath('/requests')
    redirect(`/requests/${request.id}`)
  }

  const request = await prisma.request.create({
    data: { ...requestData, status: RequestStatus.SUBMITTED },
  })

  await prisma.auditEvent.create({
    data: {
      action: 'CREATE_REQUEST',
      entity: 'Request',
      entityId: request.id,
      userId: requester.id,
    },
  })

  await evaluateAndFinalizeRequest(request.id, requester.id, inputSnapshot, 'SUBMIT_REQUEST')

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

  const parsed = parseRequestFormData(formData)
  const {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry,
    department, urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
    transferOutsideEEA, securityQuestionnaire, businessOwnerId, budgetOwnerId,
  } = parsed

  const inputSnapshot = buildInputSnapshot(parsed)
  const isDraft = formData.get('isDraft') !== 'false'

  await prisma.request.update({
    where: { id: requestId },
    data: {
      title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
      urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories, transferOutsideEEA, securityQuestionnaire,
      inputData: inputSnapshot,
      businessOwnerId: businessOwnerId || request.businessOwnerId,
      budgetOwnerId,
    },
  })

  if (!isDraft) {
    await evaluateAndFinalizeRequest(requestId, requester.id, inputSnapshot, 'SUBMIT_REQUEST')
    revalidatePath('/requests')
    revalidatePath(`/requests/${requestId}`)
    redirect(`/requests/${requestId}`)
  }

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

  const inputSnapshot = (request.inputData as Record<string, unknown>) || {}

  await evaluateAndFinalizeRequest(requestId, requester.id, inputSnapshot, 'SUBMIT_REQUEST')

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

  const parsed = parseRequestFormData(formData)
  const {
    title, description, type, category, annualCost, currency, vendorName, vendorCountry,
    department, urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories,
    transferOutsideEEA, securityQuestionnaire, businessOwnerId, budgetOwnerId,
  } = parsed

  const inputSnapshot = buildInputSnapshot(parsed)

  await prisma.request.update({
    where: { id: requestId },
    data: {
      title, description, type, category, annualCost, currency, vendorName, vendorCountry, department,
      urgency, vendorRisk, processesPersonalData, hasDpa, dataCategories, transferOutsideEEA, securityQuestionnaire,
      inputData: inputSnapshot,
      businessOwnerId: businessOwnerId || request.businessOwnerId,
      budgetOwnerId,
    },
  })

  await evaluateAndFinalizeRequest(
    requestId,
    requester.id,
    inputSnapshot,
    'RESUBMIT_REQUEST',
    'NEEDS_INFORMATION -> '
  )

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
      isInternal,
    },
  })

  await prisma.auditEvent.create({
    data: {
      action: 'ADD_COMMENT',
      entity: 'Request',
      entityId: requestId,
      userId: user.id,
      details: { isInternal },
    },
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

  const buffer = Buffer.from(await file.arrayBuffer())
  const relativePath = await savePrivateFile('requests', file.name, buffer)

  await prisma.requestAttachment.create({
    data: {
      requestId,
      filename: file.name,
      path: relativePath,
      mimeType: file.type,
      type: type || 'OTHER',
    },
  })

  await prisma.auditEvent.create({
    data: {
      action: 'UPLOAD_ATTACHMENT',
      entity: 'Request',
      entityId: requestId,
      userId: user.id,
      details: { filename: file.name, type },
    },
  })

  revalidatePath(`/requests/${requestId}`)
}
