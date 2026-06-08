'use server'

import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

const loginAttempts = new Map<string, { count: number, resetAt: number }>()

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Wypełnij wszystkie pola.' }
  }

  const attempt = loginAttempts.get(email)
  if (attempt && attempt.count >= 5) {
    if (Date.now() < attempt.resetAt) {
      return { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' }
    } else {
      loginAttempts.delete(email)
    }
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return { error: 'Nieprawidłowy email lub hasło.' }
  }

  const isValid = await bcrypt.compare(password, user.password)
  
  if (!isValid) {
    const current = loginAttempts.get(email) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 }
    current.count += 1
    loginAttempts.set(email, current)
    return { error: 'Nieprawidłowy email lub hasło.' }
  }

  loginAttempts.delete(email)

  await createSession(user.id, user.role)
  redirect('/')
}
