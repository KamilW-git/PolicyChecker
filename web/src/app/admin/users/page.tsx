import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { updateUserRole } from './actions'
import { Role } from '@prisma/client'

export default async function AdminUsersPage() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/requests')
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Zarządzanie Użytkownikami</h1>
          <p className="text-slate-500 mt-2">Przeglądaj użytkowników i zmieniaj ich role w systemie (RBAC).</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <form action={updateUserRole.bind(null, u.id)} className="flex items-center gap-2">
                      <select 
                        name="role" 
                        defaultValue={u.role} 
                        className="text-sm border border-slate-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                        disabled={u.id === user.id} // Nie pozwól adminowi zmienić swojej własnej roli by zapobiec lock-out
                      >
                        {Object.values(Role).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      {u.id !== user.id && (
                        <button type="submit" className="px-2 py-1 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700 transition">
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
      </div>
    </div>
  )
}
