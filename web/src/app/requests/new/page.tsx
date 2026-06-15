import { createRequest } from '../actions'
import RequestWizard from '../RequestWizard'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function NewRequestPage() {
  const user = await getCurrentUser()
  if (user?.role === 'AUDITOR') {
    redirect('/requests')
  }

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden border-0 shadow-none bg-transparent">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 hidden">
          <h1 className="text-2xl font-bold text-slate-900">Nowy Wniosek Zakupowy</h1>
          <p className="text-sm text-slate-500 mt-1">Wypełnij szczegóły zakupu, aby rozpocząć proces akceptacji.</p>
        </div>
        
        <RequestWizard action={createRequest} users={users} />
      </div>
    </div>
  )
}
