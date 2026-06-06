import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AuditPage() {
  const user = await getCurrentUser()
  if (!user || !['AUDITOR', 'ADMIN'].includes(user.role)) {
    redirect('/')
  }

  const evaluations = await prisma.policyEvaluation.findMany({
    orderBy: { evaluatedAt: 'desc' },
    include: {
      request: {
        include: { requester: true }
      }
    }
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dziennik Audytu</h1>
        <p className="text-slate-500 mt-2">Pełna historia automatycznych decyzji podjętych przez PolicyChecker AI.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <th className="px-6 py-4 font-semibold">Data</th>
              <th className="px-6 py-4 font-semibold">Wniosek</th>
              <th className="px-6 py-4 font-semibold">Wnioskodawca</th>
              <th className="px-6 py-4 font-semibold">Decyzja Systemu</th>
              <th className="px-6 py-4 font-semibold">Uzasadnienie (Result Snapshot)</th>
              <th className="px-6 py-4 font-semibold">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {evaluations.map(ev => (
              <tr key={ev.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-slate-500">{ev.evaluatedAt.toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{ev.request.title}</td>
                <td className="px-6 py-4 text-slate-600">{ev.request.requester.name}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold
                    ${ev.decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {ev.decision}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={(ev.resultSnapshot as any)?.reason}>
                  {(ev.resultSnapshot as any)?.reason}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/requests/${ev.requestId}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    Szczegóły
                  </Link>
                </td>
              </tr>
            ))}
            {evaluations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Brak logów audytu.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
