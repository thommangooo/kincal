'use client'

import { useState } from 'react'
import CalendarView from '@/components/CalendarView'
import EventFilters from '@/components/EventFilters'
import Header from '@/components/Header'

export default function Home() {
  const [filters, setFilters] = useState({
    search: '',
    districtId: '',
    zoneId: '',
    clubId: '',
    visibility: 'all' as 'all' | 'public' | 'private',
    contentType: 'all' as 'all' | 'events' | 'announcements'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kin Canada Events Calendar
          </h1>
          <p className="text-gray-600">
            Discover and share events across Kin clubs, zones, and districts
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <EventFilters onFiltersChange={setFilters} />
          </div>
          <div className="lg:col-span-3">
            <CalendarView filters={filters} />
          </div>
        </div>
      </main>
    </div>
  )
}
