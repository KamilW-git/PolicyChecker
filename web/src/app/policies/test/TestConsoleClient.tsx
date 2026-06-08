'use client'

import { useState } from 'react'
import { testRules } from './actions'

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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Konfiguracja Testu</h2>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kontekst (Zestaw Reguł)</label>
            <select name="policyVersionId" className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white">
              <option value="">-- Wszystkie aktywne reguły (PUBLISHED) --</option>
              {policyVersions.map(pv => (
                <option key={pv.id} value={pv.id}>
                  {pv.policy.name} (v{pv.version}) - Status: {pv.status}
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
              className="w-full px-4 py-3 font-mono text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
            <p className="text-xs text-slate-500 mt-2">Dostosuj wartości w obiekcie JSON, aby przetestować różne scenariusze (np. brak DPA).</p>
          </div>
          <button type="submit" disabled={loading} className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50">
            {loading ? 'Ewaluacja...' : 'Uruchom Silnik Reguł'}
          </button>
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        </form>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 text-white flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <h2 className="font-bold">Wynik Ewaluacji</h2>
          {result && (
            <span className={`px-2 py-1 text-xs font-bold rounded ${result.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : result.decision === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {result.decision}
            </span>
          )}
        </div>
        <div className="p-6 flex-1 overflow-auto">
          {!result && !loading && (
            <p className="text-slate-500 text-center mt-12">Wciśnij "Uruchom Silnik Reguł", aby zobaczyć wynik dla wpisanych danych.</p>
          )}
          {loading && (
            <p className="text-slate-400 text-center mt-12 animate-pulse">Trwa ewaluacja...</p>
          )}
          {result && (
            <div className="space-y-6">
              <div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Uzasadnienie</h3>
                <div className="bg-slate-800 rounded p-4 text-sm text-slate-300 whitespace-pre-wrap">
                  {result.reasons.length > 0 ? result.reasons.join('\n') : 'Brak dodatkowego uzasadnienia.'}
                </div>
              </div>

              {result.missingFields.length > 0 && (
                <div>
                  <h3 className="text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">Brakujące Pola (REQUIRE_FIELD)</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingFields.map((f: string) => (
                      <span key={f} className="px-2 py-1 bg-orange-900/30 text-orange-400 text-xs font-mono rounded border border-orange-900/50">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.requiredRoles.length > 0 && (
                <div>
                  <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Wymagane Role Akceptacji (REQUIRE_APPROVAL)</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.requiredRoles.map((r: string) => (
                      <span key={r} className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded border border-blue-900/50">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.appliedRules.length > 0 && (
                <div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Zastosowane Reguły ({result.appliedRules.length})</h3>
                  <div className="space-y-2">
                    {result.appliedRules.map((r: any) => (
                      <div key={r.id} className="p-3 bg-slate-800 rounded border border-slate-700">
                        <p className="font-medium text-sm">{r.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{r.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
