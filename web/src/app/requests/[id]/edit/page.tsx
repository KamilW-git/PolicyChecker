import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import RequestForm from '../../RequestForm'
import { updateRequest, resubmitRequest } from '../../actions'

export default async function EditRequestPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) return notFound()

  const request = await prisma.request.findUnique({
    where: { id }
  })

  if (!request) return notFound()

  // Only requester can edit their own request
  if (request.requesterId !== user.id) {
    return notFound()
  }

  // Only allowed in specific statuses
  if (request.status !== 'DRAFT' && request.status !== 'NEEDS_INFORMATION') {
    return notFound()
  }

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' }
  })

  // merge Request data with inputData JSON to get the best representation
  const defaultValues = {
    ...request,
    ...(typeof request.inputData === 'object' && request.inputData !== null ? request.inputData : {})
  }

  // Depending on status, we use a different action
  const formAction = request.status === 'DRAFT' 
    ? updateRequest.bind(null, request.id)
    : resubmitRequest.bind(null, request.id)

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-900">
            {request.status === 'DRAFT' ? 'Edycja Szkicu' : 'Uzupełnij Brakujące Informacje'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Zaktualizuj szczegóły wniosku.
          </p>
        </div>
        
        <RequestForm action={formAction} users={users} defaultValues={defaultValues} />
      </div>
    </div>
  )
}
