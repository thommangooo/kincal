'use client'

import Link from 'next/link'
import { Plus, Calendar, LogOut, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Kin Calendar</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Calendar
              </Link>
              <Link 
                href="/events" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                All Events
              </Link>
              <Link 
                href="/embed" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Embed Widget
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    href="/events/create"
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Event
                  </Link>
                  <Link
                    href="/announcements/create"
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Announcement
                  </Link>
                </div>
                
                <div className="md:hidden">
                  <Link
                    href="/events/create"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Link>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 hidden md:block">
                    {user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/signin"
                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <User className="h-4 w-4 mr-1" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
