'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Calendar, List, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, Filter, Plus } from 'lucide-react'
import { getEvents, Event } from '@/lib/database'
import { formatTime } from '@/lib/utils'
import { generateClubColor } from '@/lib/colors'
import { useAuth } from '@/contexts/AuthContext'
import EventCard from './EventCard'
import EventModal from './EventModal'
import { getDateOnly, isDateInRange, createDateWithTime } from '@/lib/dateUtils'
import ClubSearch from './ClubSearch'

type ViewMode = 'calendar' | 'list'

interface CalendarViewProps {
  filters?: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private' | 'internal-use'
    includeZoneEvents?: boolean
    includeClubEvents?: boolean
  }
  showFilters?: boolean
  onFiltersChange?: (filters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private' | 'internal-use'
    includeZoneEvents?: boolean
    includeClubEvents?: boolean
  }) => void
  onClearFilters?: () => void
}

export default function CalendarView({ filters, showFilters = false, onFiltersChange, onClearFilters }: CalendarViewProps) {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Filter states
  const [search, setSearch] = useState(filters?.search || '')
  const [entityId, setEntityId] = useState(filters?.clubId || '')
  const [entityType, setEntityType] = useState<'club' | 'zone' | 'district' | 'kin_canada'>('club')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private' | 'internal-use'>(filters?.visibility || 'all')
  const [filtersCollapsed, setFiltersCollapsed] = useState(true)
  
  // Ref to track last filters state to prevent infinite loops
  const lastFiltersString = useRef('')

  // Sync local state with global filters - only when filters actually change
  useEffect(() => {
    if (filters) {
      const newSearch = filters.search || ''
      // Get the entity ID from the appropriate filter field
      const newEntityId = filters.clubId || filters.zoneId || filters.districtId || ''
      const newVisibility = filters.visibility || 'all'
      
      // Only update if values actually changed to prevent infinite loops
      if (search !== newSearch || entityId !== newEntityId || visibility !== newVisibility) {
        setSearch(newSearch)
        setEntityId(newEntityId)
        setVisibility(newVisibility)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Load events function
  const loadEvents = useCallback(async () => {
    console.log('loadEvents called with filters:', filters)
    console.log('loadEvents includeClubEvents:', filters?.includeClubEvents)
    setLoading(true)
    try {
      const eventFilters: {
        visibility?: 'public' | 'private' | 'internal-use'
        clubId?: string
        zoneId?: string
        districtId?: string
        includeZoneEvents?: boolean
        includeClubEvents?: boolean
      } = {
        ...(visibility && visibility !== 'all' && { 
          visibility: visibility as 'public' | 'private' | 'internal-use'
        })
      }
      
      // Add entity-specific filter based on type
      if (entityId) {
        if (entityType === 'club') {
          eventFilters.clubId = entityId
        } else if (entityType === 'zone') {
          eventFilters.zoneId = entityId
          eventFilters.includeClubEvents = filters?.includeClubEvents
        } else if (entityType === 'district') {
          eventFilters.districtId = entityId
          eventFilters.includeZoneEvents = filters?.includeZoneEvents
          eventFilters.includeClubEvents = filters?.includeClubEvents
        } else if (entityType === 'kin_canada') {
          // Note: CalendarViewOld doesn't support Kin Canada filtering
          // For now, Kin Canada selection won't filter events
        }
      }
      
      const eventsData = await getEvents(eventFilters)
      setEvents(eventsData)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }, [entityId, entityType, visibility, filters])

  // Load events on mount and when filters change
  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // Create stable filter change handler
  const handleFiltersChange = useCallback((newFilters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private' | 'internal-use'
    includeZoneEvents?: boolean
    includeClubEvents?: boolean
  }) => {
    onFiltersChange?.(newFilters)
  }, [onFiltersChange])

  // Notify parent of filter changes - only when local state actually changes
  useEffect(() => {
    const currentFilters = {
      search,
      districtId: entityType === 'district' ? entityId : '',
      zoneId: entityType === 'zone' ? entityId : '',
      clubId: entityType === 'club' ? entityId : '',
      visibility,
      includeZoneEvents: filters?.includeZoneEvents,
      includeClubEvents: filters?.includeClubEvents
    }
    
    // Only call onFiltersChange if the filters object is different
    const filtersString = JSON.stringify(currentFilters)
    
    if (filtersString !== lastFiltersString.current) {
      lastFiltersString.current = filtersString
      handleFiltersChange(currentFilters)
    }
  }, [search, entityId, entityType, visibility, filters?.includeClubEvents, filters?.includeZoneEvents, handleFiltersChange])

  // Filter events by search term
  const filteredEvents = useMemo(() => {
    if (!search) return events
    
    const searchTerm = search.toLowerCase()
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm) ||
      event.description?.toLowerCase().includes(searchTerm) ||
      event.location?.toLowerCase().includes(searchTerm) ||
      event.club?.name.toLowerCase().includes(searchTerm)
    )
  }, [events, search])


  // Get events for current month (including multi-day events that span into this month)
  const currentMonthEvents = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    return filteredEvents.filter(event => {
      const eventStartDate = getDateOnly(event.start_date)
      const eventEndDate = getDateOnly(event.end_date)
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0)
      
      // Check if the event overlaps with the current month
      const eventStartMonth = eventStartDate.getFullYear() === year && eventStartDate.getMonth() === month
      const eventEndMonth = eventEndDate.getFullYear() === year && eventEndDate.getMonth() === month
      const eventSpansMonth = eventStartDate <= monthEnd && eventEndDate >= monthStart
      
      return eventStartMonth || eventEndMonth || eventSpansMonth
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

  const clearFilters = () => {
    if (onClearFilters) {
      onClearFilters()
    } else {
      // Fallback to local state clearing if no global clear function provided
      setSearch('')
      setEntityId('')
      setEntityType('club')
      setVisibility('all')
    }
  }

  // Get current filter state text
  const getFilterStateText = () => {
    const activeFilters = []
    if (search) activeFilters.push(`"${search}"`)
    if (entityId) {
      // We'll get the entity name from the ClubSearch component's display
      let entityText = `${entityType} selected`
      
      // Add checkbox context
      if (entityType === 'district') {
        const includes = []
        if (filters?.includeZoneEvents !== false) includes.push('+Zones')
        if (filters?.includeClubEvents !== false) includes.push('+Clubs')
        if (includes.length > 0) {
          entityText += ` (${includes.join(', ')})`
        }
      } else if (entityType === 'zone') {
        if (filters?.includeClubEvents !== false) {
          entityText += ' (+Clubs)'
        }
      }
      
      activeFilters.push(entityText)
    }
    if (visibility !== 'all') {
      activeFilters.push(visibility === 'public' ? 'Public' : 'Private')
    }
    
    if (activeFilters.length === 0) return 'No filters applied'
    return activeFilters.join(' • ')
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

      {/* Integrated Filters */}
      {showFilters && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="p-2 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                  className="flex items-center text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors group"
                >
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-kin-red group-hover:text-kin-red-dark transition-colors" />
                  Filters
                  <span className="ml-1 sm:ml-2">
                    {filtersCollapsed ? (
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </span>
                </button>
                <div className="text-xs text-gray-500">
                  <span className="hidden sm:inline">{getFilterStateText()}</span>
                  <span className="sm:hidden">
                    {getFilterStateText().length > 20 
                      ? getFilterStateText().substring(0, 20) + '...' 
                      : getFilterStateText()
                    }
                  </span>
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs sm:text-sm text-kin-red hover:text-kin-red-dark font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
          <div className={`transition-all duration-300 ease-in-out ${
            filtersCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-screen opacity-100'
          }`}>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search content
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by title, description..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Entity Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Club, Zone, or District
                  </label>
                  <ClubSearch
                    value={entityId}
                    onChange={(id, type) => {
                      setEntityId(id)
                      setEntityType(type)
                    }}
                    placeholder="Search for a club, zone, or district..."
                  />
                  
                  {/* Include Options - Compact, directly under dropdown */}
                  {entityType === 'district' && entityId && (
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters?.includeZoneEvents !== false}
                          onChange={(e) => {
                            const newFilters = {
                              search: filters?.search || '',
                              districtId: filters?.districtId || '',
                              zoneId: filters?.zoneId || '',
                              clubId: filters?.clubId || '',
                              visibility: filters?.visibility || 'all',
                              includeZoneEvents: e.target.checked,
                              includeClubEvents: filters?.includeClubEvents
                            }
                            onFiltersChange?.(newFilters)
                          }}
                          className="h-3 w-3 text-kin-red focus:ring-kin-red border-gray-300 rounded"
                        />
                        <span className="ml-1 text-gray-600">+Zones</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters?.includeClubEvents !== false}
                          onChange={(e) => {
                            const newFilters = {
                              search: filters?.search || '',
                              districtId: filters?.districtId || '',
                              zoneId: filters?.zoneId || '',
                              clubId: filters?.clubId || '',
                              visibility: filters?.visibility || 'all',
                              includeZoneEvents: filters?.includeZoneEvents,
                              includeClubEvents: e.target.checked
                            }
                            onFiltersChange?.(newFilters)
                          }}
                          className="h-3 w-3 text-kin-red focus:ring-kin-red border-gray-300 rounded"
                        />
                        <span className="ml-1 text-gray-600">+Clubs</span>
                      </label>
                    </div>
                  )}

                  {entityType === 'zone' && entityId && (
                    <div className="mt-2 flex items-center space-x-4 text-xs">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters?.includeClubEvents !== false}
                          onChange={(e) => {
                            const newFilters = {
                              search: filters?.search || '',
                              districtId: filters?.districtId || '',
                              zoneId: filters?.zoneId || '',
                              clubId: filters?.clubId || '',
                              visibility: filters?.visibility || 'all',
                              includeZoneEvents: filters?.includeZoneEvents,
                              includeClubEvents: e.target.checked
                            }
                            onFiltersChange?.(newFilters)
                          }}
                          className="h-3 w-3 text-kin-red focus:ring-kin-red border-gray-300 rounded"
                        />
                        <span className="ml-1 text-gray-600">+Clubs</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Visibility Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'all' | 'public' | 'private' | 'internal-use')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors text-sm"
                  >
                    <option value="all">All Events</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              user={user}
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
          <EventList 
            events={filteredEvents} 
            onEventClick={handleEventClick}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}
      </div>
      
      {/* Event Modal */}
      <EventModal 
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDelete={loadEvents}
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
  selectedDate,
  viewMode,
  onViewModeChange,
  user
}: { 
  currentDate: Date
  events: Event[]
  onNavigate: (direction: 'prev' | 'next' | 'today') => void
  onDayClick: (day: number) => void
  onEventClick: (event: Event) => void
  selectedDate: Date | null
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  user: { email: string } | null
}) {
  const monthName = currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
  
  // Get first day of month and number of days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Generate calendar days
  const calendarDays: (number | null)[] = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }


  // Get all events for a specific day, categorized by type
  const getEventsForDayCategorized = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const singleDayEvents: Event[] = []
    const multiDayEvents: (Event & { isStartDay: boolean; isEndDay: boolean })[] = []
    
    events.forEach(event => {
      const eventStartDate = getDateOnly(event.start_date)
      const eventEndDate = getDateOnly(event.end_date)
      const dateOnly = getDateOnly(date)
      
      const isMultiDay = eventStartDate.getTime() !== eventEndDate.getTime()
      const isOnThisDay = isDateInRange(dateOnly, eventStartDate, eventEndDate)
      const startsOnThisDay = eventStartDate.getTime() === dateOnly.getTime()
      const endsOnThisDay = eventEndDate.getTime() === dateOnly.getTime()
      
      if (isOnThisDay) {
        if (isMultiDay) {
          // Multi-day event - show as spanning bar on all days it spans
          multiDayEvents.push({
            ...event,
            isStartDay: startsOnThisDay,
            isEndDay: endsOnThisDay
          })
        } else {
          // Single-day event - show as pill
          singleDayEvents.push(event)
        }
      }
    })
    
    return { singleDayEvents, multiDayEvents }
  }

  // Calculate spanning bar properties for multi-day events
  const getSpanningBarStyle = (event: Event, currentDayIndex: number) => {
    const eventStartDate = getDateOnly(event.start_date)
    const eventEndDate = getDateOnly(event.end_date)
    
    
    // Calculate the number of days the event spans
    const daysSpan = Math.ceil((eventEndDate.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Find the start day index for this event
    const currentDay = calendarDays[currentDayIndex]
    if (currentDay === null) {
      // This shouldn't happen since we only call this for non-null days, but handle it gracefully
      return {
        left: '0%',
        width: '0%',
        daysSpan: 0,
        currentRow: 0,
        dayOfWeek: 0,
        daysIntoEvent: 0,
        isStartOfWeek: false,
        isEndOfWeek: false
      }
    }
    const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDay)
    const currentDateOnly = getDateOnly(currentDayDate)
    
    // Calculate position within the week (0-6 for Sun-Sat)
    // Use the actual day of the week for the current day, not the array index
    const dayOfWeek = currentDateOnly.getDay()
    const currentRow = Math.floor(currentDayIndex / 7)
    
    // Calculate how many days into the event we are
    const daysIntoEvent = Math.ceil((currentDateOnly.getTime() - eventStartDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // DEBUG: Log the positioning calculation
    if (event.title === 'Fall Craft Show') {
      console.log('SPANNING BAR DEBUG for Fall Craft Show:')
      console.log('currentDayIndex:', currentDayIndex)
      console.log('currentDay:', currentDay)
      console.log('currentDateOnly:', currentDateOnly)
      console.log('dayOfWeek:', dayOfWeek)
      console.log('currentRow:', currentRow)
      console.log('daysIntoEvent:', daysIntoEvent)
      console.log('daysSpan:', daysSpan)
    }
    
    
    
    // Calculate how many days remain in the current week from this day
    const daysRemainingInWeek = 7 - dayOfWeek
    
    // Calculate how many days of the event remain from this day
    const daysRemainingInEvent = daysSpan - daysIntoEvent
    
    // The bar width is the minimum of remaining days in week or remaining days in event
    const actualSpan = Math.min(daysRemainingInWeek, daysRemainingInEvent)
    
    const result = {
      left: `${(dayOfWeek * 100) / 7}%`,
      width: `${(actualSpan * 100) / 7}%`,
      daysSpan: actualSpan,
      currentRow,
      dayOfWeek,
      daysIntoEvent,
      isStartOfWeek: dayOfWeek === 0,
      isEndOfWeek: dayOfWeek === 6
    }
    
    // DEBUG: Log the final positioning values
    if (event.title === 'Fall Craft Show') {
      console.log('FINAL POSITIONING:')
      console.log('left:', result.left)
      console.log('width:', result.width)
      console.log('actualSpan:', actualSpan)
      console.log('daysRemainingInWeek:', daysRemainingInWeek)
    }
    
    return result
  }

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2 sm:mb-4 md:mb-6">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => onNavigate('prev')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </button>
        </div>
        
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 text-center">{monthName}</h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('today')}
            className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
          
          {user && (
            <button
              onClick={() => window.location.href = '/events/create'}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-kin-red text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-kin-red-dark transition-colors flex items-center space-x-1"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Event</span>
            </button>
          )}
          
          <div className="flex items-center space-x-1 bg-white rounded-lg p-0.5 shadow-sm border border-gray-200">
            <button
              onClick={() => onViewModeChange('calendar')}
              className={`p-1.5 sm:p-2 rounded-md transition-all duration-200 ${
                viewMode === 'calendar' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Calendar View"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 sm:p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List View"
            >
              <List className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-1 sm:p-2 md:p-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-b border-gray-200">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={index} className="bg-white h-16 sm:h-24 md:h-32"></div>
            }
            
            const { singleDayEvents } = getEventsForDayCategorized(day)
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
            const isWeekend = index % 7 === 0 || index % 7 === 6 // Sunday or Saturday
            const isSelected = selectedDate && selectedDate.toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
            
            return (
              <div
                key={`${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`}
                onClick={() => onDayClick(day)}
                className={`bg-white h-16 sm:h-24 md:h-32 p-0.5 sm:p-1 md:p-2 hover:bg-gray-50 transition-colors cursor-pointer ${
                  isToday ? 'bg-blue-50 border-l-2 sm:border-l-4 border-l-blue-500' : ''
                } ${isSelected ? 'bg-yellow-50 border-l-2 sm:border-l-4 border-l-yellow-500' : ''} ${
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
                <div className="space-y-0.5 sm:space-y-1 overflow-hidden relative">
                  {/* Single-day events */}
                  {singleDayEvents.slice(0, 3).map((event) => {
                    const clubColor = event.entity_id ? generateClubColor(event.entity_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500', bgStyle: 'background-color: #f3f4f6', textStyle: 'color: #1f2937', borderStyle: 'background-color: #6b7280' }
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(event)
                        }}
                        className={`text-xs px-0.5 sm:px-1 md:px-2 py-0.5 sm:py-1 rounded-full truncate cursor-pointer hover:opacity-80 transition-opacity font-medium ${clubColor.bg} ${clubColor.text}`}
                        style={{
                          backgroundColor: clubColor.bgStyle?.split(': ')[1],
                          color: clubColor.textStyle?.split(': ')[1]
                        }}
                        title={`${event.title} - ${event.club?.name || 'Unknown Club'}`}
                      >
                        {event.title}
                      </div>
                    )
                  })}
                  
                  {/* Show "more" indicator if there are too many single-day events */}
                  {singleDayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{singleDayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Spanning bars for multi-day events */}
        {calendarDays.map((day, index) => {
          if (day === null) return null
          
          const { multiDayEvents } = getEventsForDayCategorized(day)
          
          return multiDayEvents.map((event) => {
            const clubColor = event.entity_id ? generateClubColor(event.entity_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500', bgStyle: 'background-color: #f3f4f6', textStyle: 'color: #1f2937', borderStyle: 'background-color: #6b7280' }
            const barStyle = getSpanningBarStyle(event, index)
            
            // Calculate the top position based on the current row
            // Header height (40px) + row height (96px) + gap (1px) * row number
            const topPosition = 40 + (barStyle.currentRow * 97)
            
            // Only show text on the start day of the event to avoid repetition
            const shouldShowText = event.isStartDay
            
            return (
              <div
                key={`spanning-${event.id}-${day}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onEventClick(event)
                }}
                className="absolute h-6 cursor-pointer hover:opacity-80 transition-opacity font-medium text-xs px-2 py-1 border-l-2 flex items-center"
                style={{
                  backgroundColor: clubColor.bgStyle?.split(': ')[1],
                  color: clubColor.textStyle?.split(': ')[1],
                  borderLeftColor: clubColor.borderStyle?.split(': ')[1],
                  left: barStyle.left,
                  width: barStyle.width,
                  top: `${topPosition}px`,
                  zIndex: 10,
                  borderRadius: event.isStartDay ? '0 4px 4px 0' : event.isEndDay ? '4px 0 0 4px' : '0'
                }}
                title={`${event.title} - ${event.club?.name || 'Unknown Club'} (${barStyle.daysSpan} days)`}
              >
                {shouldShowText && <span className="truncate">{event.title}</span>}
              </div>
            )
          })
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
  const dayEvents = events.filter(event => {
    const eventStartDate = getDateOnly(event.start_date)
    const eventEndDate = getDateOnly(event.end_date)
    const selectedDateObj = new Date(selectedDate)
    
    // Check if the selected date falls within the event's date range
    return selectedDateObj >= eventStartDate && selectedDateObj <= eventEndDate
  })

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
            const clubColor = event.entity_id ? generateClubColor(event.entity_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500', bgStyle: 'background-color: #f3f4f6', textStyle: 'color: #1f2937', borderStyle: 'background-color: #6b7280' }
            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${clubColor.bg} ${clubColor.text}`}
                style={{
                  backgroundColor: clubColor.bgStyle?.split(': ')[1],
                  color: clubColor.textStyle?.split(': ')[1]
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    {event.club && (
                      <p className="text-xs opacity-75 mt-1">{event.club.name}</p>
                    )}
                    {(() => {
                      const startDate = createDateWithTime(event.start_date)
                      const endDate = createDateWithTime(event.end_date)
                      const startTime = startDate.toTimeString().slice(0, 5)
                      const endTime = endDate.toTimeString().slice(0, 5)
                      
                      // Only show time if it's not a default all-day event
                      if (startTime !== '00:00' || endTime !== '23:59') {
                        return (
                          <p className="text-xs opacity-75 mt-1">
                            {formatTime(startTime)}
                            {endTime !== '23:59' && ` - ${formatTime(endTime)}`}
                          </p>
                        )
                      }
                      return null
                    })()}
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
function EventList({ 
  events, 
  onEventClick, 
  viewMode, 
  onViewModeChange 
}: { 
  events: Event[]
  onEventClick: (event: Event) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}) {
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
    <div>
      {/* Compact View Toggle - positioned at top right */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-1 bg-white rounded-lg p-0.5 shadow-sm border border-gray-200">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`p-1.5 sm:p-2 rounded-md transition-all duration-200 ${
              viewMode === 'calendar' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Calendar View"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 sm:p-2 rounded-md transition-all duration-200 ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="List View"
          >
            <List className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map(event => (
          <div key={event.id} onClick={() => onEventClick(event)} className="cursor-pointer">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  )
}

