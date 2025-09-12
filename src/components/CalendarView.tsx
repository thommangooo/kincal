'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { getEvents, Event } from '@/lib/database'
import { formatTime } from '@/lib/utils'
import EventCard from './EventCard'
import EventModal from './EventModal'

// Generate consistent colors for clubs
const generateClubColor = (clubId: string): { bg: string; text: string; border: string } => {
  // Create a simple hash from the club ID
  let hash = 0
  for (let i = 0; i < clubId.length; i++) {
    const char = clubId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get a consistent index
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

type ViewMode = 'calendar' | 'list'

interface CalendarViewProps {
  filters?: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private'
  }
  showFilters?: boolean
}

export default function CalendarView({ filters, showFilters = true }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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


  // Get events for current month
  const currentMonthEvents = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.getFullYear() === year && eventDate.getMonth() === month
    })
  }, [filteredEvents, currentDate])

  const navigateMonth = (direction: 'prev' | 'next' | 'today') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else if (direction === 'next') {
        newDate.setMonth(newDate.getMonth() + 1)
      } else if (direction === 'today') {
        return new Date()
      }
      return newDate
    })
  }

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {viewMode === 'calendar' ? 'Calendar View' : 'List View'}
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  Discover and share events across Kin clubs, zones, and districts. Stay connected with your Kin community.
                </p>
                <p className="text-xs text-gray-500">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'calendar' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Calendar View"
            >
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List View"
            >
              <List className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {viewMode === 'calendar' ? (
          <>
            <CalendarGrid 
              currentDate={currentDate}
              events={currentMonthEvents}
              onNavigate={navigateMonth}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              selectedDate={selectedDate}
            />
            
            {/* Selected Date Events Panel */}
            {selectedDate && (
              <SelectedDatePanel 
                selectedDate={selectedDate}
                events={filteredEvents}
                onEventClick={handleEventClick}
                onClose={() => setSelectedDate(null)}
              />
            )}
          </>
        ) : (
          <EventList events={filteredEvents} onEventClick={handleEventClick} />
        )}
      </div>
      
      {/* Event Modal */}
      <EventModal 
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

// Calendar Grid Component
function CalendarGrid({ 
  currentDate, 
  events, 
  onNavigate,
  onDayClick,
  onEventClick,
  selectedDate
}: { 
  currentDate: Date
  events: Event[]
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  onDayClick: (day: number) => void
  onEventClick: (event: Event) => void
  selectedDate: Date | null
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center">{monthName}</h3>
        
        <button
          onClick={() => onNavigate('today')}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="bg-white h-24 sm:h-32"></div>
          }
          
          const dayEvents = getEventsForDay(day)
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
          const isWeekend = index % 7 === 0 || index % 7 === 6 // Sunday or Saturday
          const isSelected = selectedDate && selectedDate.toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
          
          return (
            <div
              key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`}
              onClick={() => onDayClick(day)}
              className={`bg-white h-24 sm:h-32 p-1 sm:p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                isToday ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              } ${isSelected ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : ''} ${
                isWeekend ? 'bg-gray-25' : ''
              }`}
            >
              <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                isToday ? 'text-blue-600 font-bold' : 
                isSelected ? 'text-yellow-600 font-bold' :
                isWeekend ? 'text-gray-500' : 'text-gray-900'
              }`}>
                {day}
              </div>
              <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => {
                  const clubColor = event.club_id ? generateClubColor(event.club_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500' }
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(event)
                      }}
                      className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full truncate cursor-pointer hover:opacity-80 transition-opacity font-medium ${clubColor.bg} ${clubColor.text}`}
                      title={`${event.title} - ${event.club?.name || 'Unknown Club'}`}
                    >
                      {event.title}
                    </div>
                  )
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayEvents.length - 3} more
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

// Selected Date Panel Component
function SelectedDatePanel({ 
  selectedDate, 
  events, 
  onEventClick, 
  onClose 
}: { 
  selectedDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onClose: () => void
}) {
  const selectedDateString = selectedDate.toDateString()
  const dayEvents = events.filter(event => 
    new Date(event.start_date).toDateString() === selectedDateString
  )

  return (
    <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Events for {selectedDate.toLocaleDateString('en-CA', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {dayEvents.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No events scheduled for this day.</p>
      ) : (
        <div className="space-y-3">
          {dayEvents.map(event => {
            const clubColor = event.club_id ? generateClubColor(event.club_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500' }
            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${clubColor.bg} ${clubColor.text}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    {event.club && (
                      <p className="text-xs opacity-75 mt-1">{event.club.name}</p>
                    )}
                    {event.start_time && (
                      <p className="text-xs opacity-75 mt-1">
                        {formatTime(event.start_time)}
                        {event.end_time && ` - ${formatTime(event.end_time)}`}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-xs opacity-75 mt-1">📍 {event.location}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Event List Component
function EventList({ events, onEventClick }: { events: Event[]; onEventClick: (event: Event) => void }) {
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
        <div key={event.id} onClick={() => onEventClick(event)} className="cursor-pointer">
          <EventCard event={event} />
        </div>
      ))}
    </div>
  )
}

