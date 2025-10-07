'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSocialMediaAccounts } from '@/lib/socialMedia'
import Toast from '@/components/Toast'
import { Facebook, MapPin, Clock, ExternalLink, Download } from 'lucide-react'
import Image from 'next/image'

interface FacebookEvent {
  id: string
  title: string
  description: string
  start_time: string
  end_time?: string
  location: string
  cover_image?: string
  facebook_url: string
  source: string
}

interface FacebookEventImporterProps {
  entityType: 'club' | 'zone' | 'district'
  entityId: string
  entityName: string
}

export default function FacebookEventImporter({ entityType, entityId, entityName }: FacebookEventImporterProps) {
  const [accounts, setAccounts] = useState<Array<{
    id: string
    account_name: string
    platform: string
    page_id?: string
  }>>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [events, setEvents] = useState<FacebookEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [importing] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [accountsLoaded, setAccountsLoaded] = useState(false)
  

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  const loadAccounts = useCallback(async () => {
    try {
      console.log('Loading accounts for:', entityName, entityType, entityId)
      const socialAccounts = await getSocialMediaAccounts(entityType, entityId)
      console.log('Found accounts:', socialAccounts)
      setAccounts(socialAccounts)
      setAccountsLoaded(true)
    } catch (error) {
      console.error('Error loading social media accounts:', error)
      showToastMessage('Failed to load Facebook accounts')
      setAccountsLoaded(true)
    }
  }, [entityName, entityType, entityId])

  const fetchFacebookEvents = async () => {
    if (!selectedAccount) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/facebook/events?pageId=${accounts.find(a => a.id === selectedAccount)?.page_id}&accountId=${selectedAccount}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch Facebook events')
      }
      
      const data = await response.json()
      setEvents(data.events || [])
      
      if (data.events.length === 0) {
        showToastMessage('No event-related posts found on this Facebook page')
      } else {
        showToastMessage(data.message || `Found ${data.events.length} event-related posts`)
      }
    } catch (error) {
      console.error('Error fetching Facebook events:', error)
      showToastMessage('Failed to fetch Facebook events')
    } finally {
      setLoading(false)
    }
  }

  const importEvent = (event: FacebookEvent) => {
    // Create announcement data for the form
    const announcementData = {
      title: '', // Leave title blank - Facebook posts don't have separate titles
      description: event.description, // Use the full Facebook post content
      image_url: event.cover_image, // Include any attached image
      event_url: event.facebook_url, // Link back to the original Facebook post
      visibility: 'public' as const,
      entity_type: entityType,
      entity_id: entityId
    }
    
    // Store the announcement data and redirect to announcement creation form
    sessionStorage.setItem('facebookAnnouncementData', JSON.stringify(announcementData))
    window.location.href = `/announcements/create?fromFacebook=true`
  }

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    console.log('Accounts updated:', accounts.length, accounts)
  }, [accounts])

  console.log('FacebookEventImporter rendering for:', entityName, 'accounts:', accounts.length, 'selectedAccount:', selectedAccount, 'accountsLoaded:', accountsLoaded)
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Facebook Posts</h3>
      
      <div className="space-y-4">
        {!accountsLoaded ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading Facebook accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-4">
            <Facebook className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">No Facebook pages connected for {entityName}.</p>
            <p className="text-xs text-gray-500">Connect a Facebook page in the &quot;Social Media Management&quot; section below to import posts.</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Facebook Page
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a Facebook page...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedAccount && (
          <div className="flex space-x-2">
            <button
              onClick={fetchFacebookEvents}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <Facebook className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Loading...' : 'Fetch Posts'}
            </button>
          </div>
        )}

        {events.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Found {events.length} event-related post(s)
            </h4>
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 mb-2">{event.title}</h5>
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString()}
                        </div>
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <a
                        href={event.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                        title="View on Facebook"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                      <button
                        onClick={() => importEvent(event)}
                        disabled={importing === event.id}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {importing === event.id ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                               {importing === event.id ? 'Creating...' : 'Create Announcement'}
                      </button>
                    </div>
                  </div>
                  {event.cover_image && (
                    <div className="mt-3">
                         <Image
                           src={event.cover_image}
                           alt={event.title}
                           width={400}
                           height={128}
                           className="w-full h-32 object-cover rounded-md"
                         />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Toast 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  )
}