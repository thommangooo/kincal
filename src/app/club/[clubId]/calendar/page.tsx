'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import CalendarView from '@/components/CalendarView'
import { getEntityDetails, getEvents, Club } from '@/lib/database'
import { DbEvent } from '@/lib/supabase'
import Image from 'next/image'

interface ClubCalendarContentProps {
  clubId: string
}

function ClubCalendarContent({ clubId }: ClubCalendarContentProps) {
  const searchParams = useSearchParams()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  // Get URL parameters and convert to filters format
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')
  const visibility = searchParams.get('visibility') as 'public' | 'private' | 'internal-use' | null
  const showFilters = searchParams.get('showFilters') !== 'false' // Default to true unless explicitly false
  const returnUrlParam = searchParams.get('returnUrl') // Allow manual return URL specification

  // Convert visibility parameter to match component expectations
  const visibilityFilter = visibility === 'internal-use' ? 'private' : visibility || 'all'

  // State for filters (can be modified by user if showFilters is true)
  const [filters, setFilters] = useState({
    search: '',
    districtId: districtId || '',
    zoneId: zoneId || '',
    clubId: clubId || '',
    visibility: visibilityFilter as 'all' | 'public' | 'private' | 'internal-use'
  })

  // State for events
  const [events, setEvents] = useState<DbEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  // Load events function - use individual filter values as dependencies
  const loadEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const eventFilters: {
        clubId?: string
        zoneId?: string
        districtId?: string
        visibility?: 'public' | 'private' | 'internal-use'
      } = {}
      
      if (filters.visibility && filters.visibility !== 'all') {
        eventFilters.visibility = filters.visibility as 'public' | 'private' | 'internal-use'
      }
      if (filters.clubId) {
        eventFilters.clubId = filters.clubId
      }
      if (filters.zoneId) {
        eventFilters.zoneId = filters.zoneId
      }
      if (filters.districtId) {
        eventFilters.districtId = filters.districtId
      }

      const eventData = await getEvents(eventFilters)
      setEvents(eventData)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setEventsLoading(false)
    }
  }, [filters.clubId, filters.zoneId, filters.districtId, filters.visibility])

  // Load events when filter values change
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Set up return URL immediately (don't wait for club loading)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // First try manual return URL parameter
      // Note: Next.js searchParams.get() does NOT decode, so we must decode manually
      if (returnUrlParam) {
        const decodedUrl = decodeURIComponent(returnUrlParam)
        console.log('Setting return URL from parameter:', returnUrlParam, '→', decodedUrl)
        setReturnUrl(decodedUrl)
      } 
      // Then try document referrer
      else if (document.referrer && document.referrer !== window.location.href) {
        console.log('Setting return URL from referrer:', document.referrer)
        setReturnUrl(document.referrer)
      } else {
        console.log('No return URL found. Referrer:', document.referrer, 'Current URL:', window.location.href)
      }
    }
  }, [returnUrlParam])

  // Load club details
  useEffect(() => {
    const loadClub = async () => {
      setLoading(true)
      try {
        const clubData = await getEntityDetails('club', clubId) as Club
        setClub(clubData)
      } catch (error) {
        console.error('Error loading club details:', error)
      } finally {
        setLoading(false)
      }
    }

    loadClub()
  }, [clubId])

  // Wrapper function to handle type conversion between EventFilters and CalendarView
  // Only update if filters actually changed to prevent infinite loops
  const handleFiltersChange = useCallback((newFilters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private' | 'internal-use'
  }) => {
    setFilters(prevFilters => {
      // Only update if something actually changed
      if (
        prevFilters.search === newFilters.search &&
        prevFilters.districtId === newFilters.districtId &&
        prevFilters.zoneId === newFilters.zoneId &&
        prevFilters.clubId === newFilters.clubId &&
        prevFilters.visibility === newFilters.visibility
      ) {
        return prevFilters // No change, return same object to prevent re-render
      }
      return newFilters
    })
  }, [])

  if (loading || (eventsLoading && events.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Header */}
      <header className="bg-red-600 text-white border-b-4 border-red-700 relative z-50">
        <div className="container mx-auto px-2 sm:px-4 py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left side: Logo and Club Name */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {/* Kin Logo */}
              <div className="flex-shrink-0">
                <Image
                  src="/kin-logo.png"
                  alt="Kin Logo"
                  width={48}
                  height={48}
                  className="bg-white rounded p-1"
                />
              </div>
              
              {/* Club Name and Page Title */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold truncate">
                  {club?.name || 'Club'} Calendar
                </h1>
                {club && (
                  <p className="text-red-100 text-xs sm:text-sm mt-1 truncate">
                    {club.city} • {club.club_type}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Return Link */}
            {returnUrl && (
              <div className="flex-shrink-0">
                <button
                  onClick={() => window.location.href = returnUrl}
                  style={{
                    color: '#000000',
                    border: '1px solid #cccccc',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to {club?.name || 'Club'} Website
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Calendar Content */}
      <div className="p-0 sm:p-4 relative z-10">
        <CalendarView 
          events={events}
          filters={filters} 
          showFilters={showFilters}
          onFiltersChange={handleFiltersChange}
          onEventDeleted={loadEvents}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t p-4 text-center">
        <p className="text-sm text-gray-600">
          Powered by <a href="/" className="text-red-600 hover:underline" target="_blank">Kin Calendar</a>
        </p>
      </div>
    </div>
  )
}

export default function ClubCalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    }>
      <ClubCalendarWrapper />
    </Suspense>
  )
}

function ClubCalendarWrapper() {
  const params = useParams()
  const clubId = params.clubId as string

  if (!clubId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Club not found</h1>
          <p className="text-gray-600">Invalid club ID provided.</p>
        </div>
      </div>
    )
  }

  return <ClubCalendarContent clubId={clubId} />
}
