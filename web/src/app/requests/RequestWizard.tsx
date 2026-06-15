'use client'

import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

function SubmitButtons({ defaultValues, handleBack }: { defaultValues: any, handleBack: () => void }) {
  const { pending } = useFormStatus()
  
  return (
    <div className="pt-6 flex flex-col-reverse md:flex-row justify-end gap-3 border-t border-slate-100">
      <button type="button" onClick={handleBack} disabled={pending} className="w-full md:w-auto px-8 py-3 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
        Wstecz
      </button>
      
      {defaultValues.status === 'NEEDS_INFORMATION' ? (
        <button type="submit" disabled={pending} className="w-full md:w-auto px-8 py-3 rounded-xl font-medium text-white bg-[var(--color-accent)] hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Uzupełnij i prześlij ponownie
        </button>
      ) : (
        <>
          <button type="submit" name="isDraft" value="true" disabled={pending} className="w-full md:w-auto px-8 py-3 rounded-xl font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Zapisz jako szkic
          </button>
          <button type="submit" name="isDraft" value="false" disabled={pending} className="w-full md:w-auto px-8 py-3 rounded-xl font-medium text-white bg-[var(--color-accent)] hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Przekaż do oceny
          </button>
        </>
      )}
    </div>
  )
}

export default function RequestWizard({ 
  action, 
  users, 
  defaultValues = {} 
}: { 
  action: any, 
  users: any[], 
  defaultValues?: any 
}) {
  const [step, setStep] = useState(1)
  
  // Stan całego formularza
  const [formValues, setFormValues] = useState({
    title: defaultValues.title || '',
    description: defaultValues.description || '',
    type: defaultValues.type || 'NEW_SOFTWARE',
    category: defaultValues.category || 'SAAS',
    department: defaultValues.department || 'IT',
    urgency: defaultValues.urgency || 'NORMAL',
    annualCost: defaultValues.annualCost || '',
    currency: defaultValues.currency || 'EUR',
    vendorName: defaultValues.vendorName || '',
    vendorCountry: defaultValues.vendorCountry || '',
    vendorRisk: defaultValues.vendorRisk || 'UNKNOWN',
    businessOwnerId: defaultValues.businessOwnerId || '',
    budgetOwnerId: defaultValues.budgetOwnerId || '',
    processesPersonalData: defaultValues.processesPersonalData || false,
    hasDpa: defaultValues.hasDpa || false,
    transferOutsideEEA: defaultValues.transferOutsideEEA || false,
    securityQuestionnaire: defaultValues.securityQuestionnaire || false,
    dataCategories: (defaultValues.dataCategories || []).join(', ')
  })

  const formRef = useRef<HTMLFormElement>(null)

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    // Prosta walidacja za pomocą HTML5
    if (formRef.current) {
      const isValid = formRef.current.reportValidity()
      if (isValid) {
        setStep(step + 1)
      }
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Wskaźnik kroków */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">
            {step === 1 && 'Krok 1: Zakup'}
            {step === 2 && 'Krok 2: Zgodność'}
            {step === 3 && 'Krok 3: Podsumowanie'}
          </h2>
          <span className="text-sm font-medium text-slate-500">Krok {step} z 3</span>
        </div>
        <div className="mt-3 flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[var(--color-accent)]' : 'bg-slate-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[var(--color-accent)]' : 'bg-slate-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-[var(--color-accent)]' : 'bg-slate-200'}`} />
        </div>
      </div>

      <form ref={formRef} action={action} className="p-6 md:p-8">
        
        {/* KROK 1: ZAKUP */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Tytuł wniosku *</label>
                <input required value={formValues.title} onChange={handleChange} type="text" id="title" name="title" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900" placeholder="np. Zakup licencji Adobe Creative Cloud" />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Uzasadnienie biznesowe *</label>
                <textarea required value={formValues.description} onChange={handleChange} id="description" name="description" rows={3} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900" placeholder="Dlaczego ten zakup jest potrzebny?"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">Typ wniosku</label>
                  <select value={formValues.type} onChange={handleChange} id="type" name="type" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
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
                  <select value={formValues.category} onChange={handleChange} id="category" name="category" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
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
                  <select value={formValues.department} onChange={handleChange} id="department" name="department" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
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
                  <select value={formValues.urgency} onChange={handleChange} id="urgency" name="urgency" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                    <option value="LOW">Niska</option>
                    <option value="NORMAL">Normalna</option>
                    <option value="HIGH">Wysoka</option>
                    <option value="EMERGENCY">Awaryjna (EMERGENCY)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-800">Koszty i Dostawca</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="annualCost" className="block text-sm font-medium text-slate-700 mb-1">Roczny koszt *</label>
                  <input value={formValues.annualCost} onChange={handleChange} required type="number" step="0.01" id="annualCost" name="annualCost" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" placeholder="0.00" />
                </div>
                
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-1">Waluta</label>
                  <select value={formValues.currency} onChange={handleChange} id="currency" name="currency" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="PLN">PLN</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vendorName" className="block text-sm font-medium text-slate-700 mb-1">Nazwa dostawcy *</label>
                  <input value={formValues.vendorName} onChange={handleChange} required type="text" id="vendorName" name="vendorName" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
                </div>
                
                <div>
                  <label htmlFor="vendorCountry" className="block text-sm font-medium text-slate-700 mb-1">Kraj dostawcy *</label>
                  <input value={formValues.vendorCountry} onChange={handleChange} required type="text" id="vendorCountry" name="vendorCountry" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900" />
                </div>
              </div>

              <div>
                <label htmlFor="vendorRisk" className="block text-sm font-medium text-slate-700 mb-1">Ryzyko dostawcy (Oszacowanie)</label>
                <select value={formValues.vendorRisk} onChange={handleChange} id="vendorRisk" name="vendorRisk" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                  <option value="UNKNOWN">Nieznane</option>
                  <option value="LOW">Niskie</option>
                  <option value="MEDIUM">Średnie</option>
                  <option value="HIGH">Wysokie</option>
                  <option value="CRITICAL">Krytyczne</option>
                </select>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button type="button" onClick={handleNext} className="w-full md:w-auto px-8 py-3 rounded-xl font-medium text-white bg-[var(--color-accent)] hover:opacity-90 transition-opacity">
                Dalej
              </button>
            </div>
          </div>
        )}

        {/* KROK 2: ZGODNOŚĆ */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">Osoby decyzyjne</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="businessOwnerId" className="block text-sm font-medium text-slate-700 mb-1">Właściciel Biznesowy *</label>
                  <select value={formValues.businessOwnerId} onChange={handleChange} required id="businessOwnerId" name="businessOwnerId" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                    <option value="">Wybierz użytkownika...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="budgetOwnerId" className="block text-sm font-medium text-slate-700 mb-1">Właściciel Budżetu (opcjonalnie)</label>
                  <select value={formValues.budgetOwnerId} onChange={handleChange} id="budgetOwnerId" name="budgetOwnerId" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900">
                    <option value="">Wybierz użytkownika...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-800">Bezpieczeństwo i Prywatność (RODO)</h3>
              
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="processesPersonalData" 
                  name="processesPersonalData" 
                  checked={formValues.processesPersonalData}
                  onChange={handleChange}
                  className="w-5 h-5 text-[var(--color-accent)] rounded border-slate-300 focus:ring-[var(--color-accent)]" 
                />
                <label htmlFor="processesPersonalData" className="text-sm font-medium text-slate-700">Dostawca będzie przetwarzał dane osobowe (PII)</label>
              </div>

              {formValues.processesPersonalData && (
                <div className="pl-8 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formValues.hasDpa} onChange={handleChange} id="hasDpa" name="hasDpa" className="w-5 h-5 text-[var(--color-accent)] rounded border-slate-300 focus:ring-[var(--color-accent)]" />
                    <label htmlFor="hasDpa" className="text-sm font-medium text-slate-700">Posiadamy podpisaną umowę powierzenia danych (DPA)</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formValues.transferOutsideEEA} onChange={handleChange} id="transferOutsideEEA" name="transferOutsideEEA" className="w-5 h-5 text-[var(--color-accent)] rounded border-slate-300 focus:ring-[var(--color-accent)]" />
                    <label htmlFor="transferOutsideEEA" className="text-sm font-medium text-slate-700">Dane będą transferowane poza EOG</label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={formValues.securityQuestionnaire} onChange={handleChange} id="securityQuestionnaire" name="securityQuestionnaire" className="w-5 h-5 text-[var(--color-accent)] rounded border-slate-300 focus:ring-[var(--color-accent)]" />
                    <label htmlFor="securityQuestionnaire" className="text-sm font-medium text-slate-700">Dostawca wypełnił kwestionariusz bezpieczeństwa</label>
                  </div>

                  <div>
                    <label htmlFor="dataCategories" className="block text-sm font-medium text-slate-700 mb-1">Kategorie przetwarzanych danych *</label>
                    <input 
                      type="text" 
                      id="dataCategories" 
                      name="dataCategories" 
                      value={formValues.dataCategories}
                      onChange={handleChange}
                      required={formValues.processesPersonalData}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-accent)] outline-none text-slate-900" 
                      placeholder="np. email, adres, PESEL, dane medyczne" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 flex flex-col-reverse md:flex-row justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={handleBack} className="w-full md:w-auto px-8 py-3 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                Wstecz
              </button>
              <button type="button" onClick={handleNext} className="w-full md:w-auto px-8 py-3 rounded-xl font-medium text-white bg-[var(--color-accent)] hover:opacity-90 transition-opacity">
                Dalej
              </button>
            </div>
          </div>
        )}

        {/* KROK 3: PODSUMOWANIE */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* Wygenerowanie ukrytych pól dla Server Action */}
            <input type="hidden" name="title" value={formValues.title} />
            <input type="hidden" name="description" value={formValues.description} />
            <input type="hidden" name="type" value={formValues.type} />
            <input type="hidden" name="category" value={formValues.category} />
            <input type="hidden" name="department" value={formValues.department} />
            <input type="hidden" name="urgency" value={formValues.urgency} />
            <input type="hidden" name="annualCost" value={formValues.annualCost} />
            <input type="hidden" name="currency" value={formValues.currency} />
            <input type="hidden" name="vendorName" value={formValues.vendorName} />
            <input type="hidden" name="vendorCountry" value={formValues.vendorCountry} />
            <input type="hidden" name="vendorRisk" value={formValues.vendorRisk} />
            <input type="hidden" name="businessOwnerId" value={formValues.businessOwnerId} />
            <input type="hidden" name="budgetOwnerId" value={formValues.budgetOwnerId} />
            
            {/* Checkboxy jako hidden potrzebują specjalnego mapowania wartości bool -> on/off, ale react/next poradzi sobie gdy przekażemy text */}
            {formValues.processesPersonalData && <input type="hidden" name="processesPersonalData" value="on" />}
            {formValues.hasDpa && <input type="hidden" name="hasDpa" value="on" />}
            {formValues.transferOutsideEEA && <input type="hidden" name="transferOutsideEEA" value="on" />}
            {formValues.securityQuestionnaire && <input type="hidden" name="securityQuestionnaire" value="on" />}
            
            {formValues.processesPersonalData && <input type="hidden" name="dataCategories" value={formValues.dataCategories} />}

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">Podsumowanie wprowadzonych danych</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-3">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Tytuł:</span>
                  <span className="font-medium">{formValues.title}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Koszt roczny:</span>
                  <span className="font-medium">{formValues.annualCost} {formValues.currency}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Dostawca:</span>
                  <span className="font-medium">{formValues.vendorName} ({formValues.vendorCountry})</span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Właściciel Biznesowy:</span>
                  <span className="font-medium">{users.find(u => u.id === formValues.businessOwnerId)?.name || 'Nie wybrano'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pb-2">
                  <span className="text-slate-500">Przetwarza dane osobowe:</span>
                  <span className="font-medium">{formValues.processesPersonalData ? 'TAK' : 'NIE'}</span>
                </div>
              </div>
            </div>

            <SubmitButtons defaultValues={defaultValues} handleBack={handleBack} />
          </div>
        )}
      </form>
    </div>
  )
}
