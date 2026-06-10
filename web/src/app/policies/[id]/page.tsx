import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { addRuleAction, editRuleAction, deleteRuleAction, createDraftVersion, submitForReview, approveAndPublish, rejectVersion } from './actions'
import RuleBuilder from '@/components/RuleBuilder'
import DeletePolicyButton from './DeletePolicyButton'

export default async function PolicyDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ editRuleId?: string, success?: string, newRule?: string, error?: string }>
}) {
  const { id } = await params
  const { editRuleId, success, newRule, error } = await searchParams
  const user = await getCurrentUser()
  
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        include: { rules: { orderBy: { priority: 'desc' } } }
      }
    }
  })

  if (!policy || policy.versions.length === 0) return notFound()

  const latestVersion = policy.versions[0]
  const canManagePolicy = ['POLICY_OWNER', 'POLICY_APPROVER', 'ADMIN'].includes(user?.role || '')

  // Wersje robocze / w review widzą tylko Owner, Approver, Admin
  let displayVersion = latestVersion
  if (!canManagePolicy) {
    if (latestVersion.status === 'PUBLISHED') {
      displayVersion = latestVersion
    } else {
      const publishedVersion = policy.versions.find(v => v.status === 'PUBLISHED')
      if (!publishedVersion) return notFound()
      displayVersion = publishedVersion
    }
  }

  const activeRules = displayVersion.rules
  const isOwnerOrAdmin = ['POLICY_OWNER', 'ADMIN'].includes(user?.role || '')
  const isApproverOrAdmin = ['POLICY_APPROVER', 'ADMIN'].includes(user?.role || '')

  const canEditRules = isOwnerOrAdmin && latestVersion.status === 'DRAFT'

  const versionIds = policy.versions.map(v => v.id)
  const auditLogs = await prisma.auditEvent.findMany({
    where: { entity: 'PolicyVersion', entityId: { in: versionIds } },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/policies" className="text-slate-500 hover:text-slate-800 transition">
          &larr; Wróć do listy polityk
        </Link>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between">
          <span className="font-medium">Zapisano pomyślnie.</span>
          <Link href={`/policies/${id}`} className="text-emerald-600 hover:text-emerald-800">✕</Link>
        </div>
      )}

      {error === 'no_rules' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-center justify-between">
          <span className="font-medium">Dodaj co najmniej jedną regułę przed przekazaniem polityki do zatwierdzenia.</span>
          <Link href={`/policies/${id}`} className="text-amber-700 hover:text-amber-900">✕</Link>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{policy.domain}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{policy.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{policy.description}</p>
          </div>
          {user?.role === 'ADMIN' && (
            <DeletePolicyButton policyId={policy.id} />
          )}
        </div>

        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-3">
              {displayVersion.id !== latestVersion.id ? (
                <>Opublikowana Wersja (v{displayVersion.version})</>
              ) : (
                <>Najnowsza Wersja (v{displayVersion.version})</>
              )}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                ${displayVersion.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 
                  displayVersion.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-800' : 
                  'bg-slate-100 text-slate-800'}`}>
                {displayVersion.status}
              </span>
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {displayVersion.status === 'PUBLISHED' ? 'Ta wersja jest aktywnie wykorzystywana przez silnik oceny.' :
               displayVersion.status === 'DRAFT' ? 'Wersja robocza. Możesz modyfikować reguły przed przekazaniem do zatwierdzenia.' :
               'Oczekuje na zatwierdzenie przez Policy Approvera.'}
            </p>
            {displayVersion.description && (
              <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-50 border border-slate-200 rounded">
                <span className="font-semibold">Opis zmian:</span> {displayVersion.description}
              </p>
            )}
            {(displayVersion.validFrom || displayVersion.validTo) && (
              <p className="text-xs text-slate-500 mt-2 font-mono">
                Obowiązuje: {displayVersion.validFrom ? displayVersion.validFrom.toLocaleDateString() : 'Brak'} - {displayVersion.validTo ? displayVersion.validTo.toLocaleDateString() : 'Brak'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isOwnerOrAdmin && latestVersion.status === 'PUBLISHED' && (
              <form action={createDraftVersion.bind(null, policy.id)} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                <input type="text" name="description" placeholder="Opis nowej wersji..." required className="text-sm border border-slate-300 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition whitespace-nowrap">
                  Utwórz DRAFT
                </button>
              </form>
            )}

            {isOwnerOrAdmin && latestVersion.status === 'DRAFT' && (
              latestVersion.rules.length > 0 ? (
                <form action={submitForReview.bind(null, latestVersion.id)}>
                  <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm transition">
                    Przekaż do zatwierdzenia
                  </button>
                </form>
              ) : (
                <span className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  Dodaj regułę, aby przekazać do zatwierdzenia
                </span>
              )
            )}

            {isApproverOrAdmin && latestVersion.status === 'IN_REVIEW' && (
              <div className="flex gap-2">
                <form action={rejectVersion.bind(null, latestVersion.id)}>
                  <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition">
                    Odrzuć (Zwróć do DRAFT)
                  </button>
                </form>
                <form action={approveAndPublish.bind(null, latestVersion.id)}>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm transition">
                    Zatwierdź i Opublikuj
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-8 py-4 font-semibold w-1/4">Nazwa Reguły</th>
                <th className="px-8 py-4 font-semibold w-1/4">Warunek (JSON)</th>
                <th className="px-8 py-4 font-semibold w-1/4">Efekt (JSON)</th>
                <th className="px-8 py-4 font-semibold w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {activeRules.map(rule => {
                if (editRuleId === rule.id && canEditRules) {
                  return (
                    <tr key={rule.id} className="bg-slate-50 border-y border-slate-200">
                      <td colSpan={4} className="p-0">
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
                              <label className="block text-xs font-medium text-slate-500 mb-1">Severity (Skutek UI)</label>
                              <select name="severity" defaultValue={rule.severity} className="w-full bg-white border border-slate-300 rounded p-2 text-sm text-slate-900 focus:ring-blue-500 outline-none">
                                <option value="INFO">INFO</option>
                                <option value="WARNING">WARNING</option>
                                <option value="BLOCKER">BLOCKER</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-4">
                            <RuleBuilder 
                              defaultCondition={rule.condition as any} 
                              defaultEffect={rule.effect as any} 
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
                        {canEditRules && (
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
                      <pre className="text-[10px] leading-tight bg-slate-900 text-slate-300 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(rule.condition, null, 2)}
                      </pre>
                    </td>
                    <td className="px-8 py-4">
                      <pre className="text-[10px] leading-tight bg-slate-800 text-amber-200 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(rule.effect, null, 2)}
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
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-500">
                    Brak zdefiniowanych reguł dla tej wersji.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canEditRules && newRule !== 'true' && (
        <div className="mt-8 flex justify-end">
          <Link href={`/policies/${id}?newRule=true`} className="px-6 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition">
            + Dodaj Nową Regułę
          </Link>
        </div>
      )}

      {canEditRules && newRule === 'true' && (
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
                  <label className="block text-sm font-medium text-slate-400 mb-1">Severity (Tylko informacyjnie UI)</label>
                  <select name="severity" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none">
                    <option value="INFO">INFO (Tylko log)</option>
                    <option value="WARNING">WARNING (Wymaga akceptacji)</option>
                    <option value="BLOCKER">BLOCKER (Odrzuca od razu)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <RuleBuilder />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <Link href={`/policies/${id}`} className="px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-white transition">
                  Anuluj
                </Link>
                <button type="submit" className="px-6 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition">Zapisz Regułę</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT TRAIL FOR POLICY */}
      {['REVIEWER', 'ADMIN', 'AUDITOR', 'POLICY_OWNER'].includes(user?.role || '') && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mt-8">
          <div className="px-8 py-5 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>🛡️</span> Ślad Rewizyjny (Audit Trail)
            </h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-200">
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td className="px-8 py-3 text-slate-500 whitespace-nowrap w-48">{log.createdAt.toLocaleString()}</td>
                    <td className="px-8 py-3 font-medium text-slate-900">{log.user?.name || 'System'}</td>
                    <td className="px-8 py-3 text-slate-700">{log.action}</td>
                    <td className="px-8 py-3 text-slate-500 font-mono text-xs">{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-4 text-center text-slate-500">Brak wpisów audytowych.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
