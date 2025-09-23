'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import CalendarView from '@/components/CalendarView'
import { getEntityDetails, Club } from '@/lib/database'
import Image from 'next/image'

interface ClubCalendarContentProps {
  clubId: string
}

function ClubCalendarContent({ clubId }: ClubCalendarContentProps) {
  const searchParams = useSearchParams()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  // Get URL parameters and convert to filters format
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')
  const visibility = searchParams.get('visibility') as 'public' | 'private' | 'internal-use' | null
  const showFilters = searchParams.get('showFilters') !== 'false' // Default to true unless explicitly false
  const returnUrlParam = searchParams.get('returnUrl') // Allow manual return URL specification

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

  // Load club details and set up return URL
  useEffect(() => {
    const loadClubAndReturnUrl = async () => {
      setLoading(true)
      try {
        // Load club details
        const clubData = await getEntityDetails('club', clubId) as Club
        setClub(clubData)

        // Set return URL from referrer or parameter
        if (typeof window !== 'undefined') {
          // First try manual return URL parameter
          if (returnUrlParam) {
            console.log('Setting return URL from parameter:', decodeURIComponent(returnUrlParam))
            setReturnUrl(decodeURIComponent(returnUrlParam))
          } 
          // Then try document referrer
          else if (document.referrer && document.referrer !== window.location.href) {
            console.log('Setting return URL from referrer:', document.referrer)
            setReturnUrl(document.referrer)
          } else {
            console.log('No return URL found. Referrer:', document.referrer, 'Current URL:', window.location.href)
          }
        }
      } catch (error) {
        console.error('Error loading club details:', error)
      } finally {
        setLoading(false)
      }
    }

    loadClubAndReturnUrl()
  }, [clubId, returnUrlParam])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Custom Header */}
      <header className="bg-red-600 text-white border-b-4 border-red-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Kin Logo */}
            <div className="flex-shrink-0">
              <Image
                src="/kin-logo.png"
                alt="Kin Logo"
                width={48}
                height={48}
                className="bg-white rounded p-1"
              />
            </div>
            
            {/* Club Name and Page Title */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {club?.name || 'Club'} Calendar
              </h1>
              {club && (
                <p className="text-red-100 text-sm mt-1">
                  {club.city} • {club.club_type}
                </p>
              )}
            </div>

            {/* Return Link */}
            {returnUrl && (
              <div className="flex-shrink-0">
                <a
                  href={returnUrl}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  ← Back to {club?.name || 'Club'} Website
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Calendar Content */}
      <div className="p-4">
        <CalendarView 
          filters={filters} 
          showFilters={showFilters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t p-4 text-center">
        <p className="text-sm text-gray-600">
          Powered by <a href="/" className="text-red-600 hover:underline" target="_blank">Kin Calendar</a>
        </p>
      </div>
    </div>
  )
}

export default function ClubCalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    }>
      <ClubCalendarWrapper />
    </Suspense>
  )
}

function ClubCalendarWrapper() {
  const params = useParams()
  const clubId = params.clubId as string

  if (!clubId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Club not found</h1>
          <p className="text-gray-600">Invalid club ID provided.</p>
        </div>
      </div>
    )
  }

  return <ClubCalendarContent clubId={clubId} />
}
