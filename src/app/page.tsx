'use client'

import { useState, useEffect, useCallback } from 'react'
import CalendarView from '@/components/CalendarView'
import Header from '@/components/Header'
import { useFilters, GlobalFilters } from '@/contexts/FilterContext'
import { getEvents } from '@/lib/database'
import { DbEvent } from '@/lib/supabase'

export default function Home() {
  const { filters, setFilters } = useFilters()
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
        startDate?: Date
        endDate?: Date
        includeZoneEvents?: boolean
        includeClubEvents?: boolean
      } = {}
      
      if (filters) {
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
        if (filters.includeClubEvents !== undefined) {
          eventFilters.includeClubEvents = filters.includeClubEvents
        }
        if (filters.includeZoneEvents !== undefined) {
          eventFilters.includeZoneEvents = filters.includeZoneEvents
        }
      }

      const eventData = await getEvents(eventFilters)
      setEvents(eventData)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Load events on mount and when filters change
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Handle filter changes
  const handleFiltersChange = useCallback(async (newFilters: GlobalFilters) => {
    setFilters(newFilters)
    
    // Load events with new filters immediately
    setLoading(true)
    try {
      const eventFilters: {
        clubId?: string
        zoneId?: string
        districtId?: string
        visibility?: 'public' | 'private' | 'internal-use'
        startDate?: Date
        endDate?: Date
        includeZoneEvents?: boolean
        includeClubEvents?: boolean
      } = {}
      
      if (newFilters) {
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
        if (newFilters.includeClubEvents !== undefined) {
          eventFilters.includeClubEvents = newFilters.includeClubEvents
        }
        if (newFilters.includeZoneEvents !== undefined) {
          eventFilters.includeZoneEvents = newFilters.includeZoneEvents
        }
      }

      const eventData = await getEvents(eventFilters)
      setEvents(eventData)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }, [setFilters])

  // Handle event deletion - reload events
  const handleEventDeleted = useCallback(() => {
    loadEvents()
  }, [loadEvents])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-0 sm:px-4 py-0 sm:py-8">
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
          showFilters={true}
          onFiltersChange={handleFiltersChange}
          onEventDeleted={handleEventDeleted}
        />
      </main>
    </div>
  )
}
