import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TestConsoleClient from './TestConsoleClient'
import { PageHeader } from '@/components/ui/PageHeader'

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
      <div className="sticky top-0 z-20 bg-[#F5F5F7]/90 backdrop-blur-md pt-4 pb-4 mb-2 border-b border-slate-200">
        <Link href="/policies" className="text-slate-500 hover:text-slate-800 transition text-sm font-medium">
          &larr; Wróć do polityk
        </Link>
      </div>
      <PageHeader 
        title="Konsola testowania reguł"
        description="Przetestuj działanie zdefiniowanych reguł na sztucznych danych bez tworzenia wniosku."
      />

      <TestConsoleClient policyVersions={policyVersions} />
    </div>
  )
}
