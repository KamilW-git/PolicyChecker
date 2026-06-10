'use client'

import { deletePolicyAction } from './actions'

export default function DeletePolicyButton({ policyId }: { policyId: string }) {
  return (
    <form action={async () => {
      if (window.confirm('Czy na pewno chcesz trwale usunąć tę politykę biznesową? Ta operacja jest nieodwracalna.')) {
        await deletePolicyAction(policyId).catch(err => alert(err.message))
      }
    }}>
      <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm transition shadow-sm">
        Usuń Politykę
      </button>
    </form>
  )
}
