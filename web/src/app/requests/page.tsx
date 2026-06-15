import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { requestStatusLabel, decisionLabel, roleLabel, urgencyLabel } from '@/lib/labels'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Suspense } from 'react'
import RequestsTableSkeleton from './RequestsTableSkeleton'
import RequestsTableServer from './RequestsTableServer'

const OVERDUE_DAYS = 7

function buildFilterQuery(params: Record<string, string | undefined>) {
  const parts = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
  return parts.length ? `&${parts.join('&')}` : ''
}

export default async function RequestsPage({
  searchParams
}: {
  searchParams: Promise<{
    status?: string
    mine?: string
    decision?: string
    category?: string
    department?: string
    urgency?: string
    vendor?: string
    overdue?: string
    needs_information?: string
    page?: string
    pageSize?: string
  }>
}) {
  const params = await searchParams
  const {
    status: statusParam,
    mine,
    decision,
    category,
    department,
    urgency,
    vendor,
    overdue,
    needs_information,
    page,
    pageSize,
  } = params

  const user = await getCurrentUser()
  if (!user) return redirect('/login')

  const isReviewer = user.role === 'REVIEWER'
  const status = statusParam || (isReviewer && !mine ? 'IN_REVIEW' : undefined)

  const whereClause: Record<string, unknown> = {}

  if (needs_information === 'true') {
    whereClause.status = 'NEEDS_INFORMATION'
  } else if (status) {
    whereClause.status = status
  }

  if (decision) whereClause.decision = decision
  if (category) whereClause.category = category
  if (department) whereClause.department = department
  if (urgency) whereClause.urgency = urgency
  if (vendor) {
    whereClause.vendorName = { contains: vendor, mode: 'insensitive' }
  }

  if (overdue === 'true') {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - OVERDUE_DAYS)
    whereClause.status = 'IN_REVIEW'
    whereClause.updatedAt = { lt: cutoff }
  }

  const isRestrictedRole = ['REQUESTER'].includes(user.role)

  if (isRestrictedRole || mine === 'true') {
    whereClause.requesterId = user.id
  }

  const currentPage = parseInt(page || '1')
  const take = parseInt(pageSize || '20')

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Wnioski"
        description={isRestrictedRole ? 'Przeglądaj swoje wnioski zakupowe.' : 'Zarządzaj wnioskami zakupowymi w organizacji.'}
        actions={
          user.role !== 'AUDITOR' && (
            <Link
              href="/requests/new"
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:opacity-90 transition shadow-sm"
            >
              + Nowy wniosek
            </Link>
          )
        }
      />
      {isReviewer && !statusParam && !mine && (
        <p className="text-xs text-amber-600 -mt-4 mb-2">Domyślnie pokazujemy wnioski w recenzji</p>
      )}

      {/* Segmented Control */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { label: 'Wszystkie', value: '' },
          { label: 'W recenzji', value: 'IN_REVIEW' },
          { label: 'Braki', value: 'NEEDS_INFORMATION' },
          { label: 'Szkice', value: 'DRAFT' }
        ].map(tab => {
          const isActive = (statusParam || '') === tab.value
          return (
            <Link
              key={tab.label}
              href={`/requests?status=${tab.value}`}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <details className="group">
        <summary className="text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-700 transition list-none flex items-center gap-2 mb-2">
          <span>Więcej filtrów</span>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <Card className="p-4">
          <form className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select name="status" defaultValue={statusParam || ''} className="w-full text-sm rounded border border-slate-300 px-3 py-2 bg-slate-50 text-slate-900">
              <option value="">Wszystkie</option>
              <option value="DRAFT">Szkice</option>
              <option value="SUBMITTED">Złożone</option>
              <option value="IN_REVIEW">W recenzji</option>
              <option value="NEEDS_INFORMATION">Braki</option>
              <option value="APPROVED">Zatwierdzone</option>
              <option value="AUTO_APPROVED">Automatyczne Zatwierdzenie</option>
              <option value="REJECTED">Odrzucone</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Decyzja Silnika</label>
            <select name="decision" defaultValue={decision || ''} className="w-full text-sm rounded border border-slate-300 px-3 py-2 bg-slate-50 text-slate-900">
              <option value="">Wszystkie</option>
              <option value="APPROVED">{decisionLabel('APPROVED')}</option>
              <option value="REQUIRES_REVIEW">{decisionLabel('REQUIRES_REVIEW')}</option>
              <option value="MISSING_INFORMATION">{decisionLabel('MISSING_INFORMATION')}</option>
              <option value="REJECTED">{decisionLabel('REJECTED')}</option>
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Pilność</label>
            <select name="urgency" defaultValue={urgency || ''} className="w-full text-sm rounded border border-slate-300 px-3 py-2 bg-slate-50 text-slate-900">
              <option value="">Wszystkie</option>
              <option value="NORMAL">Normalna</option>
              <option value="HIGH">Wysoka</option>
              <option value="EMERGENCY">Awaryjna</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Kategoria</label>
            <select name="category" defaultValue={category || ''} className="w-full text-sm rounded border border-slate-300 px-3 py-2 bg-slate-50 text-slate-900">
              <option value="">Wszystkie</option>
              <option value="SAAS">SAAS</option>
              <option value="HARDWARE">Sprzęt</option>
              <option value="CONSULTING">Doradztwo</option>
              <option value="MARKETING_SERVICE">Marketing</option>
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Dział</label>
            <select name="department" defaultValue={department || ''} className="w-full text-sm rounded border border-slate-300 px-3 py-2 bg-slate-50 text-slate-900">
              <option value="">Wszystkie</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="FINANCE">Finanse</option>
              <option value="PROCUREMENT">Zakupy</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Dostawca</label>
            <input
              type="text"
              name="vendor"
              defaultValue={vendor || ''}
              placeholder="Szukaj po nazwie..."
              className="w-full text-sm rounded border border-slate-300 px-3 py-2 bg-slate-50 text-slate-900"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="overdue" value="true" defaultChecked={overdue === 'true'} className="rounded border-slate-300" />
              Przeterminowane (&gt;{OVERDUE_DAYS} dni)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="needs_information" value="true" defaultChecked={needs_information === 'true'} className="rounded border-slate-300" />
              Wymaga uzupełnienia
            </label>
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-slate-700 transition">
            Filtruj
          </button>
          <Link href="/requests" className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded hover:bg-slate-200 transition">
            Reset
          </Link>
        </form>
        </Card>
      </details>

      <Suspense key={JSON.stringify(params)} fallback={<RequestsTableSkeleton />}>
        <RequestsTableServer params={params as any} user={user} />
      </Suspense>
    </div>
  )
}
