'use client'

import React, { useState } from 'react'

type Operator = 'equals' | 'not_equals' | 'greater_than' | 'greater_or_equal' | 'less_than' | 'less_or_equal' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'is_empty' | 'is_not_empty'
type EffectType = 'APPROVE' | 'REQUIRE_REVIEW' | 'REJECT' | 'REQUIRE_FIELD' | 'ADD_RISK_POINTS' | 'ADD_REASON_CODE'

interface Condition {
  field: string
  operator: Operator
  value: string
}

interface Effect {
  type: EffectType
  role?: string
  field?: string
  points?: number
  code?: string
}

const FIELDS = [
  { id: 'category', label: 'Kategoria' },
  { id: 'annualCost', label: 'Koszt roczny (EUR)' },
  { id: 'currency', label: 'Waluta' },
  { id: 'department', label: 'Departament' },
  { id: 'vendorRisk', label: 'Ryzyko dostawcy (LOW/MEDIUM/HIGH/CRITICAL)' },
  { id: 'urgency', label: 'Pilność (NORMAL/HIGH/EMERGENCY)' },
  { id: 'processesPersonalData', label: 'Przetwarza dane osobowe (true/false)' },
  { id: 'hasDpa', label: 'Posiada DPA (true/false)' }
]

const OPERATORS = [
  { id: 'equals', label: 'Równe (==)' },
  { id: 'not_equals', label: 'Różne (!=)' },
  { id: 'greater_than', label: 'Większe niż (>)' },
  { id: 'greater_or_equal', label: 'Większe lub równe (>=)' },
  { id: 'less_than', label: 'Mniejsze niż (<)' },
  { id: 'less_or_equal', label: 'Mniejsze lub równe (<=)' },
  { id: 'contains', label: 'Zawiera' },
  { id: 'not_contains', label: 'Nie zawiera' },
  { id: 'in', label: 'Znajduje się w (po przecinku)' },
  { id: 'not_in', label: 'Nie znajduje się w (po przecinku)' },
  { id: 'is_empty', label: 'Jest puste' },
  { id: 'is_not_empty', label: 'Nie jest puste' }
]

const EFFECTS = [
  { id: 'REQUIRE_REVIEW', label: 'Wymaga przeglądu przez' },
  { id: 'REJECT', label: 'Odrzuć wniosek' },
  { id: 'APPROVE', label: 'Zatwierdź wniosek' },
  { id: 'REQUIRE_FIELD', label: 'Wymagaj pola informacyjnego' },
  { id: 'ADD_RISK_POINTS', label: 'Dodaj punkty ryzyka' },
  { id: 'ADD_REASON_CODE', label: 'Dodaj kod decyzyjny' }
]

export default function RuleBuilder({
  defaultCondition = null,
  defaultEffect = null
}: {
  defaultCondition?: any
  defaultEffect?: any
}) {
  const [conditions, setConditions] = useState<Condition[]>(() => {
    if (!defaultCondition) return [{ field: 'annualCost', operator: 'greater_than', value: '5000' }]
    if (defaultCondition.operator === 'AND' && Array.isArray(defaultCondition.conditions)) {
      return defaultCondition.conditions.map((c: any) => ({ 
        ...c, 
        value: Array.isArray(c.value) ? c.value.join(', ') : (c.value?.toString() || '') 
      }))
    }
    return [{ 
      ...defaultCondition, 
      value: Array.isArray(defaultCondition.value) ? defaultCondition.value.join(', ') : (defaultCondition.value?.toString() || '') 
    }]
  })

  const [effects, setEffects] = useState<Effect[]>(() => {
    if (!defaultEffect) return [{ type: 'REQUIRE_REVIEW', role: 'PROCUREMENT' }]
    return defaultEffect
  })

  // Format the output
  const outputCondition = conditions.length === 1 
    ? { ...conditions[0], value: parseValue(conditions[0].value, conditions[0].operator) }
    : { operator: 'AND', conditions: conditions.map(c => ({ ...c, value: parseValue(c.value, c.operator) })) }
  
  const outputEffect = effects.map(eff => {
    // Cast numeric points before saving
    if (eff.type === 'ADD_RISK_POINTS' && eff.points) {
      return { ...eff, points: Number(eff.points) }
    }
    return eff
  })

  function parseValue(val: string, operator: string) {
    if (operator === 'in' || operator === 'not_in') {
      return val.split(',').map(s => s.trim()).filter(s => s !== '')
    }
    if (val === 'true') return true
    if (val === 'false') return false
    if (!isNaN(Number(val)) && val !== '') return Number(val)
    return val
  }

  const addCondition = () => setConditions([...conditions, { field: 'category', operator: 'equals', value: '' }])
  const removeCondition = (index: number) => setConditions(conditions.filter((_, i) => i !== index))

  const addEffect = () => setEffects([...effects, { type: 'REQUIRE_REVIEW', role: '' }])
  const removeEffect = (index: number) => setEffects(effects.filter((_, i) => i !== index))

  return (
    <div className="space-y-6">
      {/* UKRYTE POLA DLA FORMULARZA SERWEROWEGO */}
      <input type="hidden" name="condition" value={JSON.stringify(outputCondition)} />
      <input type="hidden" name="effect" value={JSON.stringify(outputEffect)} />

      {/* WARUNKI */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Kiedy zachodzą warunki (AND)</h3>
          <button type="button" onClick={addCondition} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition">
            + Dodaj Warunek
          </button>
        </div>
        
        <div className="space-y-3">
          {conditions.map((cond, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select 
                value={cond.field}
                onChange={e => {
                  const newConds = [...conditions]
                  newConds[i].field = e.target.value
                  setConditions(newConds)
                }}
                className="bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded p-2 flex-1"
              >
                {FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>

              <select 
                value={cond.operator}
                onChange={e => {
                  const newConds = [...conditions]
                  newConds[i].operator = e.target.value as Operator
                  setConditions(newConds)
                }}
                className="bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded p-2 w-48"
              >
                {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>

              {cond.operator !== 'is_empty' && cond.operator !== 'is_not_empty' && (
                <input 
                  type="text" 
                  value={cond.value}
                  placeholder="Wartość..."
                  onChange={e => {
                    const newConds = [...conditions]
                    newConds[i].value = e.target.value
                    setConditions(newConds)
                  }}
                  className="bg-slate-950 border border-slate-700 text-sm text-slate-200 rounded p-2 flex-1"
                />
              )}

              <button type="button" onClick={() => removeCondition(i)} className="text-slate-500 hover:text-red-400 p-2">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* EFEKTY */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">Wtedy wykonaj akcje</h3>
          <button type="button" onClick={addEffect} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded transition">
            + Dodaj Efekt
          </button>
        </div>
        
        <div className="space-y-3">
          {effects.map((eff, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select 
                value={eff.type}
                onChange={e => {
                  const newEffs = [...effects]
                  newEffs[i].type = e.target.value as EffectType
                  setEffects(newEffs)
                }}
                className="bg-slate-900 border border-slate-600 text-sm text-amber-200 rounded p-2 flex-1"
              >
                {EFFECTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>

              {eff.type === 'REQUIRE_REVIEW' && (
                <input 
                  type="text" 
                  value={eff.role || ''}
                  placeholder="Rola (np. PROCUREMENT)"
                  onChange={e => {
                    const newEffs = [...effects]
                    newEffs[i].role = e.target.value
                    setEffects(newEffs)
                  }}
                  className="bg-slate-900 border border-slate-600 text-sm text-white rounded p-2 flex-1"
                />
              )}

              {eff.type === 'REQUIRE_FIELD' && (
                <input 
                  type="text" 
                  value={eff.field || ''}
                  placeholder="Pole (np. hasDpa)"
                  onChange={e => {
                    const newEffs = [...effects]
                    newEffs[i].field = e.target.value
                    setEffects(newEffs)
                  }}
                  className="bg-slate-900 border border-slate-600 text-sm text-white rounded p-2 flex-1"
                />
              )}

              {eff.type === 'ADD_RISK_POINTS' && (
                <input 
                  type="number" 
                  value={eff.points || ''}
                  placeholder="Punkty (np. 10)"
                  onChange={e => {
                    const newEffs = [...effects]
                    newEffs[i].points = Number(e.target.value)
                    setEffects(newEffs)
                  }}
                  className="bg-slate-900 border border-slate-600 text-sm text-white rounded p-2 flex-1"
                />
              )}

              {eff.type === 'ADD_REASON_CODE' && (
                <input 
                  type="text" 
                  value={eff.code || ''}
                  placeholder="Kod (np. NO_DPA)"
                  onChange={e => {
                    const newEffs = [...effects]
                    newEffs[i].code = e.target.value
                    setEffects(newEffs)
                  }}
                  className="bg-slate-900 border border-slate-600 text-sm text-white rounded p-2 flex-1"
                />
              )}

              <button type="button" onClick={() => removeEffect(i)} className="text-slate-400 hover:text-red-400 p-2">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
