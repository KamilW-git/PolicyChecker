'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { addComment } from '../actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="px-5 py-2 bg-[var(--color-accent)] text-white font-medium rounded-lg hover:opacity-90 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Wyślij komentarz
    </button>
  )
}

export default function CommentForm({ 
  requestId, 
  showInternalOption 
}: { 
  requestId: string
  showInternalOption: boolean
}) {
  const formRef = useRef<HTMLFormElement>(null)

  const handleAction = async (formData: FormData) => {
    try {
      await addComment(requestId, formData)
      toast.success('Komentarz został pomyślnie dodany.')
      formRef.current?.reset()
    } catch (e: any) {
      toast.error('Wystąpił błąd podczas dodawania komentarza: ' + e.message)
    }
  }

  return (
    <form ref={formRef} action={handleAction} className="pt-4 border-t border-slate-100">
      <textarea 
        name="content" 
        required 
        rows={3} 
        placeholder="Dodaj komentarz..." 
        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none mb-3 text-black"
      ></textarea>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {showInternalOption ? (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="isInternal" value="true" className="w-4 h-4 rounded border-slate-300" />
            Komentarz wewnętrzny (tylko dla recenzentów)
          </label>
        ) : <div />}
        <SubmitButton />
      </div>
    </form>
  )
}
