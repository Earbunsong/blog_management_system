'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Home,
  FileText,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  FolderOpen,
  Tag,
  MessageSquare,
  Image
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Posts', href: '/dashboard/posts', icon: FileText },
  { name: 'Categories', href: '/dashboard/categories', icon: FolderOpen },
  { name: 'Tags', href: '/dashboard/tags', icon: Tag },
  { name: 'Comments', href: '/dashboard/comments', icon: MessageSquare },
  { name: 'Media', href: '/dashboard/media', icon: Image },
  { name: 'Profile', href: '/dashboard/profile', icon: Settings },
]

const adminNavItems = [
  { name: 'Admin Panel', href: '/admin', icon: Users },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAdmin = session?.user?.role === 'ADMIN'

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <nav className="bg-gray-800 text-white w-64 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
          <Home className="w-6 h-6" />
          <span>Blog CMS</span>
        </Link>
        {session?.user && (
          <div className="mt-4 text-sm text-gray-300">
            <p className="font-medium">{session.user.username}</p>
            <p className="text-xs capitalize">{session.user.role.toLowerCase()}</p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="border-t border-gray-700 my-4"></div>
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors mt-auto"
      >
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    </nav>
  )
}
