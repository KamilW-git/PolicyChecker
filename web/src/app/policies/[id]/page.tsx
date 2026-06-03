import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { addRuleAction, editRuleAction, deleteRuleAction } from './actions'

export default async function PolicyDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ editRuleId?: string, success?: string }>
}) {
  const { id } = await params
  const { editRuleId, success } = await searchParams
  const user = await getCurrentUser()
  
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        include: {
          rules: true
        }
      }
    }
  })

  if (!policy) return notFound()

  // For MVP, we just take the latest version
  const latestVersion = policy.versions[0]
  const activeRules = latestVersion?.rules || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/policies" className="text-slate-500 hover:text-slate-800 transition">
          &larr; Wróć do listy polityk
        </Link>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between">
          <span className="font-medium">Zapisano regułę pomyślnie.</span>
          <Link href={`/policies/${id}`} className="text-emerald-600 hover:text-emerald-800">
            ✕
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{policy.domain}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{policy.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{policy.description}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
            ${policy.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
            {policy.status}
          </span>
        </div>

        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900">Aktualna Wersja (v{latestVersion?.version || 1})</h3>
            <p className="text-sm text-slate-500 mt-1">Reguły zdefiniowane w tej wersji będą używane do automatycznej oceny wniosków.</p>
          </div>
        </div>

        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-8 py-4 font-semibold w-1/3">Nazwa Reguły</th>
                <th className="px-8 py-4 font-semibold">Warunek (JSON)</th>
                <th className="px-8 py-4 font-semibold w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {activeRules.map(rule => {
                if (editRuleId === rule.id && user?.role === 'POLICY_OWNER') {
                  return (
                    <tr key={rule.id} className="bg-slate-50 border-y border-slate-200">
                      <td colSpan={3} className="p-0">
                        <form action={editRuleAction.bind(null, rule.id)} className="p-6 space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-900">Edycja Reguły</h4>
                            <Link href={`/policies/${id}`} className="text-sm text-slate-500 hover:text-slate-700">Anuluj</Link>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Nazwa Reguły</label>
                            <input type="text" name="name" required defaultValue={rule.name} className="w-full bg-white border border-slate-300 rounded p-2 text-sm text-slate-900 focus:ring-blue-500 outline-none" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Uzasadnienie naruszenia</label>
                              <input type="text" name="reason" required defaultValue={rule.reason} className="w-full bg-white border border-slate-300 rounded p-2 text-sm text-slate-900 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Severity (Skutek)</label>
                              <select name="severity" defaultValue={rule.severity} className="w-full bg-white border border-slate-300 rounded p-2 text-sm text-slate-900 focus:ring-blue-500 outline-none">
                                <option value="INFO">INFO (Tylko log)</option>
                                <option value="WARNING">WARNING (Wymaga akceptacji)</option>
                                <option value="BLOCKER">BLOCKER (Odrzuca od razu)</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Warunek (Valid JSON)</label>
                            <textarea 
                              name="condition" 
                              required 
                              defaultValue={JSON.stringify(rule.condition, null, 2)}
                              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:ring-blue-500 outline-none font-mono text-xs h-32"
                            />
                          </div>
                          <div className="flex justify-between pt-2">
                            <button formAction={deleteRuleAction.bind(null, rule.id)} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition">Usuń regułę</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition">Zapisz zmiany</button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={rule.id} className="hover:bg-slate-50/50 transition group">
                    <td className="px-8 py-4">
                      <div className="flex justify-between">
                        <p className="font-bold text-slate-900">{rule.name}</p>
                        {user?.role === 'POLICY_OWNER' && (
                          <Link href={`/policies/${id}?editRuleId=${rule.id}`} className="opacity-0 group-hover:opacity-100 text-xs font-medium text-blue-600 hover:text-blue-800 transition">
                            Edytuj
                          </Link>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2
                        ${rule.severity === 'BLOCKER' ? 'bg-red-100 text-red-800' : 
                          rule.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <pre className="text-xs bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(rule.condition, null, 2)}
                      </pre>
                    </td>
                    <td className="px-8 py-4">
                      {rule.enabled ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktywna
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-300"></span> Wyłączona
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {activeRules.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-500">
                    Brak zdefiniowanych reguł dla tej wersji.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {user?.role === 'POLICY_OWNER' && latestVersion && (
        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden text-white mt-8">
          <div className="px-8 py-5 border-b border-slate-800 bg-slate-950/50">
            <h2 className="text-lg font-bold">Dodaj Nową Regułę (JSON Mode)</h2>
          </div>
          <div className="p-8">
            <form action={addRuleAction.bind(null, latestVersion.id)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nazwa Reguły</label>
                <input type="text" name="name" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Uzasadnienie naruszenia</label>
                  <input type="text" name="reason" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Severity (Skutek)</label>
                  <select name="severity" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none">
                    <option value="INFO">INFO (Tylko log)</option>
                    <option value="WARNING">WARNING (Wymaga akceptacji)</option>
                    <option value="BLOCKER">BLOCKER (Odrzuca od razu)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Warunek (Valid JSON)</label>
                <textarea 
                  name="condition" 
                  required 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none font-mono text-sm h-32"
                  defaultValue={`{\n  "field": "annualCost",\n  "operator": "greater_than",\n  "value": 10000\n}`}
                />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="px-6 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition">Zapisz Regułę</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
