import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createPolicyAction } from '../actions'

export default async function NewPolicyPage() {
  const user = await getCurrentUser()
  
  if (!user || !['POLICY_OWNER', 'ADMIN'].includes(user.role)) {
    redirect('/policies')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/policies" className="text-slate-500 hover:text-slate-800 transition">
          &larr; Wróć do listy
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-900">Utwórz nową politykę</h1>
          <p className="text-sm text-slate-500 mt-1">Zdefiniuj zbiór zasad dotyczących wybranego obszaru.</p>
        </div>

        <form action={createPolicyAction} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nazwa Polityki</label>
            <input 
              type="text" 
              name="name" 
              required 
              placeholder="np. Polityka Bezpieczeństwa IT"
              className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Opis</label>
            <textarea 
              name="description" 
              required 
              placeholder="Czego dotyczy ta polityka?"
              className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-blue-500 outline-none h-24" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Domena</label>
            <select name="domain" className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-blue-500 outline-none">
              <option value="PROCUREMENT">Zakupy (PROCUREMENT)</option>
              <option value="VENDOR_RISK">Ryzyko Dostawcy (VENDOR_RISK)</option>
              <option value="DATA_SECURITY">Bezpieczeństwo Danych (DATA_SECURITY)</option>
              <option value="FINANCE">Finanse (FINANCE)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="px-6 py-3 bg-[var(--color-accent)] hover:opacity-90 text-white font-medium rounded-lg transition">
              Utwórz politykę
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
