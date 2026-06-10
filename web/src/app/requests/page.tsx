import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'

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
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Wnioski</h1>
          <p className="text-slate-500 mt-2">
            {isRestrictedRole
              ? 'Przeglądaj swoje wnioski zakupowe.'
              : 'Zarządzaj wnioskami zakupowymi w organizacji.'}
          </p>
          {isReviewer && !statusParam && !mine && (
            <p className="text-xs text-amber-400 mt-1">Domyślnie: wnioski w recenzji (IN_REVIEW)</p>
          )}
        </div>
        {user.role !== 'AUDITOR' && (
          <Link
            href="/requests/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
          >
            + Nowy wniosek
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
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
              <option value="APPROVED">APPROVED</option>
              <option value="REQUIRES_REVIEW">REQUIRES_REVIEW</option>
              <option value="MISSING_INFORMATION">MISSING_INFORMATION</option>
              <option value="REJECTED">REJECTED</option>
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
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-medium">Tytuł</th>
                <th className="px-6 py-4 font-medium">Kategoria</th>
                <th className="px-6 py-4 font-medium">Pilność</th>
                <th className="px-6 py-4 font-medium">Koszt</th>
                <th className="px-6 py-4 font-medium">Status</th>
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
                  <td className="px-6 py-4 text-slate-600">{req.category}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${req.urgency === 'EMERGENCY' ? 'text-red-600' : req.urgency === 'HIGH' ? 'text-amber-600' : 'text-slate-600'}`}>
                      {req.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {req.annualCost?.toLocaleString()} {req.currency}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${req.status === 'AUTO_APPROVED' || req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        req.status === 'IN_REVIEW' || req.status === 'NEEDS_INFORMATION' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {req.decision} <br />
                    <span className="text-xs text-slate-400">
                      {req.evaluations[0]?.evaluatedAt.toLocaleDateString() || req.createdAt.toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {req.evaluations[0] && ((req.evaluations[0].resultSnapshot as { requiredRoles?: string[] })?.requiredRoles)?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {((req.evaluations[0].resultSnapshot as { requiredRoles: string[] }).requiredRoles).map((role, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/requests/${req.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
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
      </div>
    </div>
  )
}
