'use client'

import { SessionProvider } from 'next-auth/react'
import DashboardNav from '@/components/layout/DashboardNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-gray-100">
        <DashboardNav />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
