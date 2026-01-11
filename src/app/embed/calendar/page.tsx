'use client'

import { Suspense, useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import CalendarView from '@/components/CalendarView'
import { getEvents } from '@/lib/database'
import { DbEvent } from '@/lib/supabase'

function CalendarEmbedContent() {
  const searchParams = useSearchParams()

  // Get URL parameters and convert to filters format
  const clubId = searchParams.get('club')
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')
  const visibility = searchParams.get('visibility') as 'public' | 'private' | 'internal-use' | null
  const showFilters = searchParams.get('showFilters') !== 'false' // Default to true unless explicitly false
  const includeKinCanadaEventsParam = searchParams.get('includeKinCanadaEvents')
  const includeKinCanadaEvents = includeKinCanadaEventsParam === null 
    ? true // Default to true if not specified
    : includeKinCanadaEventsParam === 'true'

  // Convert visibility parameter to match component expectations
  const visibilityFilter = visibility === 'internal-use' ? 'private' : visibility || 'all'

  // State for filters (can be modified by user if showFilters is true)
  const [filters, setFilters] = useState({
    search: '',
    districtId: districtId || '',
    zoneId: zoneId || '',
    clubId: clubId || '',
    visibility: visibilityFilter as 'all' | 'public' | 'private' | 'internal-use',
    includeKinCanadaEvents
  })

  // State for events
  const [events, setEvents] = useState<DbEvent[]>([])
  const [loading, setLoading] = useState(false)

  // Load events function
  const loadEvents = useCallback(async () => {
    setLoading(true)
    try {
      const eventFilters: {
        clubId?: string
        zoneId?: string
        districtId?: string
        visibility?: 'public' | 'private' | 'internal-use'
        includeKinCanadaEvents?: boolean
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
      // Always pass includeKinCanadaEvents (defaults to true if undefined)
      eventFilters.includeKinCanadaEvents = filters.includeKinCanadaEvents !== undefined 
        ? filters.includeKinCanadaEvents 
        : true

      const eventData = await getEvents(eventFilters)
      setEvents(eventData)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.clubId, filters.zoneId, filters.districtId, filters.visibility, filters.includeKinCanadaEvents])

  // Load events on mount and when filters change
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Wrapper function to handle type conversion between EventFilters and CalendarView
  // Memoize to prevent unnecessary re-renders
  const handleFiltersChange = useCallback(async (newFilters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private' | 'internal-use'
    includeKinCanadaEvents?: boolean
  }) => {
    setFilters(newFilters)
    
    // Load events with new filters
    setLoading(true)
    try {
      const eventFilters: {
        clubId?: string
        zoneId?: string
        districtId?: string
        visibility?: 'public' | 'private' | 'internal-use'
        includeKinCanadaEvents?: boolean
      } = {}
      
      if (newFilters.visibility && newFilters.visibility !== 'all') {
        eventFilters.visibility = newFilters.visibility as 'public' | 'private' | 'internal-use'
      }
      if (newFilters.clubId) {
        eventFilters.clubId = newFilters.clubId
      }
      if (newFilters.zoneId) {
        eventFilters.zoneId = newFilters.zoneId
      }
      if (newFilters.districtId) {
        eventFilters.districtId = newFilters.districtId
      }
      // Always pass includeKinCanadaEvents (defaults to true if undefined)
      eventFilters.includeKinCanadaEvents = newFilters.includeKinCanadaEvents !== undefined 
        ? newFilters.includeKinCanadaEvents 
        : true

      const eventData = await getEvents(eventFilters)
      setEvents(eventData)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle event deletion - reload events
  const handleEventDeleted = useCallback(() => {
    loadEvents()
  }, [loadEvents])

  return (
    <div className="min-h-screen bg-white">
      {/* Calendar Content */}
      <div className="p-0 sm:p-4">
        {loading && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading events...
            </div>
          </div>
        )}
        <CalendarView 
          events={events}
          filters={filters} 
          showFilters={showFilters}
          onFiltersChange={handleFiltersChange}
          onEventDeleted={handleEventDeleted}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t p-4 text-center">
        <p className="text-sm text-gray-600">
          Powered by <a href="/" className="text-blue-600 hover:underline" target="_blank">Kin Calendar</a>
        </p>
      </div>
    </div>
  )
}

export default function CalendarEmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    }>
      <CalendarEmbedContent />
    </Suspense>
  )
}
