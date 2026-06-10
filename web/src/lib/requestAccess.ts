import type { Request, User } from '@prisma/client'

export function canViewRequest(user: User | null, request: Request): boolean {
  if (!user) return false
  if (['REVIEWER', 'ADMIN', 'AUDITOR', 'POLICY_OWNER', 'POLICY_APPROVER'].includes(user.role)) {
    return true
  }
  return request.requesterId === user.id
}

export function canUploadAttachment(user: User, request: Request): boolean {
  return request.requesterId === user.id || ['REVIEWER', 'ADMIN'].includes(user.role)
}
