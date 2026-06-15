import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { exportAuditCsv } from './actions'
import { auditActionLabel, decisionLabel } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { ClipboardList } from 'lucide-react'

export default async function AuditPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string, page?: string }>
}) {
  const user = await getCurrentUser()
  if (!user || !['AUDITOR', 'ADMIN'].includes(user.role)) {
    redirect('/')
  }

  const awaitedParams = await searchParams;
  const tab = awaitedParams.tab || 'events'
  const page = parseInt(awaitedParams.page || '1', 10)
  const take = 50
  const skip = (page - 1) * take

  let events: any[] = []
  let evaluations: any[] = []
  let totalCount = 0

  if (tab === 'events') {
    events = await prisma.auditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      skip, take,
      include: { user: true }
    })
    totalCount = await prisma.auditEvent.count()
  } else {
    evaluations = await prisma.policyEvaluation.findMany({
      orderBy: { evaluatedAt: 'desc' },
      skip, take,
      include: { request: { include: { requester: true } } }
    })
    totalCount = await prisma.policyEvaluation.count()
  }

  const totalPages = Math.ceil(totalCount / take)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Dziennik audytu"
        description="Historia zdarzeń i automatycznych ocen."
        actions={
          <Link href="/api/audit/export" target="_blank" className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 font-medium transition shadow-sm">
            Eksportuj CSV
          </Link>
        }
      />

      {/* Segmented Control */}
      <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
        <Link href="?tab=events" className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === 'events' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          Zdarzenia Systemowe
        </Link>
        <Link href="?tab=evaluations" className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${tab === 'evaluations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          Oceny Reguł
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'events' ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Użytkownik</th>
                  <th className="px-6 py-4 font-semibold">Akcja</th>
                  <th className="px-6 py-4 font-semibold">Encja</th>
                  <th className="px-6 py-4 font-semibold">Szczegóły</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{ev.createdAt.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{ev.user?.name || 'System'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{auditActionLabel(ev.action)}</td>
                    <td className="px-6 py-4 text-slate-600">{ev.entity} {ev.entityId && <span className="text-xs text-slate-400">({ev.entityId.slice(0,8)}...)</span>}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-sm truncate" title={JSON.stringify(ev.details)}>
                      {(ev.details as any)?.message || JSON.stringify(ev.details)}
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
                      <p className="text-slate-500 font-medium">Brak wpisów w tym okresie</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Wniosek</th>
                  <th className="px-6 py-4 font-semibold text-center">Decyzja</th>
                  <th className="px-6 py-4 font-semibold">Uzasadnienie</th>
                  <th className="px-6 py-4 font-semibold">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluations.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{ev.evaluatedAt.toLocaleString()}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{ev.request.title}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold
                        ${ev.decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : ev.decision === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {decisionLabel(ev.decision)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={(ev.resultSnapshot as any)?.reason}>
                      {(ev.resultSnapshot as any)?.reason}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/requests/${ev.requestId}`} className="text-[var(--color-accent)] hover:opacity-80 font-medium">
                        Szczegóły wniosku
                      </Link>
                    </td>
                  </tr>
                ))}
                {evaluations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" strokeWidth={1.5} />
                      <p className="text-slate-500 font-medium">Brak ocen w tym okresie</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Paginacja */}
        {totalPages > 1 && (
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
            <div className="text-sm text-slate-500">
              Strona <span className="font-semibold text-slate-900">{page}</span> z <span className="font-semibold text-slate-900">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`?tab=${tab}&page=${page - 1}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm hover:bg-slate-50 font-medium">
                  Poprzednia
                </Link>
              )}
              {page < totalPages && (
                <Link href={`?tab=${tab}&page=${page + 1}`} className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm hover:bg-slate-50 font-medium">
                  Następna
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
