'use client'

import { useState } from 'react'
import { overrideRequest } from './actions'

export default function ManualOverrideModal({ requestId }: { requestId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <div className="mt-8 pt-6 border-t border-slate-800">
        <button 
          onClick={() => setIsOpen(true)}
          className="px-5 py-2.5 rounded-lg font-medium text-white bg-slate-700 hover:bg-slate-600 transition"
        >
          Manual Override
        </button>
      </div>
    )
  }

  return (
    <div className="mt-8 pt-6 border-t border-slate-800">
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-700 max-w-lg w-full overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Manual Override</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          
          <form action={(formData) => {
            overrideRequest(requestId, formData)
            setIsOpen(false)
          }} className="p-6 space-y-4">
            <div className="p-3 mb-4 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
              Manual Override jest wyjątkiem od decyzji systemowej i zostanie zapisany w historii audytowej.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Decision *</label>
              <select name="decision" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none">
                <option value="">Wybierz decyzję...</option>
                <option value="APPROVED">APPROVED</option>
                <option value="APPROVED_WITH_EXCEPTION">APPROVED_WITH_EXCEPTION</option>
                <option value="REJECTED">REJECTED</option>
                <option value="REQUIRES_REVIEW">REQUIRES_REVIEW</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Reason *</label>
              <input type="text" name="reason" required className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Comment *</label>
              <textarea name="comment" required rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Approved By *</label>
              <input type="text" name="approvedBy" required placeholder="np. Head of Procurement" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Attachment (optional)</label>
              <input type="file" name="attachment" className="w-full text-slate-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700" />
              <p className="text-xs text-slate-500 mt-1">Opcjonalny dowód akceptacji (max 10 MB). Plik jest dostępny tylko dla uprawnionych użytkowników.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition">Anuluj</button>
              <button type="submit" className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition">Wykonaj Override</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
