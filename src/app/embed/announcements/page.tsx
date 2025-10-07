'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAnnouncements, Announcement } from '@/lib/database'
import { generateClubColor } from '@/lib/colors'
import { Megaphone, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'

function AnnouncementsEmbedContent() {
  const searchParams = useSearchParams()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersCollapsed, setFiltersCollapsed] = useState(true)

  // Get URL parameters
  const clubId = searchParams.get('club')
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')
  const visibility = searchParams.get('visibility') as 'public' | 'private' | null
  const showFilters = searchParams.get('showFilters') !== 'false' // Default to true unless explicitly false
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true)
      try {
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
        console.error('Error loading announcements:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnnouncements()
  }, [clubId, zoneId, districtId, visibility, limit])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
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
                <article key={announcement.id} className="announcement-card border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
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
          Powered by <a href="/" className="text-green-600 hover:underline" target="_blank">Kin Calendar</a>
        </p>
      </div>
    </div>
  )
}

export default function AnnouncementsEmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    }>
      <AnnouncementsEmbedContent />
    </Suspense>
  )
}
