import { Decision, RequestStatus } from '@prisma/client'
import { prisma } from './prisma'
import { evaluateRequest } from './engine'

export function decisionToStatus(decision: Decision): RequestStatus {
  if (decision === Decision.APPROVED) return RequestStatus.AUTO_APPROVED
  if (decision === Decision.REJECTED) return RequestStatus.REJECTED
  if (decision === Decision.MISSING_INFORMATION) return RequestStatus.NEEDS_INFORMATION
  return RequestStatus.IN_REVIEW
}

const ROLE_STEP_LABELS: Record<string, string> = {
  PROCUREMENT: 'Uzyskaj akceptację działu zakupów.',
  SECURITY: 'Uzyskaj akceptację działu bezpieczeństwa.',
  DPO: 'Uzyskaj akceptację inspektora ochrony danych.',
  CFO: 'Uzyskaj akceptację działu finansów / CFO.',
  FINANCE: 'Uzyskaj akceptację działu finansów.',
}

export function buildNextSteps(missingFields: string[], requiredRoles: string[]): string[] {
  const steps: string[] = []
  for (const field of missingFields) {
    if (field === 'dpaDocument') steps.push('Dodaj dokument DPA jako załącznik typu DPA.')
    else if (field === 'hasDpa') steps.push('Potwierdź posiadanie umowy DPA lub wgraj dokument.')
    else if (field === 'emergencyJustification') steps.push('Uzupełnij uzasadnienie zakupu awaryjnego.')
    else steps.push(`Uzupełnij wymagane pole: ${field}.`)
  }
  for (const role of requiredRoles) {
    steps.push(ROLE_STEP_LABELS[role] || `Uzyskaj akceptację roli: ${role}.`)
  }
  return steps
}

export async function enrichInputWithAttachments(
  requestId: string,
  snapshot: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const attachments = await prisma.requestAttachment.findMany({ where: { requestId } })
  const hasUploadedDpa = attachments.some(a => a.type === 'DPA')
  return {
    ...snapshot,
    hasDpa: Boolean(snapshot.hasDpa) || hasUploadedDpa,
    attachmentTypes: attachments.map(a => a.type),
  }
}

export async function runPolicyEvaluation(inputSnapshot: Record<string, unknown>) {
  const activeRules = await prisma.rule.findMany({
    where: { enabled: true, policyVersion: { status: 'PUBLISHED' } },
    include: { policyVersion: { include: { policy: true } } },
  })
  return evaluateRequest(inputSnapshot, activeRules)
}

export async function persistPolicyEvaluation(
  requestId: string,
  userId: string,
  inputSnapshot: Record<string, unknown>,
  evaluationResult: ReturnType<typeof evaluateRequest>
) {
  const nextSteps = buildNextSteps(evaluationResult.missingFields, evaluationResult.requiredRoles)

  const resultSnapshot = {
    reason: evaluationResult.reasons.join('\n'),
    missingFields: evaluationResult.missingFields,
    requiredRoles: evaluationResult.requiredRoles,
    riskPoints: evaluationResult.riskPoints,
    reasonCodes: evaluationResult.reasonCodes,
    nextSteps,
  }

  const appliedPolicyVersions = Array.from(
    new Map(
      evaluationResult.appliedRules.map(r => [
        r.policyVersionId,
        {
          policyVersionId: r.policyVersionId,
          policyId: r.policyVersion.policyId,
          policyName: r.policyVersion.policy.name,
          version: r.policyVersion.version,
        },
      ])
    ).values()
  )

  const evaluation = await prisma.policyEvaluation.create({
    data: {
      requestId,
      decision: evaluationResult.decision,
      inputSnapshot: inputSnapshot as object,
      resultSnapshot,
      appliedPolicyVersions,
    },
  })

  for (const rule of evaluationResult.appliedRules) {
    const effectsStr = Array.isArray(rule.effect)
      ? (rule.effect as { type: string }[]).map(e => e.type).join(', ')
      : ''
    await prisma.policyEvaluationRuleMatch.create({
      data: {
        policyEvaluationId: evaluation.id,
        ruleId: rule.id,
        policyVersionId: rule.policyVersionId,
        effectTriggered: effectsStr,
        details: rule.reason,
      },
    })
  }

  return { evaluation, resultSnapshot, nextSteps }
}

export async function evaluateAndFinalizeRequest(
  requestId: string,
  userId: string,
  inputSnapshot: Record<string, unknown>,
  auditAction: string,
  transitionPrefix = ''
) {
  await prisma.request.update({
    where: { id: requestId },
    data: { status: RequestStatus.SUBMITTED },
  })

  const enriched = await enrichInputWithAttachments(requestId, inputSnapshot)
  const evaluationResult = await runPolicyEvaluation(enriched)
  const finalStatus = decisionToStatus(evaluationResult.decision)

  await prisma.request.update({
    where: { id: requestId },
    data: {
      inputData: enriched as object,
      status: finalStatus,
      decision: evaluationResult.decision,
    },
  })

  await persistPolicyEvaluation(requestId, userId, enriched, evaluationResult)

  await prisma.auditEvent.create({
    data: {
      action: auditAction,
      entity: 'Request',
      entityId: requestId,
      userId,
      details: {
        transition: `${transitionPrefix}SUBMITTED -> ${finalStatus}`,
      },
    },
  })

  return { finalStatus, evaluationResult }
}
