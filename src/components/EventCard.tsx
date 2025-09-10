'use client'

import { Event } from '@/lib/database'
import { formatDate, formatTime, getEventStatus } from '@/lib/utils'
import { Calendar, MapPin, Users, Globe, Lock, ExternalLink } from 'lucide-react'

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

interface EventCardProps {
  event: Event
  showClub?: boolean
}

export default function EventCard({ event, showClub = true }: EventCardProps) {
  const status = getEventStatus(event)
  const statusColors = {
    upcoming: 'bg-green-100 text-green-800',
    today: 'bg-blue-100 text-blue-800',
    past: 'bg-gray-100 text-gray-800'
  }
  
  const clubColor = event.club_id ? generateClubColor(event.club_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500' }

  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow relative">
      {/* Club Color Indicator */}
      {event.club_id && (
        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${clubColor.border}`}></div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
              {status}
            </span>
            {event.visibility === 'private' ? (
              <Lock className="h-4 w-4 text-gray-500" />
            ) : (
              <Globe className="h-4 w-4 text-gray-500" />
            )}
          </div>
          
          {event.description && (
            <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
          )}
        </div>
        
        {event.event_url && (
          <a
            href={event.event_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Image */}
      {event.image_url && (
        <div className="mb-4">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
        </div>
      )}

      <div className="space-y-2 mb-4">
        {/* Date and Time */}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{formatDate(event.start_date)}</span>
          {event.start_date !== event.end_date && (
            <span className="mx-1">-</span>
          )}
          {event.start_date !== event.end_date && (
            <span>{formatDate(event.end_date)}</span>
          )}
        </div>
        
        {/* Only show times if they're not default all-day times */}
        {(() => {
          const startTime = new Date(event.start_date)
          const endTime = new Date(event.end_date)
          const isAllDay = startTime.getHours() === 0 && startTime.getMinutes() === 0 && 
                          endTime.getHours() === 23 && endTime.getMinutes() === 59
          
          if (!isAllDay) {
            return (
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 opacity-0" />
                <span>{formatTime(event.start_date)}</span>
                {event.end_date && (
                  <>
                    <span className="mx-1">-</span>
                    <span>{formatTime(event.end_date)}</span>
                  </>
                )}
              </div>
            )
          }
          return null
        })()}

        {/* Location */}
        {event.location && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Club */}
        {showClub && event.club && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span>{event.club.name}</span>
            {event.zone && (
              <>
                <span className="mx-1">•</span>
                <span>{event.zone.name}</span>
              </>
            )}
            {event.district && (
              <>
                <span className="mx-1">•</span>
                <span>{event.district.name}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {event.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
