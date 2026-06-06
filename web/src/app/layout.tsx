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
  title: "PolicyChecker MVP",
  description: "Zarządzanie politykami zakupowymi",
};

import { getCurrentUser, logout } from '@/lib/session'
import Link from 'next/link'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser()

  return (
    <html lang="pl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col`}
      >
        <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-lg">✓</span>
                  </div>
                  <span className="font-bold text-xl tracking-tight">PolicyChecker</span>
                </Link>
                
                {user && (
                  <div className="hidden md:flex items-center gap-1">
                    <Link href="/requests" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">Wnioski</Link>
                    <Link href="/policies" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">Polityki</Link>
                    {['AUDITOR', 'ADMIN'].includes(user.role) && (
                      <Link href="/audit" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition">Audyt</Link>
                    )}
                  </div>
                )}
              </div>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{user.role}</div>
                  </div>
                  <form action={async () => {
                    'use server';
                    await logout();
                  }}>
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition" title="Wyloguj się">
                      ✕
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

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
