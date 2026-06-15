import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-end mb-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">{title}</h1>
        {description && (
          <p className="text-[var(--color-text-secondary)] mt-2">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}
