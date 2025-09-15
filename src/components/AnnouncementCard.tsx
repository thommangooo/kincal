'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Announcement, deleteAnnouncement } from '@/lib/database'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Globe, Lock, Star, Calendar, Clock, Edit, Trash2, Info } from 'lucide-react'
import { useState } from 'react'
import Toast from './Toast'

interface AnnouncementCardProps {
  announcement: Announcement
  showClub?: boolean
  onDelete?: () => void
}

export default function AnnouncementCard({ announcement, showClub = true, onDelete }: AnnouncementCardProps) {
  const { user } = useAuth()
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const isExpired = announcement.expiry_date && new Date(announcement.expiry_date) < new Date()
  const isHighPriority = announcement.priority >= 7
  const canEdit = user?.email === announcement.created_by_email

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return
    }

    try {
      await deleteAnnouncement(announcement.id)
      showToastMessage('Announcement deleted successfully!')
      // Call the onDelete callback to refresh the list
      onDelete?.()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      showToastMessage('Error deleting announcement')
    }
  }

  return (
    <div className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
      isHighPriority ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
            {isHighPriority && (
              <div className="flex items-center text-blue-600">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-xs font-medium ml-1">High Priority</span>
              </div>
            )}
            {isExpired && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                Expired
              </span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 ml-4">
          {/* Details Toggle */}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className={`p-2 transition-colors ${
              showMetadata 
                ? 'text-blue-500 hover:text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={showMetadata ? "Hide details" : "Show details"}
          >
            <Info className="h-4 w-4" />
          </button>
          
          {/* Edit/Delete Actions */}
          {canEdit && (
            <>
              <Link
                href={`/announcements/edit/${announcement.id}`}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit announcement"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete announcement"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
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
            className="max-w-full h-auto rounded-lg border border-gray-200"
          />
        </div>
      )}

      {/* Content */}
      <div 
        className="prose prose-sm max-w-none mb-4"
        dangerouslySetInnerHTML={{ __html: announcement.content }}
      />

      {/* Collapsible Metadata */}
      <div className={`space-y-2 mb-4 transition-all duration-200 ${
        showMetadata 
          ? 'max-h-96 opacity-100' 
          : 'max-h-0 opacity-0 overflow-hidden'
      }`}>
          {/* Date and Time */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Published: {formatDate(announcement.publish_date)}</span>
          </div>
          
          {announcement.expiry_date && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>Expires: {formatDate(announcement.expiry_date)}</span>
            </div>
          )}

          {/* Visibility */}
          <div className="flex items-center text-sm text-gray-600">
            {announcement.visibility === 'private' ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                <span>Visibility: Private (Internal Use)</span>
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                <span>Visibility: Public</span>
              </>
            )}
          </div>

          {/* Club */}
          {showClub && announcement.club && (
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
      
      <Toast 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  )
}
