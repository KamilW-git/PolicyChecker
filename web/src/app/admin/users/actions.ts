'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { Role } from '@prisma/client'

export async function updateUserRole(userId: string, formData: FormData) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const newRole = formData.get('role') as Role
  if (!newRole) return

  const oldUser = await prisma.user.findUnique({ where: { id: userId } })
  if (!oldUser) throw new Error('Nie znaleziono użytkownika')

  if (oldUser.role === newRole) return

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  })

  // Generowanie AuditEvent przy zmianie roli (P1-35)
  await prisma.auditEvent.create({
    data: {
      action: 'UPDATE_USER_ROLE',
      entity: 'User',
      entityId: userId,
      userId: admin.id,
      details: {
        oldRole: oldUser.role,
        newRole: newRole
      }
    }
  })

  revalidatePath('/admin/users')
}
