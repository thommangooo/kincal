'use client'

import Link from 'next/link'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import KinLogo from './KinLogo'

export default function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-4 group">
              <KinLogo size="lg" className="group-hover:scale-105 transition-transform duration-200" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-kin-red">KinCal</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-kin-red transition-colors font-medium"
              >
                Calendar
              </Link>
              <Link 
                href="/announcements" 
                className="text-gray-600 hover:text-kin-red transition-colors font-medium"
              >
                Announcements
              </Link>
              <Link 
                href="/embed" 
                className="text-gray-600 hover:text-kin-red transition-colors font-medium"
              >
                Embed Widget
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 hidden md:block">
                    {user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-gray-600 hover:text-kin-red transition-colors rounded-lg hover:bg-kin-red-light"
                    title="Sign Out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/signin"
                className="inline-flex items-center px-4 py-2 bg-kin-red text-white rounded-lg hover:bg-kin-red-dark transition-colors text-sm font-medium shadow-sm hover:shadow-md"
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
