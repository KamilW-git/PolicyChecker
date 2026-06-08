'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PolicyDomain } from '@prisma/client'

export async function createPolicyAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const domain = formData.get('domain') as PolicyDomain

  if (!name || !description || !domain) {
    throw new Error('Wypełnij wszystkie pola')
  }

  const policy = await prisma.policy.create({
    data: {
      name,
      description,
      domain,
      status: 'DRAFT', // New policy starts as DRAFT or needs a version
      ownerId: user.id,
      versions: {
        create: [
          {
            version: 1,
            status: 'DRAFT',
            authorId: user.id,
            description: 'Wersja początkowa'
          }
        ]
      }
    }
  })

  // Log creation
  await prisma.auditEvent.create({
    data: {
      action: 'CREATE_POLICY',
      entity: 'Policy',
      entityId: policy.id,
      userId: user.id,
      details: { name, domain }
    }
  })

  revalidatePath('/policies')
  redirect(`/policies/${policy.id}`)
}
