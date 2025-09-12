'use client'

import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import SignInForm from '@/components/SignInForm'
import { Users } from 'lucide-react'

export default function SignInPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    // Redirect to home page if already signed in
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h1>
              <p className="text-gray-600">
                Enter your email address to edit Kin Calendar
              </p>
            </div>
            
            <SignInForm />
          </div>
        </div>
      </main>
    </div>
  )
}
