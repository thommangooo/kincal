'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Megaphone, Plus } from 'lucide-react'
import { getAnnouncements, Announcement } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'
import AnnouncementCard from './AnnouncementCard'


interface AnnouncementsListProps {
  filters?: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'internal-use'
  }
}

export default function AnnouncementsList({ filters }: AnnouncementsListProps) {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true)
      try {
        const announcementFilters = {
          ...(filters?.districtId && { districtId: filters.districtId }),
          ...(filters?.zoneId && { zoneId: filters.zoneId }),
          ...(filters?.clubId && { clubId: filters.clubId }),
          ...(filters?.visibility && filters.visibility !== 'all' && { 
            visibility: filters.visibility === 'internal-use' ? 'private' as const : filters.visibility as 'public' | 'private'
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
  const filteredAnnouncements = announcements.filter(announcement => {
    if (!filters?.search) return true
    
    const searchTerm = filters.search.toLowerCase()
    return announcement.title.toLowerCase().includes(searchTerm) ||
           announcement.content.toLowerCase().includes(searchTerm) ||
           announcement.club?.name.toLowerCase().includes(searchTerm)
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading announcements...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Announcements
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  Stay updated with the latest news and updates from Kin clubs across the community.
                </p>
                <p className="text-xs text-gray-500">
                  {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
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
      </div>

      {/* Announcements List */}
      <div className="p-4 sm:p-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new announcement.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map(announcement => (
              <AnnouncementCard 
                key={announcement.id} 
                announcement={announcement} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
