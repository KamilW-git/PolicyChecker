import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function PoliciesPage() {
  const policies = await prisma.policy.findMany({
    orderBy: { domain: 'asc' },
    include: {
      versions: {
        where: { status: 'PUBLISHED' },
        take: 1
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Polityki Biznesowe</h1>
          <p className="text-slate-500 mt-2">Zarządzaj zasadami i regułami oceniania wniosków.</p>
        </div>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition shadow-sm opacity-50 cursor-not-allowed" title="Funkcja dostępna w kolejnych wersjach">
          + Nowa Polityka
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {policies.map(policy => {
          const publishedVersion = policy.versions[0]
          
          return (
            <Link key={policy.id} href={`/policies/${policy.id}`} className="group block">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all h-full flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{policy.domain}</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1 group-hover:text-blue-600 transition-colors">{policy.name}</h2>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                    ${policy.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {policy.status}
                  </span>
                </div>
                
                <div className="px-6 py-5 flex-1">
                  <p className="text-slate-600 text-sm">{policy.description || 'Brak opisu polityki.'}</p>
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 mt-auto text-sm flex justify-between items-center text-slate-500">
                  {publishedVersion ? (
                    <span>Aktywna wersja: <strong className="text-slate-700">v{publishedVersion.version}</strong></span>
                  ) : (
                    <span className="text-amber-600">Brak aktywnej wersji</span>
                  )}
                  <span className="text-blue-600 font-medium group-hover:underline">Zarządzaj &rarr;</span>
                </div>
              </div>
            </Link>
          )
        })}
        {policies.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
            Brak zdefiniowanych polityk w systemie.
          </div>
        )}
      </div>
    </div>
  )
}
