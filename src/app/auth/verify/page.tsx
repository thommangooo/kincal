'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleVerify = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        const redirectTo = searchParams.get('redirect_to')

        if (!token || type !== 'magiclink') {
          router.push('/signin?error=invalid_token')
          return
        }

        // Exchange the token for a session
        // Supabase's verify endpoint should have already processed this,
        // but we'll verify the session exists
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          router.push('/signin?error=auth_failed')
          return
        }

        if (session) {
          // User is authenticated, redirect appropriately
          if (redirectTo && redirectTo !== '*' && redirectTo.startsWith('http')) {
            // If there's a valid redirect URL, use it
            window.location.href = redirectTo
          } else {
            // Otherwise redirect to home
            router.push('/')
          }
        } else {
          // No session, might need to verify the token
          router.push('/signin?error=no_session')
        }
      } catch (error) {
        console.error('Verify error:', error)
        router.push('/signin?error=auth_failed')
      }
    }

    handleVerify()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your sign in...</p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}


