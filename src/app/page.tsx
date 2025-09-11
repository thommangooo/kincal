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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
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
