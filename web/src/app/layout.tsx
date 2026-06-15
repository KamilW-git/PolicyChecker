import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PolicyChecker",
  description: "Zarządzanie politykami zakupowymi",
};

import { getCurrentUser, logout } from '@/lib/session'
import Link from 'next/link'
import { roleLabel } from '@/lib/labels'
import DesktopNav from '@/components/DesktopNav'
import MobileNav from '@/components/MobileNav'
import { LogOut, ShieldCheck } from 'lucide-react'
import { Toaster } from 'sonner'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser()

  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F5F5F7] text-slate-900 min-h-screen flex flex-col`}
      >
        <nav className="bg-[#F5F5F7]/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                  <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center">
                    <ShieldCheck size={20} strokeWidth={2} className="text-white" />
                  </div>
                  <span className="font-bold text-xl tracking-tight hidden sm:block text-[var(--color-foreground)]">PolicyChecker</span>
                </Link>
                
                {user && <DesktopNav userRole={user.role} />}
              </div>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium truncate max-w-[120px] sm:max-w-xs text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500 font-mono hidden sm:block">{roleLabel(user.role)}</div>
                  </div>
                  <form action={async () => {
                    'use server';
                    await logout();
                  }}>
                    <button className="p-2 text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-2" title="Wyloguj się">
                      <span className="hidden md:inline text-sm font-medium">Wyloguj</span>
                      <LogOut className="md:hidden" size={20} aria-label="Wyloguj" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <form action={async () => {
                    'use server';
                    await logout();
                  }}>
                    <button className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg transition text-sm font-medium" title="Wyczyść starą sesję i zaloguj się">
                      Zaloguj się
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </nav>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 bg-[#F5F5F7]">
          {children}
        </main>

        {user && <MobileNav userRole={user.role} />}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
