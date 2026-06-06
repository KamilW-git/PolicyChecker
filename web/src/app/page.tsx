import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export default async function Home() {
  const user = await getCurrentUser()

  // Real aggregates from DB
  const myRequestsCount = user ? await prisma.request.count({
    where: { requesterId: user.id }
  }) : 0

  const isRestrictedRole = user && ['REQUESTER', 'POLICY_OWNER', 'POLICY_APPROVER'].includes(user.role);
  
  const allRequestsCount = await prisma.request.count()
  
  const pendingReviewCount = await prisma.request.count({
    where: { 
      status: 'IN_REVIEW',
      ...(isRestrictedRole ? { requesterId: user.id } : {})
    }
  })

  const activePoliciesCount = await prisma.policy.count({
    where: { status: 'PUBLISHED' }
  })

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-white-900">Pulpit Operacyjny</h1>
        <p className="text-slate-500 mt-2">Witaj w systemie Policy Checker. Tutaj znajdziesz podsumowanie swoich wniosków i przypisanych zadań.</p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-${isRestrictedRole ? '3' : '4'} gap-6`}>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Moje Wnioski</h3>
            <p className="text-4xl font-bold text-blue-600">{myRequestsCount}</p>
          </div>
          <div className="mt-auto pt-6 flex justify-between items-center">
            <Link href="/requests/new" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
              + Złóż nowy
            </Link>
            <Link href="/requests?mine=true" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 font-medium">
              Wyświetl &rarr;
            </Link>
          </div>
        </div>

        {!isRestrictedRole && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Wszystkie Wnioski</h3>
              <p className="text-4xl font-bold text-indigo-500">{allRequestsCount}</p>
            </div>
            <div className="mt-auto pt-6">
              <Link href="/requests" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                Przejdź do rejestru &rarr;
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Oczekujące na Ocenę</h3>
            <p className="text-4xl font-bold text-amber-500">{pendingReviewCount}</p>
          </div>
          <div className="mt-auto pt-6">
            <Link href="/requests?status=IN_REVIEW" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
              Przejdź do kolejki &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Aktywne Polityki</h3>
            <p className="text-4xl font-bold text-emerald-600">{activePoliciesCount}</p>
          </div>
          <div className="mt-auto pt-6">
            {user && ['POLICY_OWNER', 'ADMIN'].includes(user.role) ? (
              <Link href="/policies" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                Zarządzaj politykami &rarr;
              </Link>
            ) : (
              <Link href="/policies" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                Przeglądaj polityki &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
