'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CalendarView from '@/components/CalendarView'

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
    visibility: visibilityFilter as 'all' | 'public' | 'private' | 'internal-use'
  })

  // Wrapper function to handle type conversion between EventFilters and CalendarView
  const handleFiltersChange = (newFilters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private' | 'internal-use'
  }) => {
    setFilters(newFilters)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Calendar Content */}
      <div className="p-0 sm:p-4">
        <CalendarView 
          filters={filters} 
          showFilters={showFilters}
          onFiltersChange={handleFiltersChange}
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
