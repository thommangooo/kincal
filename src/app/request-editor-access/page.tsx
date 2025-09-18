'use client'

import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import EditorRequestForm from '@/components/EditorRequestForm'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Users, ArrowLeft } from 'lucide-react'

export default function RequestEditorAccessPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to home page
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

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
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back to sign in link */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/signin')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add My Kin Club</h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              Request to add your Kin club, zone, or district to the calendar system.
              Your request will be reviewed by an administrator.
            </p>
          </div>

          {/* Form */}
          <EditorRequestForm 
            onSuccess={() => {
              // Optionally redirect after successful submission
              // router.push('/signin')
            }}
            onCancel={() => router.push('/signin')}
          />

          {/* Additional info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your request will be reviewed by a system administrator</li>
              <li>• You&apos;ll receive an email notification once your request is processed</li>
              <li>• If approved, you&apos;ll be able to sign in and manage content for your selected entity</li>
              <li>• You can only submit one request per day</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

