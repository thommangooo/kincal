'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getAnnouncements, Announcement } from '@/lib/database'
import AnnouncementCard from '@/components/AnnouncementCard'
import { Megaphone, Copy, Check } from 'lucide-react'

function AnnouncementsEmbedContent() {
  const searchParams = useSearchParams()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const clubId = searchParams.get('club')
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true)
      try {
        const filters = {
          ...(clubId && { clubId }),
          ...(zoneId && { zoneId }),
          ...(districtId && { districtId }),
          visibility: 'public' as const,
          limit,
          includeExpired: false
        }
        
        const announcementsData = await getAnnouncements(filters)
        setAnnouncements(announcementsData)
      } catch (error) {
        console.error('Error loading announcements:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAnnouncements()
  }, [clubId, zoneId, districtId, limit])

  const copyEmbedCode = async () => {
    const embedCode = `<iframe src="${window.location.href}" width="100%" height="600" frameborder="0" style="border: 1px solid #ccc;"></iframe>`
    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Megaphone className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Kin Announcements</h1>
          </div>
          
          <button
            onClick={copyEmbedCode}
            className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
            title="Copy embed code"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
            <p className="text-gray-500">No public announcements match your current filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <AnnouncementCard key={announcement.id} announcement={announcement} showClub={!clubId} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t p-4 text-center">
        <p className="text-sm text-gray-600">
          Powered by <a href="/" className="text-blue-600 hover:underline" target="_blank">Kin Calendar</a>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    }>
      <AnnouncementsEmbedContent />
    </Suspense>
  )
}


