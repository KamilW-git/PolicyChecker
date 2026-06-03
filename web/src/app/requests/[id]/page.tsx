import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { overrideRequest } from './actions'

export default async function RequestDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      requester: true,
      businessOwner: true,
      evaluations: {
        orderBy: { evaluatedAt: 'desc' },
        take: 1,
        include: {
          manualOverrides: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { approvedBy: true }
          }
        }
      }
    }
  })

  if (!request) return notFound()

  const evaluation = request.evaluations[0]
  const override = evaluation?.manualOverrides?.[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/requests" className="text-slate-500 hover:text-slate-800 transition">
          &larr; Wróć do listy
        </Link>
      </div>

      {override && (
        <div className={`p-4 rounded-xl border text-black ${override.newDecision === 'APPROVED' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`font-bold ${override.newDecision === 'APPROVED' ? 'text-emerald-800' : 'text-red-800'}`}>
            Manualna decyzja: {override.newDecision}
          </h3>
          <p className="text-sm mt-1">Podjęta przez: {override.approvedBy.name} w dniu {override.createdAt.toLocaleDateString()}</p>
          <p className="mt-2 text-sm italic">Uzasadnienie: {override.reason}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{request.title}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Wniosek utworzony {request.createdAt.toLocaleDateString()} przez {request.requester.name}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
            ${request.status === 'AUTO_APPROVED' || request.status === 'MANUAL_APPROVED' ? 'bg-emerald-100 text-emerald-800' : 
              request.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
              request.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-800' : 
              'bg-slate-100 text-slate-800'}`}>
            {request.status}
          </span>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informacje Ogólne</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-slate-500">Kategoria</dt>
                <dd className="font-medium text-slate-900">{request.category}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Typ</dt>
                <dd className="font-medium text-slate-900">{request.type}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Dział</dt>
                <dd className="font-medium text-slate-900">{request.department}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Finanse i Dostawca</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-slate-500">Szacowany Roczny Koszt</dt>
                <dd className="font-medium text-slate-900">{request.annualCost?.toLocaleString()} {request.currency}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Dostawca</dt>
                <dd className="font-medium text-slate-900">{request.vendorName} ({request.vendorCountry})</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Właściciel Biznesowy</dt>
                <dd className="font-medium text-slate-900">{request.businessOwner.name}</dd>
              </div>
            </dl>
          </div>

          <div className="col-span-1 md:col-span-2 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Uzasadnienie Biznesowe</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{request.description}</p>
          </div>
        </div>
      </div>

      {evaluation && (
        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden text-white">
          <div className="px-8 py-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-blue-400">⚡</span> Policy Checker AI
            </h2>
            <span className="text-sm text-slate-400">Decyzja Systemu</span>
          </div>
          <div className="p-8">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${evaluation.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {evaluation.decision === 'APPROVED' ? '✓' : '⚠️'}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">
                  {evaluation.decision === 'APPROVED' ? 'Zatwierdzono automatycznie' : 'Wymaga weryfikacji ręcznej (Review)'}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {(evaluation.resultSnapshot as any)?.reason || 'Decyzja podjęta na podstawie wbudowanych reguł.'}
                </p>
              </div>
            </div>
            
            {request.status === 'IN_REVIEW' && user?.role === 'REVIEWER' && (
              <form action={overrideRequest.bind(null, request.id)} className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="font-bold mb-4 text-slate-200">Panel Recenzenta</h4>
                <div className="space-y-4">
                  <textarea 
                    name="reason" 
                    required 
                    placeholder="Wpisz uzasadnienie decyzji..." 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={3}
                  />
                  <div className="flex justify-end gap-3">
                    <button type="submit" name="decision" value="REJECTED" className="px-5 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition">Odrzuć</button>
                    <button type="submit" name="decision" value="APPROVED" className="px-5 py-2.5 rounded-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition">Zatwierdź Wniosek</button>
                  </div>
                </div>
              </form>
            )}
            {request.status === 'IN_REVIEW' && user?.role !== 'REVIEWER' && (
              <div className="mt-8 pt-6 border-t border-slate-800 text-slate-400 italic">
                Wniosek oczekuje na decyzję Recenzenta. Tylko Recenzent może go zatwierdzić lub odrzucić.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
