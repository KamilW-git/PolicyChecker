import { createRequest } from '../actions'

export default function NewRequestPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-900">Nowy Wniosek Zakupowy</h1>
          <p className="text-sm text-slate-500 mt-1">Wypełnij szczegóły zakupu, aby rozpocząć proces akceptacji.</p>
        </div>
        
        <form action={createRequest} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Tytuł wniosku</label>
              <input required type="text" id="title" name="title" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900" placeholder="np. Zakup licencji Adobe Creative Cloud" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Uzasadnienie biznesowe</label>
              <textarea required id="description" name="description" rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900" placeholder="Dlaczego ten zakup jest potrzebny?"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Typ wniosku</label>
                <select id="type" name="type" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                  <option value="NEW_SOFTWARE">Nowe oprogramowanie</option>
                  <option value="SOFTWARE_RENEWAL">Odnowienie licencji</option>
                  <option value="NEW_VENDOR">Nowy dostawca</option>
                  <option value="HARDWARE_PURCHASE">Zakup sprzętu</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Kategoria</label>
                <select id="category" name="category" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                  <option value="SAAS">SaaS (Oprogramowanie w chmurze)</option>
                  <option value="HARDWARE">Sprzęt</option>
                  <option value="CONSULTING">Usługi doradcze</option>
                  <option value="OTHER">Inne</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="annualCost" className="block text-sm font-medium text-slate-700 mb-1">Roczny koszt</label>
                <input required type="number" step="0.01" id="annualCost" name="annualCost" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" placeholder="0.00" />
              </div>
              
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-1">Waluta</label>
                <select id="currency" name="currency" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="PLN">PLN</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700 mb-1">Nazwa dostawcy</label>
                <input required type="text" id="vendorName" name="vendorName" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
              </div>
              
              <div>
                <label htmlFor="vendorCountry" className="block text-sm font-medium text-slate-700 mb-1">Kraj dostawcy</label>
                <input required type="text" id="vendorCountry" name="vendorCountry" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
              </div>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">Dział zlecający</label>
              <select id="department" name="department" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="FINANCE">Finanse</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              Anuluj
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Złóż wniosek
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
