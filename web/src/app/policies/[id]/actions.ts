'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addRuleAction(policyVersionId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) throw new Error('Unauthorized')

  const version = await prisma.policyVersion.findUnique({ where: { id: policyVersionId } })
  if (version?.status !== 'DRAFT') throw new Error('Można edytować tylko wersje robocze (DRAFT)')

  const name = formData.get('name') as string
  const reason = formData.get('reason') as string
  const severity = formData.get('severity') as 'INFO' | 'WARNING' | 'BLOCKER'
  const conditionStr = formData.get('condition') as string
  const effectStr = formData.get('effect') as string
  
  if (!name || !reason || !severity || !conditionStr || !effectStr) throw new Error('Brak wymaganych danych')

  let condition: any = {}, effect: any = []
  try {
    condition = JSON.parse(conditionStr)
    effect = JSON.parse(effectStr)
    
    // Server-side validation
    if (!condition.operator && !condition.field) throw new Error()
    if (!Array.isArray(effect)) throw new Error()
    const allowedEffects = ['APPROVE', 'REQUIRE_REVIEW', 'REJECT', 'REQUIRE_FIELD', 'ADD_RISK_POINTS', 'ADD_REASON_CODE']
    for (const eff of effect) {
      if (!allowedEffects.includes(eff.type)) throw new Error()
    }
  } catch (e) {
    throw new Error('Nieprawidłowy format JSON w warunku lub efekcie, bądź niedozwolone wartości')
  }

  await prisma.rule.create({
    data: {
      name, reason, severity, condition, effect, policyVersionId, priority: 10
    }
  })

  revalidatePath(`/policies/${version.policyId}`)
}

export async function editRuleAction(ruleId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) throw new Error('Unauthorized')

  const existingRule = await prisma.rule.findUnique({
    where: { id: ruleId },
    include: { policyVersion: true }
  })
  if (!existingRule) throw new Error('Nie znaleziono reguły')
  if (existingRule.policyVersion.status !== 'DRAFT') {
    throw new Error('Można edytować tylko wersje robocze (DRAFT)')
  }

  const name = formData.get('name') as string
  const reason = formData.get('reason') as string
  const severity = formData.get('severity') as 'INFO' | 'WARNING' | 'BLOCKER'
  const conditionStr = formData.get('condition') as string
  const effectStr = formData.get('effect') as string
  
  let condition: any = {}, effect: any = []
  try {
    condition = JSON.parse(conditionStr)
    effect = JSON.parse(effectStr)
    
    // Server-side validation
    if (!condition.operator && !condition.field) throw new Error()
    if (!Array.isArray(effect)) throw new Error()
    const allowedEffects = ['APPROVE', 'REQUIRE_REVIEW', 'REJECT', 'REQUIRE_FIELD', 'ADD_RISK_POINTS', 'ADD_REASON_CODE']
    for (const eff of effect) {
      if (!allowedEffects.includes(eff.type)) throw new Error()
    }
  } catch (e) {
    throw new Error('Nieprawidłowy format JSON w warunku lub efekcie, bądź niedozwolone wartości')
  }

  const rule = await prisma.rule.update({
    where: { id: ruleId },
    data: { name, reason, severity, condition, effect },
    include: { policyVersion: true }
  })

  revalidatePath(`/policies/${rule.policyVersion.policyId}`)
  redirect(`/policies/${rule.policyVersion.policyId}?success=true`)
}

export async function deleteRuleAction(ruleId: string) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) throw new Error('Unauthorized')

  const existingRule = await prisma.rule.findUnique({
    where: { id: ruleId },
    include: { policyVersion: true }
  })
  if (!existingRule) throw new Error('Nie znaleziono reguły')
  if (existingRule.policyVersion.status !== 'DRAFT') {
    throw new Error('Można usuwać reguły tylko w wersji roboczej (DRAFT)')
  }

  const rule = await prisma.rule.delete({
    where: { id: ruleId },
    include: { policyVersion: true }
  })

  revalidatePath(`/policies/${rule.policyVersion.policyId}`)
}

export async function createDraftVersion(policyId: string, formData?: FormData) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) throw new Error('Unauthorized')

  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1, include: { rules: true } } }
  })

  if (!policy || policy.versions.length === 0) throw new Error('Polityka nie istnieje')
  const latestVersion = policy.versions[0]
  if (latestVersion.status === 'DRAFT' || latestVersion.status === 'IN_REVIEW') {
    throw new Error('Istnieje już wersja w trakcie prac')
  }

  const newVersion = await prisma.policyVersion.create({
    data: {
      policyId,
      version: latestVersion.version + 1,
      status: 'DRAFT',
      authorId: user.id,
      description: formData?.get('description') as string || 'Nowa wersja robocza',
      rules: {
        create: latestVersion.rules.map(r => ({
          name: r.name,
          description: r.description,
          severity: r.severity,
          condition: r.condition as any,
          effect: r.effect as any,
          reason: r.reason,
          enabled: r.enabled,
          priority: r.priority
        }))
      }
    }
  })

  // Log audit
  await prisma.auditEvent.create({
    data: {
      action: 'CREATE_DRAFT_VERSION',
      entity: 'PolicyVersion',
      entityId: newVersion.id,
      userId: user.id,
      details: { policyId, version: newVersion.version }
    }
  })

  revalidatePath(`/policies/${policyId}`)
}

export async function submitForReview(versionId: string) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) throw new Error('Unauthorized')

  const versionObj = await prisma.policyVersion.findUnique({
    where: { id: versionId },
    include: { _count: { select: { rules: true } } }
  })
  if (!versionObj) throw new Error('Not found')
  if (versionObj._count.rules === 0) throw new Error('Wersja musi zawierać co najmniej jedną regułę, aby mogła zostać przekazana do zatwierdzenia')

  const version = await prisma.policyVersion.update({
    where: { id: versionId },
    data: { status: 'IN_REVIEW' }
  })

  await prisma.auditEvent.create({
    data: {
      action: 'SUBMIT_FOR_REVIEW',
      entity: 'PolicyVersion',
      entityId: version.id,
      userId: user.id
    }
  })

  revalidatePath(`/policies/${version.policyId}`)
}

export async function approveAndPublish(versionId: string) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_APPROVER', 'ADMIN'].includes(user.role)) throw new Error('Unauthorized')

  const version = await prisma.policyVersion.findUnique({ 
    where: { id: versionId },
    include: { _count: { select: { rules: true } } }
  })
  if (!version) throw new Error('Not found')
  if (version._count.rules === 0) throw new Error('Wersja musi zawierać co najmniej jedną regułę, aby mogła zostać opublikowana')

  // Archive currently published version
  await prisma.policyVersion.updateMany({
    where: { policyId: version.policyId, status: 'PUBLISHED' },
    data: { status: 'ARCHIVED', validTo: new Date() }
  })

  // Publish new version
  await prisma.policyVersion.update({
    where: { id: versionId },
    data: { status: 'PUBLISHED', validFrom: new Date() }
  })

  await prisma.policy.update({
    where: { id: version.policyId },
    data: { status: 'PUBLISHED' }
  })

  await prisma.auditEvent.create({
    data: {
      action: 'PUBLISH_VERSION',
      entity: 'PolicyVersion',
      entityId: version.id,
      userId: user.id
    }
  })

  revalidatePath(`/policies/${version.policyId}`)
}

export async function rejectVersion(versionId: string) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_APPROVER', 'ADMIN'].includes(user.role)) throw new Error('Unauthorized')

  const version = await prisma.policyVersion.findUnique({ where: { id: versionId } })
  if (!version) throw new Error('Not found')
  if (version.status !== 'IN_REVIEW') throw new Error('Cannot reject a version that is not in review')

  // Move back to DRAFT
  await prisma.policyVersion.update({
    where: { id: versionId },
    data: { status: 'DRAFT' }
  })

  await prisma.auditEvent.create({
    data: {
      action: 'REJECT_VERSION',
      entity: 'PolicyVersion',
      entityId: version.id,
      userId: user.id
    }
  })

  revalidatePath(`/policies/${version.policyId}`)
}

