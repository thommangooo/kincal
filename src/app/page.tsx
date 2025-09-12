'use client'

import { useState } from 'react'
import CalendarView from '@/components/CalendarView'
import Header from '@/components/Header'

export default function Home() {
  const [filters, setFilters] = useState({
    search: '',
    districtId: '',
    zoneId: '',
    clubId: '',
    visibility: 'all' as 'all' | 'public' | 'private'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <CalendarView 
          filters={filters}
          showFilters={true}
          onFiltersChange={setFilters}
        />
      </main>
    </div>
  )
}
