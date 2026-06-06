'use server'

import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Wypełnij wszystkie pola.' }
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  // MVP simple password check
  if (!user || user.password !== password) {
    return { error: 'Nieprawidłowy email lub hasło.' }
  }

  await createSession(user.id, user.role)
  redirect('/')
}
