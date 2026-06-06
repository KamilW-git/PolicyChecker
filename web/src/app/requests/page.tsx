import { prisma } from '@/lib/prisma'
import Link from 'next/link'

import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function RequestsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string, mine?: string }>
}) {
  const { status, mine } = await searchParams
  const user = await getCurrentUser()
  
  if (!user) return redirect('/login')

  const whereClause: any = status ? { status: status as any } : {}
  
  if (['REQUESTER', 'POLICY_OWNER', 'POLICY_APPROVER'].includes(user.role) || mine === 'true') {
    whereClause.requesterId = user.id
  }
  
  const requests = await prisma.request.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      requester: true
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Wnioski</h1>
          <p className="text-slate-500 mt-2">Zarządzaj wnioskami zakupowymi w organizacji.</p>
        </div>
        <Link 
          href="/requests/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          + Nowy wniosek
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="px-6 py-4 font-medium">Tytuł</th>
                <th className="px-6 py-4 font-medium">Kategoria</th>
                <th className="px-6 py-4 font-medium">Koszt</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Data utworzenia</th>
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
                  <td className="px-6 py-4 text-slate-600">
                    {req.category}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {req.annualCost?.toLocaleString()} {req.currency}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${req.status === 'AUTO_APPROVED' || req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 
                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        req.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-800' : 
                        'bg-slate-100 text-slate-800'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {req.createdAt.toLocaleDateString()}
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Brak wniosków do wyświetlenia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
