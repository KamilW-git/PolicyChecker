'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { uploadAttachment } from '../actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium text-sm hover:bg-slate-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Wgraj plik
    </button>
  )
}

export default function UploadForm({ requestId }: { requestId: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  const handleAction = async (formData: FormData) => {
    try {
      await uploadAttachment(requestId, formData)
      toast.success('Plik został pomyślnie wgrany.')
      formRef.current?.reset()
    } catch (e: any) {
      toast.error('Wystąpił błąd podczas wgrywania pliku: ' + e.message)
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
      <div className="w-full sm:w-auto">
        <label className="block text-sm font-medium text-slate-700 mb-1">Typ Załącznika</label>
        <select name="type" className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900" required>
          <option value="DPA">Umowa Powierzenia Danych (DPA)</option>
          <option value="CONTRACT">Projekt Umowy / Kontrakt</option>
          <option value="SECURITY_QUESTIONNAIRE">Kwestionariusz Bezpieczeństwa</option>
          <option value="OTHER">Inne (np. specyfikacja techniczna)</option>
          <option value="APPROVAL_MAIL">Mail z Akceptacją (APPROVAL_MAIL)</option>
          <option value="VENDOR_ASSESSMENT">Ocena Dostawcy</option>
        </select>
      </div>
      <div className="flex-1 w-full sm:w-auto">
        <label className="block text-sm font-medium text-slate-700 mb-1">Plik (Max 10MB)</label>
        <input type="file" name="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition" required />
      </div>
      <div className="w-full sm:w-auto flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
