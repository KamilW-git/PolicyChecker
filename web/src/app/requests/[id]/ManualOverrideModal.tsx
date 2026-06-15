'use client'

import { useState } from 'react'
import { overrideRequest } from './actions'
import { X } from 'lucide-react'
import { decisionLabel } from '@/lib/labels'

export default function ManualOverrideModal({ requestId }: { requestId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <div className="mt-8 pt-6 border-t border-slate-100">
        <button 
          onClick={() => setIsOpen(true)}
          className="px-5 py-2.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
        >
          Decyzja ręczna
        </button>
      </div>
    )
  }

  return (
    <div className="mt-8 pt-6 border-t border-slate-100">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 max-w-lg w-full overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-lg text-slate-900">Decyzja ręczna</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          
          <form action={(formData) => {
            overrideRequest(requestId, formData)
            setIsOpen(false)
          }} className="p-6 space-y-4">
            <div className="p-3 mb-4 rounded bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              Decyzja ręczna jest wyjątkiem od decyzji systemowej i zostanie zapisana w historii audytowej.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nowa decyzja *</label>
              <select name="decision" required className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-[var(--color-accent)] outline-none">
                <option value="">Wybierz decyzję...</option>
                <option value="APPROVED">{decisionLabel('APPROVED')}</option>
                <option value="APPROVED_WITH_EXCEPTION">{decisionLabel('APPROVED_WITH_EXCEPTION')}</option>
                <option value="REJECTED">{decisionLabel('REJECTED')}</option>
                <option value="REQUIRES_REVIEW">{decisionLabel('REQUIRES_REVIEW')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Powód *</label>
              <input type="text" name="reason" required className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-[var(--color-accent)] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Komentarz *</label>
              <textarea name="comment" required rows={3} className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-[var(--color-accent)] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zatwierdził *</label>
              <input type="text" name="approvedBy" required placeholder="np. Head of Procurement" className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-[var(--color-accent)] outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Załącznik (opcjonalnie)</label>
              <input type="file" name="attachment" className="w-full text-slate-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
              <p className="text-xs text-slate-500 mt-1">Opcjonalny dowód akceptacji (max 10 MB). Plik jest dostępny tylko dla uprawnionych użytkowników.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition border border-transparent hover:border-slate-200">Anuluj</button>
              <button type="submit" className="px-5 py-2.5 rounded-lg font-medium text-white bg-[var(--color-accent)] hover:opacity-90 transition">Wykonaj decyzję ręczną</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
