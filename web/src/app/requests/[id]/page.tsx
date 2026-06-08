import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import ManualOverrideModal from './ManualOverrideModal'
import { addComment, submitDraftRequest } from '../actions'

export default async function RequestDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      requester: true,
      businessOwner: true,
      attachments: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: 'asc' }
      },
      evaluations: {
        orderBy: { evaluatedAt: 'desc' },
        include: {
          ruleMatches: {
            include: {
              rule: true,
              policyVersion: {
                include: { policy: true }
              }
            }
          }
        }
      },
      manualOverrides: {
        orderBy: { createdAt: 'asc' },
        include: { createdBy: true }
      }
    }
  })

  if (!request) return notFound()

  // RBAC checks for request viewing
  if (['REQUESTER'].includes(user?.role || '')) {
    if (request.requesterId !== user?.id) {
      return notFound()
    }
  }

  const evaluation = request.evaluations[0]
  const overrides = request.manualOverrides || []

  const auditLogs = await prisma.auditEvent.findMany({
    where: { entity: 'Request', entityId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })

  const canReview = ['REVIEWER', 'ADMIN'].includes(user?.role || '')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <Link href="/requests" className="text-slate-500 hover:text-slate-800 transition">
          &larr; Wróć do listy
        </Link>
        <div className="flex gap-3">
          {request.status === 'DRAFT' && request.requesterId === user?.id && (
            <>
              <Link href={`/requests/${request.id}/edit`} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition">
                Edytuj Szkic
              </Link>
              <form action={submitDraftRequest.bind(null, request.id)}>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition">
                  Przekaż do oceny
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {request.status === 'NEEDS_INFORMATION' && request.requesterId === user?.id && evaluation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-1">⚠️</span>
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Wymagane Uzupełnienie Informacji</h3>
              <p className="text-amber-800 mt-1">Twój wniosek został zablokowany, ponieważ brakuje wymaganych informacji lub dokumentów.</p>
              {((evaluation.resultSnapshot as any)?.missingFields as string[])?.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <span className="text-sm font-medium text-amber-900">Braki:</span>
                  <div className="flex flex-wrap gap-2">
                    {((evaluation.resultSnapshot as any)?.missingFields as string[]).map(field => (
                      <span key={field} className="px-2 py-1 bg-amber-200 text-amber-900 text-xs font-bold rounded-md">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Link href={`/requests/${request.id}/edit`} className="whitespace-nowrap px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition shadow-sm">
            Uzupełnij i prześlij ponownie
          </Link>
        </div>
      )}

      {overrides.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Historia Decyzji Manualnych</h2>
          {overrides.map((ov) => (
            <div key={ov.id} className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Manual Override</span>
                  <h3 className={`font-bold mt-1 ${
                    ov.overrideDecision.includes('APPROVED') ? 'text-emerald-600' : 
                    ov.overrideDecision.includes('REJECTED') ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {ov.overrideDecision}
                  </h3>
                  <div className="text-sm mt-1">
                    <span className="text-slate-500">System Decision:</span> <span className="font-medium text-slate-700">{ov.originalDecision || 'Brak'}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">Override Status:</span> <span className="font-medium text-slate-900">{ov.overrideStatus}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {ov.createdAt.toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Reviewer</p>
                  <p className="text-sm font-medium text-slate-900">{ov.createdBy.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Approved By</p>
                  <p className="text-sm font-medium text-slate-900">{ov.approvedBy}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-0.5">Reason</p>
                  <p className="text-sm text-slate-700">{ov.reason}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-0.5">Comment</p>
                  <p className="text-sm text-slate-700">{ov.comment}</p>
                </div>
                {ov.attachmentPath && (
                  <div className="col-span-2 mt-2">
                    <a href={ov.attachmentPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded hover:bg-slate-200 transition border border-slate-200">
                      📄 Pobierz załącznik
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{request.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Wniosek utworzony {request.createdAt.toLocaleDateString()} przez {request.requester.name}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
            ${request.status === 'AUTO_APPROVED' || request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 
              request.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
              request.status === 'IN_REVIEW' || request.status === 'NEEDS_INFORMATION' ? 'bg-amber-100 text-amber-800' : 
              'bg-slate-100 text-slate-800'}`}>
            {request.status}
          </span>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informacje Ogólne</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-slate-500">Kategoria</dt>
                <dd className="font-medium text-slate-900">{request.category}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Typ</dt>
                <dd className="font-medium text-slate-900">{request.type}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Dział</dt>
                <dd className="font-medium text-slate-900">{request.department}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Pilność (Urgency)</dt>
                <dd className={`font-medium ${request.urgency === 'EMERGENCY' ? 'text-red-600' : 'text-slate-900'}`}>{request.urgency}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Finanse i Dostawca</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-slate-500">Szacowany Roczny Koszt</dt>
                <dd className="font-medium text-slate-900">{request.annualCost?.toLocaleString()} {request.currency}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Dostawca</dt>
                <dd className="font-medium text-slate-900">{request.vendorName} ({request.vendorCountry})</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Właściciel Biznesowy</dt>
                <dd className="font-medium text-slate-900">{request.businessOwner.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Ryzyko Dostawcy (Risk)</dt>
                <dd className={`font-medium ${request.vendorRisk === 'CRITICAL' || request.vendorRisk === 'HIGH' ? 'text-red-600' : 'text-slate-900'}`}>{request.vendorRisk}</dd>
              </div>
            </dl>
          </div>

          <div className="col-span-1 md:col-span-2 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Bezpieczeństwo i RODO</h3>
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <span className={`text-xl ${request.processesPersonalData ? 'text-amber-500' : 'text-slate-300'}`}>
                  {request.processesPersonalData ? '⚠️' : '✓'}
                </span>
                <span className="text-sm font-medium text-slate-700">Przetwarza dane osobowe: {request.processesPersonalData ? 'TAK' : 'NIE'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xl ${request.hasDpa ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {request.hasDpa ? '✓' : '⚠️'}
                </span>
                <span className="text-sm font-medium text-slate-700">Posiada DPA: {request.hasDpa ? 'TAK' : 'NIE'}</span>
              </div>
            </div>
            {request.dataCategories && (
              <div className="mt-4">
                <span className="text-sm text-slate-500">Kategorie danych: </span>
                <span className="text-sm font-medium text-slate-900">{(request.dataCategories as string[]).join(', ')}</span>
              </div>
            )}
          </div>

          <div className="col-span-1 md:col-span-2 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Uzasadnienie Biznesowe</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        </div>
      </div>

      {evaluation && (
        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden text-white">
          <div className="px-8 py-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-blue-400">⚡</span> Policy Checker
            </h2>
            <span className="text-sm text-slate-400">Decyzja Systemu ({evaluation.evaluatedAt.toLocaleString()})</span>
          </div>
          <div className="p-8">
            <div className="flex items-start gap-4 mb-8">
              <div className={`p-3 rounded-xl ${evaluation.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : evaluation.decision === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {evaluation.decision === 'APPROVED' ? '✓' : evaluation.decision === 'REJECTED' ? '✕' : '⚠️'}
              </div>
              <div>
                <h3 className="font-bold text-xl mb-1">
                  {evaluation.decision === 'APPROVED' ? 'Zatwierdzono automatycznie' : evaluation.decision === 'REJECTED' ? 'Odrzucono przez system' : 'Wymaga weryfikacji lub uzupełnienia'}
                </h3>
                <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {(evaluation.resultSnapshot as any)?.reason || 'Decyzja podjęta na podstawie wbudowanych reguł.'}
                </p>
              </div>
            </div>
            
            {/* Złamane reguły / Użyte zasady */}
            {evaluation.ruleMatches && evaluation.ruleMatches.length > 0 && (
              <div className="mt-6 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
                  <h4 className="font-semibold text-slate-200">Zastosowane Reguły ({evaluation.ruleMatches.length})</h4>
                </div>
                <div className="divide-y divide-slate-800">
                  {evaluation.ruleMatches.map((match: any) => (
                    <div key={match.id} className="p-4 bg-slate-900/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-200">{match.rule.name}</p>
                          <p className="text-sm text-slate-400 mt-1">{match.details}</p>
                          <p className="text-xs text-slate-500 mt-2">Polityka: {match.policyVersion.policy.name} (v{match.policyVersion.version})</p>
                        </div>
                        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
                          {match.effectTriggered}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {((evaluation.resultSnapshot as any)?.missingFields as string[])?.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-xl">
                  <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">Braki do uzupełnienia</h4>
                  <ul className="list-disc list-inside text-amber-200/80 space-y-1">
                    {((evaluation.resultSnapshot as any).missingFields as string[]).map(f => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {((evaluation.resultSnapshot as any)?.requiredRoles as string[])?.length > 0 && (
                <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-xl">
                  <h4 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">Wymagane akceptacje ról</h4>
                  <div className="flex flex-wrap gap-2">
                    {((evaluation.resultSnapshot as any).requiredRoles as string[]).map(r => (
                      <span key={r} className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs font-semibold">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {canReview && request.status === 'IN_REVIEW' && (
              <div className="mt-8">
                <ManualOverrideModal requestId={request.id} />
              </div>
            )}
            {!canReview && request.status === 'IN_REVIEW' && (
              <div className="mt-8 pt-6 border-t border-slate-800 text-slate-400 italic">
                Wniosek oczekuje na decyzję Recenzenta.
              </div>
            )}
          </div>
        </div>
      )}

      {request.evaluations.length > 1 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 mb-4">Historia Ocen Systemowych ({request.evaluations.length})</h3>
          <div className="space-y-4">
            {request.evaluations.slice(1).map(ev => (
              <div key={ev.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ev.decision === 'APPROVED' ? 'bg-emerald-500' : ev.decision === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                    <span className="font-semibold text-slate-900">{ev.decision}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{(ev.resultSnapshot as any)?.reason?.split('\n')[0]}</p>
                </div>
                <span className="text-xs text-slate-400">{ev.evaluatedAt.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATTACHMENTS SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Załączniki ({request.attachments.length})</h2>
        </div>
        <div className="p-8 space-y-6">
          {request.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {request.attachments.map(att => (
                <div key={att.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{att.filename}</p>
                      <p className="text-xs text-slate-500 font-medium">{att.type} • {att.uploadedAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                  <a href={att.path} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition">
                    Pobierz
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">Brak załączników.</p>
          )}

          {(request.requesterId === user?.id || ['REVIEWER', 'ADMIN'].includes(user?.role || '')) && (
            <form action={async (formData) => {
              'use server';
              const { uploadAttachment } = await import('../actions');
              await uploadAttachment(request.id, formData);
            }} className="pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Typ Załącznika</label>
                <select name="type" className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900" required>
                  <option value="DPA">Umowa Powierzenia Danych (DPA)</option>
                  <option value="CONTRACT">Projekt Umowy / Kontrakt</option>
                  <option value="SECURITY_QUESTIONNAIRE">Kwestionariusz Bezpieczeństwa</option>
                  <option value="OTHER">Inne (np. specyfikacja techniczna)</option>
                  <option value="APPROVAL_MAIL">Mail z Akceptacją (APPROVAL_MAIL)</option>
                  <option value="VENDOR_ASSESSMENT">Ocena Dostawcy</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Plik (Max 10MB)</label>
                <input type="file" name="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" required />
              </div>
              <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium text-sm hover:bg-slate-700 transition">
                Wgraj plik
              </button>
            </form>
          )}
        </div>
      </div>

      {/* COMMENTS SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Komentarze ({request.comments.length})</h2>
        </div>
        <div className="p-8 space-y-6">
          {request.comments.map(comment => {
            if (comment.isInternal && !['REVIEWER', 'POLICY_OWNER', 'ADMIN', 'AUDITOR'].includes(user?.role || '')) {
              return null; // hide internal comments from requester
            }
            return (
              <div key={comment.id} className={`p-4 rounded-xl border ${comment.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-900">{comment.author.name}</span>
                  <div className="flex items-center gap-3">
                    {comment.isInternal && <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">INTERNAL</span>}
                    <span className="text-xs text-slate-500">{comment.createdAt.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
              </div>
            )
          })}

          <form action={addComment.bind(null, request.id)} className="pt-4 border-t border-slate-100">
            <textarea name="content" required rows={3} placeholder="Dodaj komentarz..." className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none mb-3"></textarea>
            <div className="flex justify-between items-center">
              {['REVIEWER', 'ADMIN'].includes(user?.role || '') ? (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" name="isInternal" value="true" className="w-4 h-4 rounded border-slate-300" />
                  Komentarz wewnętrzny (tylko dla recenzentów)
                </label>
              ) : <div></div>}
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">Wyślij komentarz</button>
            </div>
          </form>
        </div>
      </div>

      {/* AUDIT TRAIL */}
      {['REVIEWER', 'ADMIN', 'AUDITOR', 'POLICY_OWNER'].includes(user?.role || '') && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
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
