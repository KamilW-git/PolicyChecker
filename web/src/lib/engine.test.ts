import { describe, it, expect } from 'vitest'
import { evaluateRequest } from './engine'

describe('Policy Engine', () => {
  const baseRequest = {
    title: 'Test Request',
    description: 'Test',
    type: 'NEW_VENDOR',
    category: 'SOFTWARE',
    annualCost: 10000,
    annualCostEur: 10000,
    currency: 'EUR',
    vendorName: 'Test Vendor',
    vendorCountry: 'PL',
    department: 'IT',
    urgency: 'NORMAL',
    vendorRisk: 'LOW',
    processesPersonalData: false,
    hasDpa: false,
    dataCategories: [],
    transferOutsideEEA: false,
    securityQuestionnaire: false
  }

  it('zwraca APPROVED gdy brak reguł', () => {
    const result = evaluateRequest(baseRequest, [])
    expect(result.decision).toBe('APPROVED')
    expect(result.appliedRules.length).toBe(0)
  })

  it('zwraca REQUIRES_REVIEW gdy reguła wymaga autoryzacji', () => {
    const rules = [{
      id: '1', name: 'Wymagaj IT', priority: 1, enabled: true,
      condition: { field: 'department', operator: 'equals', value: 'IT' },
      effect: [{ type: 'REQUIRE_REVIEW', role: 'POLICY_APPROVER' }],
      policyVersionId: 'v1'
    } as any]
    const result = evaluateRequest(baseRequest, rules)
    expect(result.decision).toBe('REQUIRES_REVIEW')
    expect(result.requiredRoles).toContain('POLICY_APPROVER')
  })

  it('zwraca REJECTED gdy reguła ma efekt REJECT', () => {
    const rules = [{
      id: '2', name: 'Zablokuj wszystko', priority: 10, enabled: true,
      condition: { field: 'vendorRisk', operator: 'equals', value: 'LOW' },
      effect: [{ type: 'REJECT', reason: 'Bo tak' }],
      policyVersionId: 'v1'
    } as any]
    const result = evaluateRequest(baseRequest, rules)
    expect(result.decision).toBe('REJECTED')
  })

  it('zwraca MISSING_INFORMATION gdy brakuje wymaganego pola (np. dpaDocument)', () => {
    const req = { ...baseRequest, processesPersonalData: true, hasDpa: false }
    const rules = [{
      id: '3', name: 'Wymaga DPA', priority: 1, enabled: true,
      condition: { field: 'processesPersonalData', operator: 'equals', value: true },
      effect: [{ type: 'REQUIRE_FIELD', field: 'dpaDocument' }],
      policyVersionId: 'v1'
    } as any]
    const result = evaluateRequest(req, rules)
    expect(result.decision).toBe('MISSING_INFORMATION')
    expect(result.missingFields).toContain('dpaDocument')
  })

  it('priorytet REJECT wygrywa nad MISSING_INFORMATION i REVIEW', () => {
    const req = { ...baseRequest, processesPersonalData: true, hasDpa: false }
    const rules = [
      {
        id: '1', name: 'Wymaga DPA', priority: 1, enabled: true,
        condition: { field: 'processesPersonalData', operator: 'equals', value: true },
        effect: [{ type: 'REQUIRE_FIELD', field: 'dpaDocument' }],
        policyVersionId: 'v1'
      },
      {
        id: '2', name: 'Zawsze odrzucaj z wysokim priorytetem', priority: 100, enabled: true,
        condition: { field: 'processesPersonalData', operator: 'equals', value: true },
        effect: [{ type: 'REJECT' }],
        policyVersionId: 'v1'
      }
    ] as any
    const result = evaluateRequest(req, rules)
    expect(result.decision).toBe('REJECTED')
  })

  it('ewaluacja AND operuje poprawnie', () => {
    const req = { ...baseRequest, annualCost: 50000, vendorRisk: 'HIGH' }
    const rules = [{
      id: 'r1', name: 'Drogi i ryzykowny', priority: 1, enabled: true,
      condition: {
        operator: 'AND',
        conditions: [
          { field: 'annualCost', operator: 'greater_or_equal', value: 50000 },
          { field: 'vendorRisk', operator: 'equals', value: 'HIGH' }
        ]
      },
      effect: [{ type: 'REJECT' }],
      policyVersionId: 'v1'
    } as any]
    
    // Gdy oba są prawdziwe -> REJECT
    const resultTrue = evaluateRequest(req, rules)
    expect(resultTrue.decision).toBe('REJECTED')

    // Gdy tylko jedno -> APPROVED
    const resultFalse = evaluateRequest({ ...req, annualCost: 10000 }, rules)
    expect(resultFalse.decision).toBe('APPROVED')
  })

  it('ewaluacja OR operuje poprawnie', () => {
    const rules = [{
      id: 'r1', name: 'Or test', priority: 1, enabled: true,
      condition: {
        operator: 'OR',
        conditions: [
          { field: 'category', operator: 'equals', value: 'SAAS' },
          { field: 'category', operator: 'equals', value: 'SOFTWARE' }
        ]
      },
      effect: [{ type: 'REQUIRE_REVIEW', role: 'IT_ADMIN' }],
      policyVersionId: 'v1'
    } as any]
    
    const resultSaas = evaluateRequest({ ...baseRequest, category: 'SAAS' }, rules)
    expect(resultSaas.decision).toBe('REQUIRES_REVIEW')

    const resultHardware = evaluateRequest({ ...baseRequest, category: 'HARDWARE' }, rules)
    expect(resultHardware.decision).toBe('APPROVED')
  })

  it('operator greater_or_equal działa na liczbach', () => {
    const rules = [{
      id: 'r1', name: 'Drogo', priority: 1, enabled: true,
      condition: { field: 'annualCost', operator: 'greater_or_equal', value: 50000 },
      effect: [{ type: 'REJECT' }],
      policyVersionId: 'v1'
    } as any]
    const result = evaluateRequest({ ...baseRequest, annualCost: 50000 }, rules)
    expect(result.decision).toBe('REJECTED')

    const result2 = evaluateRequest({ ...baseRequest, annualCost: 49999 }, rules)
    expect(result2.decision).toBe('APPROVED')
  })

  it('operator in / not_in działa poprawnie', () => {
    const rules = [{
      id: 'r1', name: 'Zakazane kraje', priority: 1, enabled: true,
      condition: { field: 'vendorCountry', operator: 'in', value: ['RU', 'KP', 'IR'] },
      effect: [{ type: 'REJECT' }],
      policyVersionId: 'v1'
    } as any]
    
    const resultRu = evaluateRequest({ ...baseRequest, vendorCountry: 'RU' }, rules)
    expect(resultRu.decision).toBe('REJECTED')

    const resultPl = evaluateRequest({ ...baseRequest, vendorCountry: 'PL' }, rules)
    expect(resultPl.decision).toBe('APPROVED')
  })

  it('waliduje pole annualCostEur zamiast annualCost, by ujednolicić waluty', () => {
    const rules = [{
      id: 'r1', name: 'powyzej 10k EUR', priority: 1, enabled: true,
      condition: { field: 'annualCostEur', operator: 'greater_or_equal', value: 10000 },
      effect: [{ type: 'REJECT' }],
      policyVersionId: 'v1'
    } as any]
    
    // Wniosek na 40000 PLN = ok. 9300 EUR (poniżej 10000)
    const req = { ...baseRequest, currency: 'PLN', annualCost: 40000, annualCostEur: 9302 }
    const result = evaluateRequest(req, rules)
    expect(result.decision).toBe('APPROVED')

    // Wniosek na 50000 PLN = ok. 11627 EUR (powyżej 10000)
    const req2 = { ...baseRequest, currency: 'PLN', annualCost: 50000, annualCostEur: 11627 }
    const result2 = evaluateRequest(req2, rules)
    expect(result2.decision).toBe('REJECTED')
  })
})
