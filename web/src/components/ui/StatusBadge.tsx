import { requestStatusLabel } from '@/lib/labels'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  const isApproved = status === 'APPROVED' || status === 'AUTO_APPROVED'
  const isRejected = status === 'REJECTED'
  const isPending = status === 'IN_REVIEW' || status === 'NEEDS_INFORMATION'
  
  const baseClasses = `inline-flex items-center justify-center text-center rounded-full font-medium ${className}`
  
  const sizeClasses = size === 'sm' 
    ? 'px-2.5 py-1 text-xs' 
    : 'px-3 py-1.5 text-sm font-semibold'
    
  const colorClasses = isApproved 
    ? 'bg-emerald-500/10 text-emerald-700' 
    : isRejected 
      ? 'bg-red-500/10 text-red-700' 
      : isPending 
        ? 'bg-amber-500/10 text-amber-700' 
        : 'bg-slate-500/10 text-slate-700'

  return (
    <span className={`${baseClasses} ${sizeClasses} ${colorClasses}`}>
      {requestStatusLabel(status)}
    </span>
  )
}
