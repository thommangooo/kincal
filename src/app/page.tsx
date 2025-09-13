'use client'

import CalendarView from '@/components/CalendarView'
import Header from '@/components/Header'
import { useFilters } from '@/contexts/FilterContext'

export default function Home() {
  const { filters, setFilters, clearFilters } = useFilters()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-8">
        <CalendarView 
          filters={filters}
          showFilters={true}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />
      </main>
    </div>
  )
}
