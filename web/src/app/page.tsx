import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pulpit Operacyjny</h1>
        <p className="text-slate-500 mt-2">Witaj w systemie Policy Checker. Tutaj znajdziesz podsumowanie swoich wniosków i przypisanych zadań.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-2">Moje Wnioski</h3>
          <p className="text-3xl font-bold text-blue-600">3</p>
          <div className="mt-4">
            <Link href="/requests/new" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              + Złóż nowy wniosek
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-2">Oczekujące na Ocenę</h3>
          <p className="text-3xl font-bold text-amber-500">1</p>
          <div className="mt-4">
            <Link href="/requests?status=IN_REVIEW" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Przejdź do kolejki
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-2">Aktywne Polityki</h3>
          <p className="text-3xl font-bold text-emerald-600">4</p>
          <div className="mt-4">
            <Link href="/policies" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Zarządzaj politykami
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
