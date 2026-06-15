import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { requestStatusLabel, decisionLabel, roleLabel, urgencyLabel, categoryLabel } from '@/lib/labels'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'

const OVERDUE_DAYS = 7

function buildFilterQuery(params: Record<string, string | undefined>) {
  const parts = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
  return parts.length ? `&${parts.join('&')}` : ''
}

export default async function RequestsTableServer({
  params,
  user
}: {
  params: {
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
  },
  user: any
}) {
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
  const skip = (currentPage - 1) * take

  const [requests, totalCount] = await Promise.all([
    prisma.request.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        requester: true,
        evaluations: {
          orderBy: { evaluatedAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.request.count({ where: whereClause }),
  ])

  const totalPages = Math.ceil(totalCount / take)

  const filterQuery = buildFilterQuery({
    status: statusParam,
    decision,
    category,
    department,
    urgency,
    vendor,
    overdue,
    needs_information,
    mine,
    pageSize: String(take),
  })

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4 font-medium">Tytuł</th>
              <th className="px-6 py-4 font-medium">Kategoria</th>
              <th className="px-6 py-4 font-medium">Pilność</th>
              <th className="px-6 py-4 font-medium">Koszt</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium">Ostatnia Decyzja</th>
              <th className="px-6 py-4 font-medium">Wymagana Rola</th>
              <th className="px-6 py-4 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{req.title}</p>
                  <p className="text-sm text-slate-500">{req.vendorName}</p>
                </td>
                <td className="px-6 py-4 text-slate-600">{categoryLabel(req.category)}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${req.urgency === 'EMERGENCY' ? 'text-red-600' : req.urgency === 'HIGH' ? 'text-amber-600' : 'text-slate-600'}`}>
                    {urgencyLabel(req.urgency)}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">
                  {req.annualCost?.toLocaleString()} {req.currency}
                </td>
                <td className="px-6 py-4 text-center">
                  <StatusBadge status={req.status} size="sm" />
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  {decisionLabel(req.decision)} <br />
                  <span className="text-xs text-slate-400">
                    {req.evaluations[0]?.evaluatedAt.toLocaleDateString() || req.createdAt.toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 text-sm">
                  {req.evaluations[0] && ((req.evaluations[0].resultSnapshot as { requiredRoles?: string[] })?.requiredRoles)?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {((req.evaluations[0].resultSnapshot as { requiredRoles: string[] }).requiredRoles).map((role, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {roleLabel(role)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/requests/${req.id}`} className="text-[var(--color-accent)] hover:opacity-80 font-medium text-sm">
                    Szczegóły
                  </Link>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  Brak wniosków do wyświetlenia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Strona {currentPage} z {totalPages} ({totalCount} rekordów)
          </span>
          <div className="flex gap-2">
            <Link
              href={`/requests?page=${Math.max(1, currentPage - 1)}${filterQuery}`}
              className={`px-3 py-1 text-sm rounded border border-slate-300 bg-white ${currentPage === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50'}`}
            >
              Poprzednia
            </Link>
            <Link
              href={`/requests?page=${Math.min(totalPages, currentPage + 1)}${filterQuery}`}
              className={`px-3 py-1 text-sm rounded border border-slate-300 bg-white ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50'}`}
            >
              Następna
            </Link>
          </div>
        </div>
      )}
    </Card>
  )
}
