'use client'

import { useState } from 'react'

export default function RequestForm({ 
  action, 
  users, 
  defaultValues = {} 
}: { 
  action: any, 
  users: any[], 
  defaultValues?: any 
}) {
  const [processesPersonalData, setProcessesPersonalData] = useState(defaultValues.processesPersonalData || false)

  return (
    <form action={action} className="p-8 space-y-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Informacje podstawowe</h3>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Tytuł wniosku</label>
            <input required defaultValue={defaultValues.title} type="text" id="title" name="title" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900" placeholder="np. Zakup licencji Adobe Creative Cloud" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Uzasadnienie biznesowe</label>
            <textarea required defaultValue={defaultValues.description} id="description" name="description" rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900" placeholder="Dlaczego ten zakup jest potrzebny?"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Typ wniosku</label>
              <select defaultValue={defaultValues.type} id="type" name="type" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                <option value="NEW_SOFTWARE">Nowe oprogramowanie</option>
                <option value="SOFTWARE_RENEWAL">Odnowienie licencji</option>
                <option value="NEW_VENDOR">Nowy dostawca</option>
                <option value="HARDWARE_PURCHASE">Zakup sprzętu</option>
                <option value="CONSULTING_SERVICE">Usługa doradcza</option>
                <option value="EXCEPTION_REQUEST">Wniosek o wyjątek</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Kategoria</label>
              <select defaultValue={defaultValues.category} id="category" name="category" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                <option value="SAAS">SaaS (Oprogramowanie w chmurze)</option>
                <option value="HARDWARE">Sprzęt</option>
                <option value="CONSULTING">Usługi doradcze</option>
                <option value="MARKETING_SERVICE">Usługi marketingowe</option>
                <option value="CLOUD_SERVICE">Usługi chmurowe</option>
                <option value="DATA_PROVIDER">Dostawca danych</option>
                <option value="OTHER">Inne</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">Dział zlecający</label>
              <select defaultValue={defaultValues.department} id="department" name="department" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="FINANCE">Finanse</option>
                <option value="MARKETING">Marketing</option>
                <option value="SALES">Sprzedaż</option>
                <option value="LEGAL">Dział Prawny</option>
                <option value="PROCUREMENT">Dział Zakupów</option>
                <option value="OTHER">Inny</option>
              </select>
            </div>

            <div>
              <label htmlFor="urgency" className="block text-sm font-medium text-slate-700 mb-1">Pilność wniosku</label>
              <select defaultValue={defaultValues.urgency || 'NORMAL'} id="urgency" name="urgency" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                <option value="LOW">Niska</option>
                <option value="NORMAL">Normalna</option>
                <option value="HIGH">Wysoka</option>
                <option value="EMERGENCY">Awaryjna (EMERGENCY)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Koszty i Dostawca</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="annualCost" className="block text-sm font-medium text-slate-700 mb-1">Roczny koszt</label>
              <input defaultValue={defaultValues.annualCost} required type="number" step="0.01" id="annualCost" name="annualCost" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" placeholder="0.00" />
            </div>
            
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-1">Waluta</label>
              <select defaultValue={defaultValues.currency || 'EUR'} id="currency" name="currency" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="PLN">PLN</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700 mb-1">Nazwa dostawcy</label>
              <input defaultValue={defaultValues.vendorName} required type="text" id="vendorName" name="vendorName" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
            </div>
            
            <div>
              <label htmlFor="vendorCountry" className="block text-sm font-medium text-slate-700 mb-1">Kraj dostawcy</label>
              <input defaultValue={defaultValues.vendorCountry} required type="text" id="vendorCountry" name="vendorCountry" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
            </div>
          </div>

          <div>
            <label htmlFor="vendorRisk" className="block text-sm font-medium text-slate-700 mb-1">Ryzyko dostawcy (Oszacowanie)</label>
            <select defaultValue={defaultValues.vendorRisk || 'UNKNOWN'} id="vendorRisk" name="vendorRisk" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
              <option value="UNKNOWN">Nieznane</option>
              <option value="LOW">Niskie</option>
              <option value="MEDIUM">Średnie</option>
              <option value="HIGH">Wysokie</option>
              <option value="CRITICAL">Krytyczne</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Osoby decyzyjne</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="businessOwnerId" className="block text-sm font-medium text-slate-700 mb-1">Właściciel Biznesowy</label>
              <select defaultValue={defaultValues.businessOwnerId} required id="businessOwnerId" name="businessOwnerId" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                <option value="">Wybierz użytkownika...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="budgetOwnerId" className="block text-sm font-medium text-slate-700 mb-1">Właściciel Budżetu (opcjonalnie)</label>
              <select defaultValue={defaultValues.budgetOwnerId} id="budgetOwnerId" name="budgetOwnerId" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                <option value="">Wybierz użytkownika...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="font-bold text-slate-800 border-b pb-2">Bezpieczeństwo i Prywatność (RODO)</h3>
          
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="processesPersonalData" 
              name="processesPersonalData" 
              defaultChecked={defaultValues.processesPersonalData}
              onChange={(e) => setProcessesPersonalData(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
            />
            <label htmlFor="processesPersonalData" className="text-sm font-medium text-slate-700">Dostawca będzie przetwarzał dane osobowe (PII)</label>
          </div>

          {processesPersonalData && (
            <div className="pl-8 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked={defaultValues.hasDpa} id="hasDpa" name="hasDpa" className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <label htmlFor="hasDpa" className="text-sm font-medium text-slate-700">Posiadamy podpisaną umowę powierzenia danych (DPA)</label>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked={defaultValues.transferOutsideEEA} id="transferOutsideEEA" name="transferOutsideEEA" className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <label htmlFor="transferOutsideEEA" className="text-sm font-medium text-slate-700">Dane będą transferowane poza EOG</label>
              </div>
              
              <div className="flex items-center gap-3">
                <input type="checkbox" defaultChecked={defaultValues.securityQuestionnaire} id="securityQuestionnaire" name="securityQuestionnaire" className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <label htmlFor="securityQuestionnaire" className="text-sm font-medium text-slate-700">Dostawca wypełnił kwestionariusz bezpieczeństwa</label>
              </div>

              <div>
                <label htmlFor="dataCategories" className="block text-sm font-medium text-slate-700 mb-1">Kategorie przetwarzanych danych (po przecinku)</label>
                <input 
                  type="text" 
                  id="dataCategories" 
                  name="dataCategories" 
                  defaultValue={(defaultValues.dataCategories || []).join(', ')}
                  required={processesPersonalData}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" 
                  placeholder="np. email, adres, PESEL, dane medyczne" 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
        <a href="/requests" className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          Anuluj
        </a>
        {defaultValues.status === 'NEEDS_INFORMATION' ? (
          <button type="submit" className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Uzupełnij i prześlij ponownie
          </button>
        ) : (
          <>
            <button type="submit" name="isDraft" value="true" className="px-5 py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
              Zapisz jako szkic
            </button>
            <button type="submit" name="isDraft" value="false" className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Przekaż do oceny
            </button>
          </>
        )}
      </div>
    </form>
  )
}
