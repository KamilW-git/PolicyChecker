import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { updateUserRole } from './actions'
import { Role } from '@prisma/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { roleLabel } from '@/lib/labels'

export default async function AdminUsersPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/requests')
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Zarządzanie Użytkownikami"
        description="Przeglądaj użytkowników i zmieniaj ich role w systemie (RBAC)."
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Imię i Nazwisko</th>
                <th className="px-6 py-4 font-semibold">Adres Email</th>
                <th className="px-6 py-4 font-semibold">Obecna Rola</th>
                <th className="px-6 py-4 font-semibold w-48">Akcje (Zmiana Roli)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <form action={updateUserRole.bind(null, u.id)} className="flex items-center gap-2">
                      <select 
                        name="role" 
                        defaultValue={u.role} 
                        className="text-sm border border-slate-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-slate-900"
                        disabled={u.id === user.id} // Nie pozwól adminowi zmienić swojej własnej roli by zapobiec lock-out
                      >
                        {Object.values(Role).map(role => (
                          <option key={role} value={role}>{roleLabel(role)}</option>
                        ))}
                      </select>
                      {u.id !== user.id && (
                        <button type="submit" className="px-3 py-1 bg-[var(--color-accent)] text-white rounded text-xs font-medium hover:opacity-90 transition">
                          Zapisz
                        </button>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
