import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function PolicyDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        include: {
          rules: true
        }
      }
    }
  })

  if (!policy) return notFound()

  // For MVP, we just take the latest version
  const latestVersion = policy.versions[0]
  const activeRules = latestVersion?.rules || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/policies" className="text-slate-500 hover:text-slate-800 transition">
          &larr; Wróć do listy polityk
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{policy.domain}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{policy.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{policy.description}</p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
            ${policy.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
            {policy.status}
          </span>
        </div>

        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900">Aktualna Wersja (v{latestVersion?.version || 1})</h3>
            <p className="text-sm text-slate-500 mt-1">Reguły zdefiniowane w tej wersji będą używane do automatycznej oceny wniosków.</p>
          </div>
          <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition opacity-50 cursor-not-allowed">
            Edytuj Wersję
          </button>
        </div>

        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-8 py-4 font-semibold w-1/3">Nazwa Reguły</th>
                <th className="px-8 py-4 font-semibold">Warunek (JSON)</th>
                <th className="px-8 py-4 font-semibold w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {activeRules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-4">
                    <p className="font-bold text-slate-900">{rule.name}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2
                      ${rule.severity === 'BLOCKER' ? 'bg-red-100 text-red-800' : 
                        rule.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <pre className="text-xs bg-slate-900 text-slate-300 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(rule.condition, null, 2)}
                    </pre>
                  </td>
                  <td className="px-8 py-4">
                    {rule.enabled ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Aktywna
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span> Wyłączona
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {activeRules.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-500">
                    Brak zdefiniowanych reguł dla tej wersji.
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
