'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Shield, ClipboardList, Settings } from 'lucide-react'

export default function MobileNav({ userRole }: { userRole: string }) {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Pulpit', icon: Home },
    { href: '/requests', label: 'Wnioski', icon: FileText },
    { href: '/policies', label: 'Polityki', icon: Shield },
  ]

  if (['AUDITOR', 'ADMIN'].includes(userRole)) {
    links.push({ href: '/audit', label: 'Audyt', icon: ClipboardList })
  }

  if (userRole === 'ADMIN') {
    links.push({ href: '/admin/users', label: 'Admin', icon: Settings })
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
          const Icon = link.icon
          
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition ${
                isActive ? 'text-[var(--color-accent)]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
