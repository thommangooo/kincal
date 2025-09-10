'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getEvents, Event } from '@/lib/database'
import { formatDate, formatTime } from '@/lib/utils'
import EventCard from '@/components/EventCard'
import { Calendar, List, Copy, Check } from 'lucide-react'

export default function EmbedPage() {
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const clubId = searchParams.get('club')
  const zoneId = searchParams.get('zone')
  const districtId = searchParams.get('district')

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        const filters = {
          ...(clubId && { clubId }),
          ...(zoneId && { zoneId }),
          ...(districtId && { districtId }),
          visibility: 'public' as const
        }
        
        const eventsData = await getEvents(filters)
        setEvents(eventsData)
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [clubId, zoneId, districtId])

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
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-blue-700' 
                  : 'hover:bg-blue-700'
              }`}
            >
              <Calendar className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-700' 
                  : 'hover:bg-blue-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={copyEmbedCode}
              className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Copy embed code"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">No public events match your current filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <EventCard key={event.id} event={event} showClub={!clubId} />
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

