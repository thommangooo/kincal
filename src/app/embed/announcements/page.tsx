'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAnnouncements, Announcement } from '@/lib/database'
import { Megaphone } from 'lucide-react'
import Image from 'next/image'

// Generate consistent colors for clubs
const generateClubColor = (clubId: string): { bg: string; text: string; border: string } => {
  let hash = 0
  for (let i = 0; i < clubId.length; i++) {
    const char = clubId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  ]
  
  const colorIndex = Math.abs(hash) % colors.length
  return colors[colorIndex]
}

function AnnouncementsEmbedContent() {
  const searchParams = useSearchParams()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

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
      {/* Header */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Megaphone className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Kin Announcements</h1>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 border-b p-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {clubId && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Club Filter</span>}
            {zoneId && <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Zone Filter</span>}
            {districtId && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">District Filter</span>}
            {visibility && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">{visibility} announcements</span>}
            {limit && <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">Limit: {limit}</span>}
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
              const clubColor = announcement.club_id ? generateClubColor(announcement.club_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
              
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
