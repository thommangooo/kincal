'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { getEvents, Event } from '@/lib/database'
import { formatDate, formatTime, getEventStatus } from '@/lib/utils'
import EventCard from './EventCard'

type ViewMode = 'calendar' | 'list'

interface CalendarViewProps {
  filters?: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private'
  }
}

export default function CalendarView({ filters }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        const eventFilters = {
          ...(filters?.districtId && { districtId: filters.districtId }),
          ...(filters?.zoneId && { zoneId: filters.zoneId }),
          ...(filters?.clubId && { clubId: filters.clubId }),
          ...(filters?.visibility && filters.visibility !== 'all' && { visibility: filters.visibility })
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
  }, [filters])

  // Filter events by search term
  const filteredEvents = useMemo(() => {
    if (!filters?.search) return events
    
    const searchTerm = filters.search.toLowerCase()
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm) ||
      event.description?.toLowerCase().includes(searchTerm) ||
      event.location?.toLowerCase().includes(searchTerm) ||
      event.club?.name.toLowerCase().includes(searchTerm)
    )
  }, [events, filters?.search])

  // Group events by date for calendar view
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: Event[] } = {}
    
    filteredEvents.forEach(event => {
      const date = new Date(event.start_date).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(event)
    })
    
    return grouped
  }, [filteredEvents])

  // Get events for current month
  const currentMonthEvents = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month
    })
  }, [filteredEvents, currentDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading events...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'calendar' ? 'Calendar View' : 'List View'}
            </h2>
            <span className="text-sm text-gray-500">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'calendar' ? (
          <CalendarGrid 
            currentDate={currentDate}
            events={currentMonthEvents}
            onNavigate={navigateMonth}
          />
        ) : (
          <EventList events={filteredEvents} />
        )}
      </div>
    </div>
  )
}

// Calendar Grid Component
function CalendarGrid({ 
  currentDate, 
  events, 
  onNavigate 
}: { 
  currentDate: Date
  events: Event[]
  onNavigate: (direction: 'prev' | 'next') => void
}) {
  const monthName = currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
  
  // Get first day of month and number of days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Generate calendar days
  const calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return events.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigate('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
        <button
          onClick={() => onNavigate('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-2 h-24"></div>
          }
          
          const dayEvents = getEventsForDay(day)
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
          
          return (
            <div
              key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`}
              className={`p-2 h-24 border border-gray-200 ${
                isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Event List Component
function EventList({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
        <p className="text-gray-500">Try adjusting your filters or create a new event.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

