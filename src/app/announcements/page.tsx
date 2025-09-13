'use client'

import { useState, useCallback } from 'react'
import AnnouncementsList from '@/components/AnnouncementsList'
import Header from '@/components/Header'

export default function AnnouncementsPage() {
  const [filters, setFilters] = useState({
    search: '',
    districtId: '',
    zoneId: '',
    clubId: '',
    visibility: 'all' as 'all' | 'public' | 'internal-use'
  })

  // Wrapper function to handle type conversion between EventFilters and AnnouncementsList
  const handleFiltersChange = useCallback((newFilters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private'
  }) => {
    setFilters({
      ...newFilters,
      visibility: newFilters.visibility === 'private' ? 'internal-use' : newFilters.visibility
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-8">
        <AnnouncementsList 
          filters={filters}
          showFilters={true}
          onFiltersChange={handleFiltersChange}
        />
      </main>
    </div>
  )
}
