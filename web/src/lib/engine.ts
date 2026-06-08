import { Decision, Rule } from '@prisma/client'

export type Operator = 
  | 'equals' | 'not_equals' 
  | 'greater_than' | 'greater_or_equal' 
  | 'less_than' | 'less_or_equal' 
  | 'contains' | 'not_contains' 
  | 'is_empty' | 'is_not_empty' 
  | 'in' | 'not_in'

export type LogicOperator = 'AND' | 'OR'

export interface SimpleCondition {
  field: string
  operator: Operator
  value?: any
}

export interface LogicCondition {
  operator: LogicOperator
  conditions: (SimpleCondition | LogicCondition)[]
}

export type EffectType = 
  | 'APPROVE' 
  | 'REQUIRE_REVIEW' 
  | 'REJECT' 
  | 'REQUIRE_FIELD' 
  | 'ADD_RISK_POINTS' 
  | 'ADD_REASON_CODE'

export interface RuleEffect {
  type: EffectType
  role?: string
  field?: string
  points?: number
  code?: string
}

function evaluateCondition(condition: any, input: Record<string, any>): boolean {
  if (condition.operator === 'AND') {
    return (condition.conditions as any[]).every(c => evaluateCondition(c, input))
  }
  
  if (condition.operator === 'OR') {
    return (condition.conditions as any[]).some(c => evaluateCondition(c, input))
  }

  // Simple Condition
  const simple = condition as SimpleCondition
  const actualValue = input[simple.field]

  switch (simple.operator) {
    case 'equals':
      return actualValue === simple.value
    case 'not_equals':
      return actualValue !== simple.value
    case 'greater_than':
      return actualValue > simple.value
    case 'greater_or_equal':
      return actualValue >= simple.value
    case 'less_than':
      return actualValue < simple.value
    case 'less_or_equal':
      return actualValue <= simple.value
    case 'contains':
      return typeof actualValue === 'string' && typeof simple.value === 'string' && actualValue.includes(simple.value)
    case 'not_contains':
      return typeof actualValue === 'string' && typeof simple.value === 'string' && !actualValue.includes(simple.value)
    case 'is_empty':
      return actualValue === null || actualValue === undefined || actualValue === '' || (Array.isArray(actualValue) && actualValue.length === 0)
    case 'is_not_empty':
      return actualValue !== null && actualValue !== undefined && actualValue !== '' && !(Array.isArray(actualValue) && actualValue.length === 0)
    case 'in':
      return Array.isArray(simple.value) && simple.value.includes(actualValue)
    case 'not_in':
      return Array.isArray(simple.value) && !simple.value.includes(actualValue)
    default:
      return false
  }
}

export interface EngineResult {
  decision: Decision
  reasons: string[]
  appliedRules: Rule[]
  missingFields: string[]
  requiredRoles: string[]
  riskPoints: number
  reasonCodes: string[]
}

const DECISION_WEIGHT: Record<Decision, number> = {
  REJECTED: 4,
  MISSING_INFORMATION: 3,
  REQUIRES_REVIEW: 2,
  APPROVED: 1
}

export function evaluateRequest(inputSnapshot: Record<string, any>, rules: Rule[]): EngineResult {
  const appliedRules: Rule[] = []
  const reasons: string[] = []
  let decision: Decision = 'APPROVED'
  
  const missingFields = new Set<string>()
  const requiredRoles = new Set<string>()
  let riskPoints = 0
  const reasonCodes = new Set<string>()

  // Sort by priority (higher priority first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    if (!rule.enabled) continue

    const isMatch = evaluateCondition(rule.condition, inputSnapshot)
    
    if (isMatch) {
      appliedRules.push(rule)
      reasons.push(rule.reason)

      const effects = Array.isArray(rule.effect) ? rule.effect as RuleEffect[] : []
      
      // Fallback (P1-11): Jeśli severity = BLOCKER, a nie ma efektu REJECT, potraktuj to jako REJECT
      const hasReject = effects.some(e => e.type === 'REJECT')
      if (rule.severity === 'BLOCKER' && !hasReject) {
        effects.push({ type: 'REJECT' })
      }

      for (const effect of effects) {
        if (effect.type === 'REJECT') {
          if (DECISION_WEIGHT['REJECTED'] > DECISION_WEIGHT[decision]) decision = 'REJECTED'
        } else if (effect.type === 'REQUIRE_FIELD') {
          if (DECISION_WEIGHT['MISSING_INFORMATION'] > DECISION_WEIGHT[decision]) decision = 'MISSING_INFORMATION'
          if (effect.field) missingFields.add(effect.field)
        } else if (effect.type === 'REQUIRE_REVIEW') {
          if (DECISION_WEIGHT['REQUIRES_REVIEW'] > DECISION_WEIGHT[decision]) decision = 'REQUIRES_REVIEW'
          if (effect.role) requiredRoles.add(effect.role)
        } else if (effect.type === 'APPROVE') {
          // APPROVE działa tylko gdy nie ma silniejszej decyzji (np. REJECTED lub REQUIRES_REVIEW)
          if (DECISION_WEIGHT['APPROVED'] > DECISION_WEIGHT[decision]) decision = 'APPROVED'
        } else if (effect.type === 'ADD_RISK_POINTS') {
          riskPoints += effect.points || 0
        } else if (effect.type === 'ADD_REASON_CODE') {
          if (effect.code) reasonCodes.add(effect.code)
        }
      }
    }
  }

  if (appliedRules.length === 0) {
    reasons.push('Decyzja podjęta automatycznie - brak naruszeń polityk bezpieczeństwa i zakupowych.')
  }

  return {
    decision,
    reasons,
    appliedRules,
    missingFields: Array.from(missingFields),
    requiredRoles: Array.from(requiredRoles),
    riskPoints,
    reasonCodes: Array.from(reasonCodes)
  }
}
