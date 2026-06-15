export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { missingFieldLabel } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Zap, CheckCircle2, FileText } from 'lucide-react'

export default async function Home() {
  const user = await getCurrentUser()

  const isRestrictedRole = user && ['REQUESTER'].includes(user.role);
  
  const allRequestsCount = await prisma.request.count()
  
  const pendingReviewCount = await prisma.request.count({
    where: { 
      status: 'IN_REVIEW',
      ...(isRestrictedRole ? { requesterId: user?.id } : {})
    }
  })

  const autoApprovedCount = await prisma.request.count({
    where: { status: 'AUTO_APPROVED', ...(isRestrictedRole ? { requesterId: user?.id } : {}) }
  })

  const needsInfoCount = await prisma.request.count({
    where: { status: 'NEEDS_INFORMATION', ...(isRestrictedRole ? { requesterId: user?.id } : {}) }
  })

  const rejectedCount = await prisma.request.count({
    where: { status: 'REJECTED', ...(isRestrictedRole ? { requesterId: user?.id } : {}) }
  })

  const activePoliciesCount = await prisma.policy.count({
    where: { status: 'PUBLISHED' }
  })

  // Średni czas do decyzji (w godzinach)
  const finalRequests = await prisma.request.findMany({
    where: {
      status: { in: ['AUTO_APPROVED', 'APPROVED', 'REJECTED'] },
      ...(isRestrictedRole ? { requesterId: user?.id } : {})
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
    where: isRestrictedRole ? { request: { requesterId: user?.id } } : {},
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

  // NOWE: Zapytania z akcjami do podjęcia
  const needsAttentionRequests = ['REVIEWER', 'ADMIN', 'POLICY_OWNER', 'AUDITOR'].includes(user?.role || '')
    ? await prisma.request.findMany({
        where: { status: 'IN_REVIEW' },
        orderBy: { updatedAt: 'asc' },
        take: 5,
        select: { id: true, title: true, vendorName: true, status: true, updatedAt: true }
      })
    : [];

  const myOpenRequests = user?.role === 'REQUESTER'
    ? await prisma.request.findMany({
        where: { requesterId: user?.id, status: { in: ['IN_REVIEW', 'NEEDS_INFORMATION', 'DRAFT'] } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, vendorName: true, status: true, updatedAt: true }
      })
    : [];

  let subtitle = "Witaj! Przeglądaj metryki i statusy systemu decyzyjnego."
  if (user?.role === 'REQUESTER') subtitle = "Witaj! Śledź statusy swoich wniosków i uzupełniaj braki."
  if (user?.role === 'REVIEWER' || user?.role === 'ADMIN') subtitle = "Witaj! Przeglądaj i decyduj o wnioskach oczekujących w kolejce."
  if (user?.role === 'POLICY_OWNER') subtitle = "Witaj! Analizuj skuteczność polityk biznesowych."
  if (user?.role === 'AUDITOR') subtitle = "Witaj! Monitoruj przepływ decyzji w systemie."

  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title={`Dzień dobry, ${user?.name?.split(' ')[0] || 'Użytkowniku'}`}
        description={subtitle}
      />

      {/* PRIORYTETOWE AKCJE */}
      {needsAttentionRequests.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap size={20} strokeWidth={1.5} className="text-amber-500" /> Wymaga uwagi (Najstarsze w recenzji)
            </h2>
            <Link href="/requests" className="text-sm font-medium text-[var(--color-accent)] hover:opacity-80">
              Zobacz wszystkie &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {needsAttentionRequests.map(req => (
              <div key={req.id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{req.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{req.vendorName} • {req.updatedAt.toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={req.status} size="sm" />
                  <Link href={`/requests/${req.id}`} className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm text-sm font-medium rounded hover:bg-slate-50">
                    Otwórz
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Jeśli jesteś REVIEWER/ADMIN i kolejka jest pusta */}
      {needsAttentionRequests.length === 0 && ['REVIEWER', 'ADMIN'].includes(user?.role || '') && (
        <Card className="p-8 flex flex-col items-center justify-center text-center bg-slate-50 border-dashed">
          <CheckCircle2 size={40} strokeWidth={1.5} className="text-emerald-500 mb-3" />
          <h3 className="font-bold text-slate-900 text-lg">Kolejka jest pusta!</h3>
          <p className="text-slate-500 text-sm mt-1">Brak wniosków oczekujących w tym momencie na recenzję.</p>
          <Link href="/requests" className="mt-4 px-4 py-2 bg-white border border-slate-200 shadow-sm text-sm font-medium rounded-lg hover:bg-slate-50">
            Przejdź do listy wszystkich wniosków
          </Link>
        </Card>
      )}

      {/* AKCJE WNIOSKODAWCY */}
      {myOpenRequests.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Twoje otwarte wnioski
            </h2>
            <Link href="/requests" className="text-sm font-medium text-[var(--color-accent)] hover:opacity-80">
              Zobacz wszystkie &rarr;
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {myOpenRequests.map(req => (
              <div key={req.id} className="p-4 bg-white flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{req.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{req.vendorName} • {req.updatedAt.toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={req.status} size="sm" />
                  {req.status === 'NEEDS_INFORMATION' ? (
                    <Link href={`/requests/${req.id}/edit`} className="px-3 py-1.5 bg-amber-600 text-white shadow-sm text-sm font-medium rounded hover:bg-amber-700">
                      Uzupełnij
                    </Link>
                  ) : (
                    <Link href={`/requests/${req.id}`} className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm text-sm font-medium rounded hover:bg-slate-50">
                      Szczegóły
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {myOpenRequests.length === 0 && user?.role === 'REQUESTER' && (
        <Card className="p-8 flex flex-col items-center justify-center text-center bg-slate-50 border-dashed">
          <FileText size={40} strokeWidth={1.5} className="text-slate-400 mb-3" />
          <h3 className="font-bold text-slate-900 text-lg">Brak aktywnych wniosków</h3>
          <p className="text-slate-500 text-sm mt-1">Nie masz obecnie żadnych otwartych wniosków do przetworzenia.</p>
          <Link href="/requests/new" className="mt-4 px-4 py-2 bg-[var(--color-accent)] text-white shadow-sm text-sm font-medium rounded-lg hover:opacity-90">
            Złóż nowy wniosek
          </Link>
        </Card>
      )}

      {/* METRYKI PODSTAWOWE (Tylko 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-medium text-slate-500 mb-1">Oczekujące na Ocenę</h3>
          <p className="text-3xl font-semibold text-slate-900">{pendingReviewCount}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-medium text-slate-500 mb-1">Zatwierdzone Auto</h3>
          <p className="text-3xl font-semibold text-slate-900">{autoApprovedCount}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-medium text-slate-500 mb-1">Do Uzupełnienia</h3>
          <p className="text-3xl font-semibold text-slate-900">{needsInfoCount}</p>
        </Card>
      </div>

      {/* ZWIJANE SZCZEGÓŁOWE METRYKI */}
      <details className="group [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-800 transition py-2 outline-none">
          <svg className="w-5 h-5 transition group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Pokaż więcej statystyk
        </summary>
        
        <div className="pt-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <h3 className="font-medium text-slate-500 mb-1">Odrzucone</h3>
              <p className="text-3xl font-semibold text-slate-900">{rejectedCount}</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium text-slate-500 mb-1">Wszystkie Wnioski</h3>
              <p className="text-3xl font-semibold text-slate-900">{allRequestsCount}</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-medium text-slate-500 mb-1">Aktywne Polityki</h3>
              <p className="text-3xl font-semibold text-slate-900">{activePoliciesCount}</p>
            </Card>
            <Card className="p-6 sm:col-span-3">
              <h3 className="font-medium text-slate-500 mb-1">Średni Czas Decyzji</h3>
              <p className="text-3xl font-semibold text-slate-900">
                {avgTimeHours > 0 ? `${avgTimeHours.toFixed(1)} godz.` : 'Brak danych'}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-4">Najczęstsze Reguły (Top 5)</h3>
              {topRules.length > 0 ? (
                <ul className="space-y-3">
                  {topRules.map((rule, idx) => (
                    <li key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                      <span className="font-medium text-slate-700 truncate mr-4">{rule.name}</span>
                      <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded">
                        {rule.count} dopasowań
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Brak danych.</p>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-4">Najczęstsze Braki w Danych (Top 5)</h3>
              {topMissingFields.length > 0 ? (
                <ul className="space-y-3">
                  {topMissingFields.map(([field, count], idx) => (
                    <li key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                      <span className="font-mono text-sm text-slate-700 truncate mr-4">{missingFieldLabel(field)}</span>
                      <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded">
                        {count} razy
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Brak danych.</p>
              )}
            </Card>
          </div>
        </div>
      </details>
    </div>
  )
}
