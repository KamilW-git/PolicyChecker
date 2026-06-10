import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TestConsoleClient from './TestConsoleClient'

export default async function TestConsolePage() {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) {
    redirect('/policies')
  }

  // Pobierz wszystkie wersje polityk dla dropdowna
  const policyVersions = await prisma.policyVersion.findMany({
    orderBy: { createdAt: 'desc' },
    include: { policy: true }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/policies" className="text-slate-500 hover:text-slate-800 transition mb-2 inline-block">
            &larr; Wróć do polityk
          </Link>
          <h1 className="text-3xl font-bold text-white">Konsola Testowania Reguł</h1>
          <p className="text-slate-500 mt-2">Przetestuj działanie zdefiniowanych reguł na sztucznych danych bez tworzenia wniosku.</p>
        </div>
      </div>

      <TestConsoleClient policyVersions={policyVersions} />
    </div>
  )
}
