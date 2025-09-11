'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getEvents, Event } from '@/lib/database'
import { formatTime } from '@/lib/utils'
import EventModal from '@/components/EventModal'
import { Calendar, Filter } from 'lucide-react'

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

function CalendarEmbedContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  // Get URL parameters
  const clubId = searchParams.get('club')
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')
  const visibility = searchParams.get('visibility') as 'public' | 'private' | null
  const showFiltersParam = searchParams.get('showFilters')

  useEffect(() => {
    setShowFilters(showFiltersParam !== 'false')
  }, [showFiltersParam])

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        const eventFilters = {
          ...(clubId && { clubId }),
          ...(zoneId && { zoneId }),
          ...(districtId && { districtId }),
          ...(visibility && { visibility })
        }
        
        const eventsData = await getEvents(eventFilters)
        setEvents(eventsData)
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [clubId, zoneId, districtId, visibility])

  const openEventModal = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeEventModal = () => {
    setSelectedEvent(null)
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
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
            <Calendar className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Kin Calendar</h1>
          </div>
          
          {showFilters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 border-b p-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {clubId && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Club Filter</span>}
            {zoneId && <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Zone Filter</span>}
            {districtId && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">District Filter</span>}
            {visibility && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded">{visibility} events</span>}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">No events match your current filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const clubColor = event.club_id ? generateClubColor(event.club_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
              
              return (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => openEventModal(event)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                      {event.description && (
                        <p className="text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{new Date(event.start_date).toLocaleDateString()}</span>
                        {event.start_time && (
                          <span>{formatTime(event.start_time)}</span>
                        )}
                        {event.club && (
                          <span className={`px-2 py-1 rounded text-xs ${clubColor.bg} ${clubColor.text} ${clubColor.border} border`}>
                            {event.club.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t p-4 text-center">
        <p className="text-sm text-gray-600">
          Powered by <a href="/" className="text-blue-600 hover:underline" target="_blank">Kin Calendar</a>
        </p>
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={closeEventModal}
        />
      )}
    </div>
  )
}

export default function CalendarEmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    }>
      <CalendarEmbedContent />
    </Suspense>
  )
}
