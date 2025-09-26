'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { exchangeCodeForToken, getLongLivedToken, getUserPages } from '@/lib/facebook'
import { createSocialMediaAccount } from '@/lib/socialMedia'
import { useAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'

export default function FacebookCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
          setError(`Facebook authentication failed: ${error}`)
          setLoading(false)
          return
        }

        if (!code) {
          setError('No authorization code received from Facebook')
          setLoading(false)
          return
        }

        if (!user?.email) {
          setError('You must be logged in to connect Facebook accounts')
          setLoading(false)
          return
        }

        // Exchange code for access token
        const tokenResponse = await exchangeCodeForToken(code)
        
        // Get long-lived token
        const longLivedToken = await getLongLivedToken(tokenResponse.access_token)
        
        // Get user's Facebook pages
        const pages = await getUserPages(longLivedToken.access_token)
        
        if (pages.length === 0) {
          setError('No Facebook pages found. Please make sure you have admin access to at least one Facebook page.')
          setLoading(false)
          return
        }

        // Parse state to get entity information
        const stateData = state ? JSON.parse(decodeURIComponent(state)) : null
        if (!stateData || !stateData.entity_type || !stateData.entity_id) {
          setError('Invalid state parameter. Please try connecting again.')
          setLoading(false)
          return
        }

        // Create social media account for each page
        const accountPromises = pages.map(page => 
          createSocialMediaAccount({
            entity_type: stateData.entity_type,
            entity_id: stateData.entity_id,
            platform: 'facebook',
            account_id: page.id,
            account_name: page.name,
            page_id: page.id,
            access_token: page.access_token,
            token_expires_at: new Date(Date.now() + (longLivedToken.expires_in * 1000)).toISOString(),
            created_by_email: user.email
          })
        )

        await Promise.all(accountPromises)
        
        setSuccess(true)
        showToastMessage(`Successfully connected ${pages.length} Facebook page(s)!`)
        
        // Redirect back to the entity management page
        setTimeout(() => {
          router.push(`/users?entity=${stateData.entity_type}&id=${stateData.entity_id}`)
        }, 2000)

      } catch (err) {
        console.error('Facebook callback error:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        setLoading(false)
      }
    }

    handleCallback()
  }, [searchParams, user, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Connecting to Facebook...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/users')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Successfully Connected!</h1>
              <p className="text-gray-600 mb-6">Your Facebook pages have been connected and you can now post events and announcements directly to Facebook.</p>
              <div className="animate-pulse">
                <p className="text-sm text-gray-500">Redirecting you back...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
