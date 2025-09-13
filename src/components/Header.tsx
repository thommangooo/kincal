'use client'

import Link from 'next/link'
import { LogOut, User, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserRole } from '@/lib/database'
import KinLogo from './KinLogo'
import { useState, useEffect } from 'react'

export default function Header() {
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<{ role: 'superuser' | 'editor' } | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const loadUserRole = async () => {
      if (user?.email) {
        const role = await getUserRole(user.email)
        setUserRole(role)
      }
    }
    loadUserRole()
  }, [user])

  return (
    <header className="bg-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <KinLogo size="lg" className="group-hover:scale-105 transition-transform duration-200" />
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold text-kin-red">KinCal</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
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
              href="/widgets" 
              className="text-gray-600 hover:text-kin-red transition-colors font-medium"
            >
              Widgets
            </Link>
            <Link 
              href="/about" 
              className="text-gray-600 hover:text-kin-red transition-colors font-medium"
            >
              About
            </Link>
            {userRole?.role === 'superuser' && (
              <Link 
                href="/users" 
                className="text-gray-600 hover:text-kin-red transition-colors font-medium"
              >
                Users
              </Link>
            )}
          </nav>
          
          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <span className="text-xs text-gray-600 truncate max-w-24">
                {user.email}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-kin-red transition-colors rounded-lg hover:bg-kin-red-light"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2 pt-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-kin-red transition-colors font-medium py-2 px-2 rounded-lg hover:bg-kin-red-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                Calendar
              </Link>
              <Link 
                href="/announcements" 
                className="text-gray-600 hover:text-kin-red transition-colors font-medium py-2 px-2 rounded-lg hover:bg-kin-red-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                Announcements
              </Link>
              <Link 
                href="/widgets" 
                className="text-gray-600 hover:text-kin-red transition-colors font-medium py-2 px-2 rounded-lg hover:bg-kin-red-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                Widgets
              </Link>
              <Link 
                href="/about" 
                className="text-gray-600 hover:text-kin-red transition-colors font-medium py-2 px-2 rounded-lg hover:bg-kin-red-light"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              {userRole?.role === 'superuser' && (
                <Link 
                  href="/users" 
                  className="text-gray-600 hover:text-kin-red transition-colors font-medium py-2 px-2 rounded-lg hover:bg-kin-red-light"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Users
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="text-left text-gray-600 hover:text-kin-red transition-colors font-medium py-2 px-2 rounded-lg hover:bg-kin-red-light flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/signin"
                  className="inline-flex items-center px-4 py-2 bg-kin-red text-white rounded-lg hover:bg-kin-red-dark transition-colors text-sm font-medium shadow-sm hover:shadow-md mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-1" />
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
