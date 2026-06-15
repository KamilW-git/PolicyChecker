import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import RequestWizard from '../../RequestWizard'
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
      <RequestWizard action={formAction} users={users} defaultValues={defaultValues} />
    </div>
  )
}
