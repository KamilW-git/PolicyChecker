export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export default async function Home() {
  const user = await getCurrentUser()

  const isRestrictedRole = user && ['REQUESTER'].includes(user.role);
  
  const allRequestsCount = await prisma.request.count()
  
  const pendingReviewCount = await prisma.request.count({
    where: { 
      status: 'IN_REVIEW',
      ...(isRestrictedRole ? { requesterId: user.id } : {})
    }
  })

  const autoApprovedCount = await prisma.request.count({
    where: { status: 'AUTO_APPROVED', ...(isRestrictedRole ? { requesterId: user.id } : {}) }
  })

  const needsInfoCount = await prisma.request.count({
    where: { status: 'NEEDS_INFORMATION', ...(isRestrictedRole ? { requesterId: user.id } : {}) }
  })

  const rejectedCount = await prisma.request.count({
    where: { status: 'REJECTED', ...(isRestrictedRole ? { requesterId: user.id } : {}) }
  })

  const activePoliciesCount = await prisma.policy.count({
    where: { status: 'PUBLISHED' }
  })

  // Średni czas do decyzji (w godzinach)
  const finalRequests = await prisma.request.findMany({
    where: {
      status: { in: ['AUTO_APPROVED', 'APPROVED', 'REJECTED'] },
      ...(isRestrictedRole ? { requesterId: user.id } : {})
    },
    select: { createdAt: true, updatedAt: true }
  })

  let avgTimeHours = 0
  if (finalRequests.length > 0) {
    const totalMs = finalRequests.reduce((acc, req) => acc + (req.updatedAt.getTime() - req.createdAt.getTime()), 0)
    avgTimeHours = (totalMs / finalRequests.length) / (1000 * 60 * 60)
  }

  // Top missing fields
  const evaluations = await prisma.policyEvaluation.findMany({
    where: isRestrictedRole ? { request: { requesterId: user.id } } : {},
    select: { resultSnapshot: true }
  })
  
  const missingFieldsCount: Record<string, number> = {}
  evaluations.forEach(ev => {
    const fields = (ev.resultSnapshot as any)?.missingFields as string[] || []
    fields.forEach(f => {
      missingFieldsCount[f] = (missingFieldsCount[f] || 0) + 1
    })
  })
  const topMissingFields = Object.entries(missingFieldsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Najczęstsze reguły
  const ruleMatches = await prisma.policyEvaluationRuleMatch.groupBy({
    by: ['ruleId'],
    _count: { ruleId: true },
    orderBy: { _count: { ruleId: 'desc' } },
    take: 5
  })
  
  const rules = await prisma.rule.findMany({
    where: { id: { in: ruleMatches.map(r => r.ruleId) } },
    select: { id: true, name: true }
  })
  const rulesMap = new Map(rules.map(r => [r.id, r.name]))
  const topRules = ruleMatches.map(r => ({ name: rulesMap.get(r.ruleId) || 'Nieznana reguła', count: r._count.ruleId }))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Pulpit Operacyjny</h1>
        <p className="text-slate-500 mt-2">Przegląd metryk i statusów systemu decyzyjnego.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Oczekujące na Ocenę</h3>
            <p className="text-4xl font-bold text-amber-500">{pendingReviewCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Zatwierdzone Auto</h3>
            <p className="text-4xl font-bold text-emerald-500">{autoApprovedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Do Uzupełnienia</h3>
            <p className="text-4xl font-bold text-orange-500">{needsInfoCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Odrzucone</h3>
            <p className="text-4xl font-bold text-red-500">{rejectedCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Wszystkie Wnioski</h3>
            <p className="text-4xl font-bold text-blue-600">{allRequestsCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Aktywne Polityki</h3>
            <p className="text-4xl font-bold text-indigo-500">{activePoliciesCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full sm:col-span-2">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Średni Czas Decyzji</h3>
            <p className="text-4xl font-bold text-slate-700">
              {avgTimeHours > 0 ? `${avgTimeHours.toFixed(1)} godz.` : 'Brak danych'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4">Najczęstsze Reguły (Top 5)</h3>
          {topRules.length > 0 ? (
            <ul className="space-y-3">
              {topRules.map((rule, idx) => (
                <li key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="font-medium text-slate-700 truncate mr-4">{rule.name}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                    {rule.count} dopasowań
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Brak danych.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4">Najczęstsze Braki w Danych (Top 5)</h3>
          {topMissingFields.length > 0 ? (
            <ul className="space-y-3">
              {topMissingFields.map(([field, count], idx) => (
                <li key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="font-mono text-sm text-slate-700 truncate mr-4">{field}</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded">
                    {count} razy
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Brak danych.</p>
          )}
        </div>
      </div>
    </div>
  )
}
