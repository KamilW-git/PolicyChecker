'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'
import { ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (prevState: any, formData: FormData) => await loginAction(formData),
    null
  )

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-8 text-center bg-[#F5F5F7]/50 border-b border-slate-200/80">
          <div className="w-12 h-12 bg-[var(--color-accent)] rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PolicyChecker</h1>
          <p className="text-slate-500 mt-2 text-sm">Zaloguj się, aby kontynuować</p>
        </div>

        <form action={formAction} className="p-8 space-y-6">
          {state?.error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Adres Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasło</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-2 text-black border border-slate-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[var(--color-accent)] text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {pending ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="px-8 pb-8 text-xs text-slate-500 text-center">
          Dostępne konta testowe:<br />
          <span className="font-medium">requester@pc.com</span> (Wnioskodawca)<br />
          <span className="font-medium">reviewer@pc.com</span> (Zakupy / Reviewer)<br />
          <span className="font-medium">owner@pc.com</span> (Właściciel Polityk)<br />
          <span className="font-medium">approver@pc.com</span> (Zatwierdzający Polityki)<br />
          <span className="font-medium">auditor@pc.com</span> (Audytor)<br />
          <span className="font-medium">admin@pc.com</span> (Admin)<br />
        </div>
      </div>
    </div>
  )
}
