'use client'

import { useState } from 'react'
import { testRules } from './actions'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { policyVersionStatusLabel, decisionLabel, missingFieldLabel, roleLabel } from '@/lib/labels'

export default function TestConsoleClient({ policyVersions }: { policyVersions: any[] }) {
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const defaultJson = JSON.stringify({
    type: "NEW_VENDOR",
    category: "SOFTWARE",
    annualCost: 150000,
    currency: "PLN",
    department: "IT",
    urgency: "NORMAL",
    vendorRisk: "HIGH",
    processesPersonalData: true,
    hasDpa: false,
    transferOutsideEEA: true
  }, null, 2)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await testRules(formData)
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'Wystąpił błąd')
    }
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Konfiguracja Testu</h2>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kontekst (Zestaw Reguł)</label>
            <select name="policyVersionId" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-slate-900 bg-white">
              <option value="">-- Wszystkie aktywne reguły (Opublikowane) --</option>
              {policyVersions.map(pv => (
                <option key={pv.id} value={pv.id}>
                  {pv.policy.name} (v{pv.version}) - Status: {policyVersionStatusLabel(pv.status)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dane Wejściowe (JSON Snapshot)</label>
            <textarea 
              name="inputJson" 
              defaultValue={defaultJson}
              rows={15}
              className="w-full px-4 py-3 font-mono text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-black"
              required
            ></textarea>
            <p className="text-xs text-slate-500 mt-2">Dostosuj wartości w obiekcie JSON, aby przetestować różne scenariusze (np. brak DPA).</p>
          </div>
          <button type="submit" disabled={loading} className="w-full px-5 py-3 bg-[var(--color-accent)] hover:opacity-90 text-white font-medium rounded-lg transition disabled:opacity-50 shadow-sm">
            {loading ? 'Ewaluacja...' : 'Uruchom Silnik Reguł'}
          </button>
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
        </form>
      </Card>

      <Card className="flex flex-col h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-900">Wynik Ewaluacji</h2>
          {result && (
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${result.decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : result.decision === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
              {decisionLabel(result.decision)}
            </span>
          )}
        </div>
        <div className="p-6 flex-1 overflow-auto bg-white">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 min-h-[300px]">
              <p>Wciśnij &quot;Uruchom Silnik Reguł&quot;, aby zobaczyć wynik dla wpisanych danych.</p>
            </div>
          )}
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[300px] gap-3">
              <Loader2 className="animate-spin text-[var(--color-accent)]" size={32} />
              <p>Trwa ewaluacja...</p>
            </div>
          )}
          {result && (
            <div className="space-y-6">
              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Uzasadnienie</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap shadow-sm">
                  {result.reasons.length > 0 ? result.reasons.join('\n') : 'Brak dodatkowego uzasadnienia.'}
                </div>
              </div>

              {result.missingFields.length > 0 && (
                <div>
                  <h3 className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-2">Brakujące Pola (Wymagane do uzupełnienia)</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingFields.map((f: string) => (
                      <span key={f} className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md">
                        {missingFieldLabel(f)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.requiredRoles.length > 0 && (
                <div>
                  <h3 className="text-[var(--color-accent)] text-xs font-bold uppercase tracking-wider mb-2">Wymagane Role Akceptacji</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.requiredRoles.map((r: string) => (
                      <span key={r} className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">
                        {roleLabel(r)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.appliedRules.length > 0 && (
                <div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Zastosowane Reguły ({result.appliedRules.length})</h3>
                  <div className="space-y-3">
                    {result.appliedRules.map((r: any) => (
                      <div key={r.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                        <p className="font-semibold text-slate-900 text-sm">{r.name}</p>
                        <p className="text-sm text-slate-600">{r.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
