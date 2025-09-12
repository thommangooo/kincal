'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CalendarView from '@/components/CalendarView'
import EventFilters from '@/components/EventFilters'
import { Calendar } from 'lucide-react'

function CalendarEmbedContent() {
  const searchParams = useSearchParams()

  // Get URL parameters and convert to filters format
  const clubId = searchParams.get('club')
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')
  const visibility = searchParams.get('visibility') as 'public' | 'private' | 'internal-use' | null
  const showFilters = searchParams.get('showFilters') !== 'false' // Default to true unless explicitly false

  // Convert visibility parameter to match component expectations
  const visibilityFilter = visibility === 'internal-use' ? 'private' : visibility || 'all'

  // State for filters (can be modified by user if showFilters is true)
  const [filters, setFilters] = useState({
    search: '',
    districtId: districtId || '',
    zoneId: zoneId || '',
    clubId: clubId || '',
    visibility: visibilityFilter as 'all' | 'public' | 'private'
  })

  // Wrapper function to handle type conversion between EventFilters and CalendarView
  const handleFiltersChange = (newFilters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private'
  }) => {
    setFilters(newFilters)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Kin Calendar</h1>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-4">
        {showFilters ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <EventFilters onFiltersChange={handleFiltersChange} />
            </div>
            <div className="lg:col-span-3">
              <CalendarView filters={filters} showCreateButton={false} />
            </div>
          </div>
        ) : (
          <CalendarView filters={filters} showCreateButton={false} />
        )}
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
