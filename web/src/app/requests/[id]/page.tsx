import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, FileText, Shield, Zap, Check, X } from 'lucide-react'
import { getCurrentUser } from '@/lib/session'
import ManualOverrideModal from './ManualOverrideModal'
import { addComment, submitDraftRequest } from '../actions'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Card } from '@/components/ui/Card'
import RequestDetailTabs from './RequestDetailTabs'
import CommentForm from './CommentForm'
import UploadForm from './UploadForm'
import { requestStatusLabel, missingFieldLabel, roleLabel, decisionLabel, urgencyLabel, vendorRiskLabel, categoryLabel, departmentLabel, effectTriggeredLabel } from '@/lib/labels'

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
    <div className="max-w-4xl mx-auto space-y-6 relative pb-24">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-20 bg-[#F5F5F7]/90 backdrop-blur-md pt-4 pb-4 mb-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <Link href="/requests" className="text-slate-500 hover:text-slate-800 transition text-sm font-medium">
            &larr; Wnioski / {request.title.length > 30 ? request.title.substring(0, 30) + '...' : request.title}
          </Link>
          <div className="flex gap-3 items-center">
            <StatusBadge status={request.status} size="md" />
            {request.status === 'DRAFT' && request.requesterId === user?.id && (
              <>
                <Link href={`/requests/${request.id}/edit`} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition text-sm shadow-sm">
                  Edytuj Szkic
                </Link>
                <form action={submitDraftRequest.bind(null, request.id)}>
                  <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 font-medium transition text-sm shadow-sm">
                    Przekaż do oceny
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NEEDS INFORMATION BANNER */}
      {request.status === 'NEEDS_INFORMATION' && request.requesterId === user?.id && evaluation && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} strokeWidth={1.5} className="text-amber-500 mt-1" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Wymagane Uzupełnienie Informacji</h3>
              <p className="text-amber-800 mt-1">Twój wniosek został zablokowany, ponieważ brakuje wymaganych informacji lub dokumentów.</p>
              {((evaluation.resultSnapshot as any)?.missingFields as string[])?.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <span className="text-sm font-medium text-amber-900">Braki:</span>
                  <div className="flex flex-wrap gap-2">
                    {((evaluation.resultSnapshot as any)?.missingFields as string[]).map(field => (
                      <span key={field} className="px-2 py-1 bg-amber-200 text-amber-900 text-xs font-bold rounded-md">
                        {missingFieldLabel(field)}
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

      {/* TABS COMPONENT */}
      <RequestDetailTabs 
        overview={
          <Card className="overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{request.title}</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Wniosek utworzony {request.createdAt.toLocaleDateString()} przez {request.requester.name}
                </p>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informacje Ogólne</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm text-slate-500">Kategoria</dt>
                    <dd className="font-medium text-slate-900">{categoryLabel(request.category)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Typ</dt>
                    <dd className="font-medium text-slate-900">{request.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Dział</dt>
                    <dd className="font-medium text-slate-900">{departmentLabel(request.department)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Pilność (Urgency)</dt>
                    <dd className={`font-medium ${request.urgency === 'EMERGENCY' ? 'text-red-600' : 'text-slate-900'}`}>{urgencyLabel(request.urgency)}</dd>
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
                    <dd className={`font-medium ${request.vendorRisk === 'CRITICAL' || request.vendorRisk === 'HIGH' ? 'text-red-600' : 'text-slate-900'}`}>{vendorRiskLabel(request.vendorRisk)}</dd>
                  </div>
                </dl>
              </div>

              <div className="col-span-1 md:col-span-2 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Bezpieczeństwo i RODO</h3>
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${request.processesPersonalData ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {request.processesPersonalData ? <AlertTriangle size={16} strokeWidth={2} /> : <Check size={16} strokeWidth={2} />}
                    </span>
                    <span className="text-sm font-medium text-slate-700">Przetwarza dane osobowe: {request.processesPersonalData ? 'TAK' : 'NIE'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${request.hasDpa ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {request.hasDpa ? <Check size={16} strokeWidth={2} /> : <AlertTriangle size={16} strokeWidth={2} />}
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
          </Card>
        }
        decision={
          <div className="space-y-6">
            {evaluation && (
              <Card className="overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                    <Zap size={20} strokeWidth={1.5} className="text-[var(--color-accent)]" /> Ocena polityk
                  </h2>
                  <span className="text-sm text-slate-500">Decyzja Systemu ({evaluation.evaluatedAt.toLocaleString()})</span>
                </div>
                <div className="p-8">
                  <div className="flex items-start gap-4 mb-8">
                    <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                      evaluation.decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      evaluation.decision === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {evaluation.decision === 'APPROVED' ? <Check size={16} strokeWidth={2} /> : evaluation.decision === 'REJECTED' ? <X size={16} strokeWidth={2} /> : <AlertTriangle size={16} strokeWidth={2} />}
                    </span>
                    <div>
                      <h3 className="font-bold text-xl mb-1 text-slate-900">
                        {decisionLabel(evaluation.decision)}
                      </h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {(evaluation.resultSnapshot as any)?.reason || 'Decyzja podjęta na podstawie wbudowanych reguł.'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Złamane reguły / Użyte zasady */}
                  {evaluation.ruleMatches && evaluation.ruleMatches.length > 0 && (
                    <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h4 className="font-semibold text-slate-700">Zastosowane Reguły ({evaluation.ruleMatches.length})</h4>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {evaluation.ruleMatches.map((match: any) => (
                          <div key={match.id} className="p-4 bg-white">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-slate-900">{match.rule.name}</p>
                                <p className="text-sm text-slate-500 mt-1">{match.details}</p>
                                <p className="text-xs text-slate-400 mt-2">Polityka: {match.policyVersion.policy.name} (v{match.policyVersion.version})</p>
                              </div>
                              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                {effectTriggeredLabel(match.effectTriggered)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {((evaluation.resultSnapshot as any)?.nextSteps as string[])?.length > 0 && (
                    <div className="mt-6 bg-slate-50 border border-slate-200 p-5 rounded-xl shadow-sm">
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Następne kroki</h4>
                      <ol className="list-decimal list-inside space-y-2 text-slate-700">
                        {((evaluation.resultSnapshot as any).nextSteps as string[]).map((step: string, idx: number) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {((evaluation.appliedPolicyVersions as any[])?.length > 0) && (
                    <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h4 className="font-semibold text-slate-700">Zastosowane polityki</h4>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {(evaluation.appliedPolicyVersions as { policyName: string; version: number; policyId: string }[]).map((pv) => (
                          <div key={`${pv.policyId}-${pv.version}`} className="p-4 bg-white flex justify-between items-center">
                            <span className="font-medium text-slate-900">{pv.policyName}</span>
                            <span className="text-xs text-slate-500">wersja {pv.version}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {((evaluation.resultSnapshot as any)?.missingFields as string[])?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
                        <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2">Braki do uzupełnienia</h4>
                        <ul className="list-disc list-inside text-amber-800 space-y-1">
                          {((evaluation.resultSnapshot as any).missingFields as string[]).map(f => (
                            <li key={f}>{missingFieldLabel(f)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {((evaluation.resultSnapshot as any)?.requiredRoles as string[])?.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
                        <h4 className="text-sm font-bold text-[var(--color-accent)] uppercase tracking-wider mb-2">Wymagane akceptacje ról</h4>
                        <div className="flex flex-wrap gap-2">
                          {((evaluation.resultSnapshot as any).requiredRoles as string[]).map(r => (
                            <span key={r} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {roleLabel(r)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {canReview && request.status === 'IN_REVIEW' && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <ManualOverrideModal requestId={request.id} />
                    </div>
                  )}
                  {!canReview && request.status === 'IN_REVIEW' && (
                    <div className="mt-8 pt-6 border-t border-slate-100 text-slate-500 italic">
                      Wniosek oczekuje na decyzję Recenzenta.
                    </div>
                  )}
                </div>
              </Card>
            )}

            {overrides.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Historia Decyzji Manualnych</h2>
                {overrides.map((ov) => (
                  <Card key={ov.id} className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-400">Decyzja ręczna</span>
                        <h3 className={`font-bold mt-1 ${
                          ov.overrideDecision.includes('APPROVED') ? 'text-emerald-600' : 
                          ov.overrideDecision.includes('REJECTED') ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {decisionLabel(ov.overrideDecision)}
                        </h3>
                        <div className="text-sm mt-1">
                          <span className="text-slate-500">Decyzja systemu:</span> <span className="font-medium text-slate-700">{ov.originalDecision ? decisionLabel(ov.originalDecision) : 'Brak'}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span className="text-slate-500">Status po decyzji:</span> <span className="font-medium text-slate-900">{ov.overrideStatus}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {ov.createdAt.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Recenzent</p>
                        <p className="text-sm font-medium text-slate-900">{ov.createdBy.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Zatwierdził</p>
                        <p className="text-sm font-medium text-slate-900">{ov.approvedBy}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 mb-0.5">Powód</p>
                        <p className="text-sm text-slate-700">{ov.reason}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500 mb-0.5">Komentarz</p>
                        <p className="text-sm text-slate-700">{ov.comment}</p>
                      </div>
                      {ov.attachmentPath && (
                        <div className="col-span-2 mt-2">
                          <a href={ov.attachmentPath} target="_blank" className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition">
                            <FileText size={16} strokeWidth={1.5} className="text-slate-500" /> Pobierz załącznik
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {request.evaluations.length > 1 && (
              <Card className="p-6 bg-slate-50">
                <h3 className="font-bold text-slate-900 mb-4">Historia Ocen Systemowych ({request.evaluations.length})</h3>
                <div className="space-y-4">
                  {request.evaluations.slice(1).map(ev => (
                    <div key={ev.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ev.decision === 'APPROVED' ? 'bg-emerald-500' : ev.decision === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                          <span className="font-semibold text-slate-900">{decisionLabel(ev.decision)}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{(ev.resultSnapshot as any)?.reason?.split('\n')[0]}</p>
                      </div>
                      <span className="text-xs text-slate-400">{ev.evaluatedAt.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        }
        attachments={
          <Card className="overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Załączniki ({request.attachments.length})</h2>
            </div>
            <div className="p-8 space-y-6">
              {request.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {request.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <FileText size={24} strokeWidth={1.5} className="text-slate-400" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{att.filename}</p>
                        <p className="text-xs text-slate-500 font-medium">{att.type} • {att.uploadedAt.toLocaleDateString()}</p>
                      </div>
                      <a href={`/api/attachments/${att.id}`} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition">
                        Pobierz
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">Brak załączników.</p>
              )}

              {(request.requesterId === user?.id || ['REVIEWER', 'ADMIN'].includes(user?.role || '')) && (
                <UploadForm requestId={request.id} />
              )}
            </div>
          </Card>
        }
        comments={
          <Card className="overflow-hidden">
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
                        {comment.isInternal && <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">WEWNĘTRZNY</span>}
                        <span className="text-xs text-slate-500">{comment.createdAt.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                )
              })}

              <CommentForm 
                requestId={request.id} 
                showInternalOption={['REVIEWER', 'ADMIN'].includes(user?.role || '')} 
              />
            </div>
          </Card>
        }
        history={
          ['REVIEWER', 'ADMIN', 'AUDITOR', 'POLICY_OWNER'].includes(user?.role || '') ? (
            <Card className="overflow-hidden bg-white">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Shield size={20} strokeWidth={1.5} className="text-slate-500" /> Ślad Rewizyjny (Audit Trail)
                </h2>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
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
            </Card>
          ) : undefined
        }
      />
    </div>
  )
}
