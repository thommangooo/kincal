'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { getAnnouncements, Announcement, getEntityDetails, Club } from '@/lib/database'
import { generateClubColor } from '@/lib/colors'
import { Megaphone, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'

interface ClubAnnouncementsContentProps {
  clubId: string
}

function ClubAnnouncementsContent({ clubId }: ClubAnnouncementsContentProps) {
  const searchParams = useSearchParams()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtersCollapsed, setFiltersCollapsed] = useState(true)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  // Get URL parameters
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')
  const visibility = searchParams.get('visibility') as 'public' | 'private' | null
  const showFilters = searchParams.get('showFilters') !== 'false' // Default to true unless explicitly false
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
  const returnUrlParam = searchParams.get('returnUrl') // Allow manual return URL specification

  // Load club details, announcements, and set up return URL
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load club details
        const clubData = await getEntityDetails('club', clubId) as Club
        setClub(clubData)

        // Set return URL from referrer or parameter
        if (typeof window !== 'undefined') {
          // First try manual return URL parameter
          if (returnUrlParam) {
            setReturnUrl(decodeURIComponent(returnUrlParam))
          } 
          // Then try document referrer
          else if (document.referrer && document.referrer !== window.location.href) {
            setReturnUrl(document.referrer)
          }
        }

        // Load announcements
        const announcementFilters = {
          ...(clubId && { clubId }),
          ...(zoneId && { zoneId }),
          ...(districtId && { districtId }),
          ...(visibility && { visibility }),
          limit,
          includeExpired: false
        }
        
        const announcementsData = await getAnnouncements(announcementFilters)
        setAnnouncements(announcementsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clubId, zoneId, districtId, visibility, limit, returnUrlParam])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
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
                {club?.name || 'Club'} Announcements
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

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 border-b">
          <div className="flex items-center justify-between p-4">
            <h3 className="text-sm font-medium text-gray-700">Active Filters</h3>
            <button
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={filtersCollapsed ? 'Show filters' : 'Hide filters'}
            >
              {filtersCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className={`transition-all duration-300 ease-in-out ${
            filtersCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-screen opacity-100'
          }`}>
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2 text-sm">
                {clubId && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Club Filter</span>}
                {zoneId && <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Zone Filter</span>}
                {districtId && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">District Filter</span>}
                {visibility && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">{visibility} announcements</span>}
                {limit && <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">Limit: {limit}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
            <p className="text-gray-500">No announcements match your current filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map(announcement => {
              const clubColor = announcement.entity_id ? generateClubColor(announcement.entity_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500', bgStyle: 'background-color: #f3f4f6', textStyle: 'color: #1f2937', borderStyle: 'background-color: #6b7280' }
              
              return (
                <article key={announcement.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* Title */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">{announcement.title}</h2>
                  
                  {/* Image */}
                  {announcement.image_url && (
                    <div className="mb-4">
                      <Image
                        src={announcement.image_url}
                        alt={announcement.title}
                        width={800}
                        height={400}
                        className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div 
                    className="prose max-w-none text-gray-700 mb-4"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />

                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-t pt-4">
                    {/* Publish Date */}
                    <div className="flex items-center">
                      <span>Published: {new Date(announcement.publish_date).toLocaleDateString()}</span>
                    </div>

                    {/* Club */}
                    {announcement.club && (
                      <span className={`px-2 py-1 rounded text-xs ${clubColor.bg} ${clubColor.text} ${clubColor.border} border`}>
                        {announcement.club.name}
                      </span>
                    )}

                    {/* Expiry Date */}
                    {announcement.expiry_date && (
                      <span>Expires: {new Date(announcement.expiry_date).toLocaleDateString()}</span>
                    )}

                    {/* Priority */}
                    {announcement.priority > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        Priority: {announcement.priority}
                      </span>
                    )}

                    {/* Visibility */}
                    <span className={`px-2 py-1 rounded text-xs ${
                      announcement.visibility === 'public' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {announcement.visibility === 'public' ? 'Public' : 'Internal'}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
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

export default function ClubAnnouncementsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    }>
      <ClubAnnouncementsWrapper />
    </Suspense>
  )
}

function ClubAnnouncementsWrapper() {
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

  return <ClubAnnouncementsContent clubId={clubId} />
}
