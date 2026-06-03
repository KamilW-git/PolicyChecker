import { Decision, Rule } from '@prisma/client'

type Operator = 'equals' | 'greater_than' | 'less_than' | 'contains'
type LogicOperator = 'AND' | 'OR'

interface SimpleCondition {
  field: string
  operator: Operator
  value: any
}

interface LogicCondition {
  operator: LogicOperator
  conditions: (SimpleCondition | LogicCondition)[]
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
    case 'greater_than':
      return actualValue > simple.value
    case 'less_than':
      return actualValue < simple.value
    case 'contains':
      return typeof actualValue === 'string' && actualValue.includes(simple.value)
    default:
      return false
  }
}

export interface EngineResult {
  decision: Decision
  reasons: string[]
  appliedRules: Rule[]
}

export function evaluateRequest(inputSnapshot: Record<string, any>, rules: Rule[]): EngineResult {
  const appliedRules: Rule[] = []
  const reasons: string[] = []
  let decision: Decision = 'APPROVED'

  // Sort by priority (higher priority first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    if (!rule.enabled) continue

    const isMatch = evaluateCondition(rule.condition, inputSnapshot)
    
    if (isMatch) {
      appliedRules.push(rule)
      reasons.push(rule.reason)

      // If any rule matches and demands review/block, escalate the decision
      if (rule.severity === 'WARNING' || rule.severity === 'BLOCKER') {
        decision = 'REQUIRES_REVIEW'
      }
    }
  }

  // If there are no reasons but we auto-approve
  if (appliedRules.length === 0) {
    reasons.push('Decyzja podjęta automatycznie - brak naruszeń polityk bezpieczeństwa i zakupowych.')
  }

  return {
    decision,
    reasons,
    appliedRules
  }
}
