'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getAnnouncements, Announcement } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'
import { Megaphone, Calendar, Users, Globe, Lock, ExternalLink, Plus } from 'lucide-react'
import Image from 'next/image'

interface AnnouncementsListProps {
  filters?: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'internal-use'
  }
}

// Generate consistent colors for clubs (same as CalendarView)
const generateClubColor = (clubId: string): { bg: string; text: string; border: string } => {
  let hash = 0
  for (let i = 0; i < clubId.length; i++) {
    const char = clubId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  const colorIndex = Math.abs(hash) % 8
  
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'bg-blue-500' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'bg-green-500' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'bg-purple-500' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'bg-orange-500' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'bg-pink-500' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'bg-indigo-500' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'bg-teal-500' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'bg-amber-500' }
  ]
  
  return colors[colorIndex]
}

export default function AnnouncementsList({ filters }: AnnouncementsListProps) {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true)
      try {
        const announcementFilters = {
          ...(filters?.districtId && { districtId: filters.districtId }),
          ...(filters?.zoneId && { zoneId: filters.zoneId }),
          ...(filters?.clubId && { clubId: filters.clubId }),
          ...(filters?.visibility && filters.visibility !== 'all' && { 
            visibility: filters.visibility === 'internal-use' ? 'private' : filters.visibility 
          })
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
  }, [filters])

  // Filter announcements by search term
  const filteredAnnouncements = useMemo(() => {
    if (!filters?.search) return announcements
    
    const searchTerm = filters.search.toLowerCase()
    return announcements.filter(announcement => 
      announcement.title.toLowerCase().includes(searchTerm) ||
      announcement.content.toLowerCase().includes(searchTerm) ||
      announcement.club?.name.toLowerCase().includes(searchTerm)
    )
  }, [announcements, filters?.search])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kin-red"></div>
          <span className="ml-2 text-gray-600">Loading announcements...</span>
        </div>
      </div>
    )
  }

  if (filteredAnnouncements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
        <p className="text-gray-500">Try adjusting your filters or check back later for new announcements.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Announcements
              </h2>
              <p className="text-sm text-gray-600">
                {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          
          {user && (
            <Link
              href="/announcements/create"
              className="inline-flex items-center px-4 py-2 bg-kin-red text-white rounded-lg hover:bg-kin-red-dark transition-colors text-sm font-medium shadow-sm hover:shadow-md"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Announcement
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="space-y-6">
          {filteredAnnouncements.map(announcement => {
            const clubColor = announcement.club_id ? generateClubColor(announcement.club_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500' }
            
            return (
              <article key={announcement.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative bg-white hover:border-gray-300">
                {/* Club Color Indicator */}
                {announcement.club_id && (
                  <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${clubColor.border}`}></div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      {announcement.visibility === 'private' ? (
                        <Lock className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Globe className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {/* Content Preview */}
                    <div 
                      className="text-gray-600 mb-3 line-clamp-3 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: announcement.content.length > 200 
                          ? announcement.content.substring(0, 200) + '...' 
                          : announcement.content 
                      }}
                    />
                  </div>
                </div>

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

                <div className="space-y-2 mb-4">
                  {/* Publish Date */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Published: {new Date(announcement.publish_date).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Expiry Date */}
                  {announcement.expiry_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 opacity-0" />
                      <span>Expires: {new Date(announcement.expiry_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Organization */}
                  {announcement.club && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{announcement.club.name}</span>
                      {announcement.zone && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{announcement.zone.name}</span>
                        </>
                      )}
                      {announcement.district && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{announcement.district.name}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {announcement.tags && announcement.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {announcement.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
