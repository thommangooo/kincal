'use client'

import { useCallback } from 'react'
import AnnouncementsList from '@/components/AnnouncementsList'
import Header from '@/components/Header'
import { useFilters } from '@/contexts/FilterContext'

export default function AnnouncementsPage() {
  const { filters, setFilters, clearFilters } = useFilters()

  // Wrapper function to handle type conversion between EventFilters and AnnouncementsList
  const handleFiltersChange = useCallback((newFilters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private' | 'internal-use'
  }) => {
    setFilters({
      ...newFilters,
      visibility: newFilters.visibility
    })
  }, [setFilters])

  // Convert global filters to announcements format
  const announcementsFilters = {
    ...filters,
    visibility: filters.visibility === 'private' ? 'internal-use' : filters.visibility
  } as {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'internal-use'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-8">
        <AnnouncementsList 
          filters={announcementsFilters}
          showFilters={true}
          onFiltersChange={handleFiltersChange}
          onClearFilters={clearFilters}
        />
      </main>
    </div>
  )
}
