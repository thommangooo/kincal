'use client'

import { useState, useEffect } from 'react'
import { getSocialMediaAccounts, deactivateSocialMediaAccount } from '@/lib/socialMedia'
import { useAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'
import { Facebook, Instagram, Trash2, Share2, ExternalLink } from 'lucide-react'

interface SocialMediaManagerProps {
  entityType: 'club' | 'zone' | 'district'
  entityId: string
  entityName: string
}

export default function SocialMediaManager({ entityType, entityId, entityName }: SocialMediaManagerProps) {
  console.log('SocialMediaManager rendered for:', entityName, entityType, entityId)
  
  const [accounts, setAccounts] = useState<Array<{
    id: string
    account_name: string
    platform: string
    page_id?: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  
  const { user } = useAuth()

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  useEffect(() => {
    loadAccounts()
  }, [entityType, entityId])

  useEffect(() => {
    // Check for success/error messages from Facebook OAuth
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const pages = urlParams.get('pages')
    const state = urlParams.get('state')
    const pagesData = urlParams.get('pagesData')
    
    console.log('SocialMediaManager useEffect for', entityName, ':', {
      success,
      error,
      pages,
      state,
      pagesData: pagesData ? 'SET' : 'NOT SET',
      url: window.location.href
    })
    
    // Only process if we have callback parameters
    if (success || error) {
      console.log('Facebook callback parameters:', {
        success,
        error,
        pages,
        state,
        pagesData: pagesData ? 'SET' : 'NOT SET',
        url: window.location.href
      })
      
      if (success === 'facebook_connected' && pages && state) {
        // We need to complete the account creation
        handleFacebookCallback(state, pages)
        // Clean up the URL immediately to prevent re-processing
        window.history.replaceState({}, '', window.location.pathname)
      } else if (error) {
        showToastMessage(`Facebook connection failed: ${error}`)
        // Clean up the URL
        window.history.replaceState({}, '', window.location.pathname)
      } else if (success === 'facebook_connected') {
        // Fallback: if we have success but missing other params, show a message
        showToastMessage('Facebook connection successful, but some data may be missing')
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, []) // Empty dependency array to run only once

  const handleFacebookCallback = async (state: string, pages: string) => {
    try {
      const stateData = JSON.parse(decodeURIComponent(state))
      
      // Get the pages data from the URL
      const urlParams = new URLSearchParams(window.location.search)
      const pagesDataParam = urlParams.get('pagesData')
      
      console.log('handleFacebookCallback called with:', {
        state: stateData,
        pages,
        pagesDataParam: pagesDataParam ? 'SET' : 'NOT SET'
      })
      
      if (pagesDataParam) {
        const pagesData = JSON.parse(decodeURIComponent(pagesDataParam))
        
        console.log('Pages data:', pagesData)
        
        // Use server-side API to create accounts (avoids encryption key mismatch)
        const response = await fetch('/api/social-media/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pagesData: pagesData,
            entityType: stateData.entity_type,
            entityId: stateData.entity_id,
            userEmail: user?.email
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          showToastMessage(result.message)
        } else {
          const error = await response.json()
          showToastMessage(`Error: ${error.error}`)
        }
      } else {
        console.log('No pagesData parameter found')
        showToastMessage(`Successfully connected ${pages} Facebook page(s)!`)
      }
      
      // Reload accounts to show the new connections
      loadAccounts()
    } catch (error) {
      console.error('Error handling Facebook callback:', error)
      showToastMessage('Error processing Facebook connection')
    }
  }

  const loadAccounts = async () => {
    try {
      const socialAccounts = await getSocialMediaAccounts(entityType, entityId)
      setAccounts(socialAccounts)
    } catch (error) {
      console.error('Error loading social media accounts:', error)
      showToastMessage('Failed to load social media accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectFacebook = async () => {
    if (!user?.email) {
      showToastMessage('You must be logged in to connect social media accounts')
      return
    }

    setConnecting(true)
    try {
      // Create state parameter with entity information
      const state = encodeURIComponent(JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName
      }))

      // Use the API route instead of calling the function directly
      window.location.href = `/api/auth/facebook?state=${state}`
    } catch (error) {
      console.error('Error initiating Facebook connection:', error)
      showToastMessage('Failed to start Facebook connection')
      setConnecting(false)
    }
  }

  const handleDisconnectAccount = async (accountId: string, accountName: string): Promise<void> => {
    if (!confirm(`Are you sure you want to disconnect ${accountName}? This will prevent future posts to this account.`)) {
      return
    }

    try {
      await deactivateSocialMediaAccount(accountId)
      showToastMessage('Account disconnected successfully')
      loadAccounts() // Reload the list
    } catch (error) {
      console.error('Error disconnecting account:', error)
      showToastMessage('Failed to disconnect account')
    }
  }

  const getPlatformIcon = (platform: string): React.ReactElement => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-5 w-5 text-blue-600" />
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-600" />
      default:
        return <ExternalLink className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (account: { error_count?: number }) => {
    if ((account.error_count ?? 0) > 3) return 'text-red-600'
    if ((account.error_count ?? 0) > 0) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusText = (account: { error_count?: number }) => {
    if ((account.error_count ?? 0) > 3) return 'Connection issues'
    if ((account.error_count ?? 0) > 0) return 'Some errors'
    return 'Connected'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading social media accounts...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{entityName}</h3>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <Share2 className="h-6 w-6 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Social Media Accounts</h4>
            <button
              onClick={handleConnectFacebook}
              disabled={connecting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {connecting ? 'Connecting...' : (accounts.length === 0 ? 'Connect Your First Account' : 'Connect Another Account')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account: {
              id: string
              account_name: string
              platform: string
              page_id?: string
            }) => (
              <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(account.platform)}
                  <div>
                    <h4 className="font-medium text-gray-900">{account.account_name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{account.platform}</p>
                    <p className={`text-xs ${getStatusColor({ error_count: 0 })}`}>
                      {getStatusText({ error_count: 0 })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDisconnectAccount(account.id, account.account_name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Disconnect account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Add Another Account Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleConnectFacebook}
                disabled={connecting}
                className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Facebook className="h-4 w-4 mr-2" />
                {connecting ? 'Connecting...' : 'Connect Another Account'}
              </button>
            </div>
          </div>
        )}

      </div>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
