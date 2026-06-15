'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DesktopNav({ userRole }: { userRole: string }) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Pulpit' },
    { href: '/requests', label: 'Wnioski' },
    { href: '/policies', label: 'Polityki' },
  ]

  if (['AUDITOR', 'ADMIN'].includes(userRole)) {
    links.push({ href: '/audit', label: 'Audyt' })
  }

  if (userRole === 'ADMIN') {
    links.push({ href: '/admin/users', label: 'Użytkownicy' })
  }

  return (
    <div className="hidden md:flex items-center gap-1">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
        const isAdminLink = link.href.startsWith('/admin')
        
        return (
          <Link 
            key={link.href}
            href={link.href} 
            className={`px-3 py-2 rounded-md text-sm transition ${
              isActive 
                ? 'text-[var(--color-accent)] font-medium' 
                : isAdminLink 
                  ? 'text-slate-600 hover:text-amber-600'
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </div>
  )
}
