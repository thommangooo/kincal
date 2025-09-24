'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, momentLocalizer, Views, View, ToolbarProps } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { DbEvent } from '@/lib/supabase'
import { generateClubColor } from '@/lib/colors'
import { GlobalFilters } from '@/contexts/FilterContext'
import ClubSearch from './ClubSearch'
import EventModal from './EventModal'
import { Search, Filter, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Setup moment localizer
const localizer = momentLocalizer(moment)

interface CalendarViewProps {
  events?: DbEvent[]
  filters?: GlobalFilters
  showFilters?: boolean
  onFiltersChange?: (filters: GlobalFilters) => void
  onEventClick?: (event: DbEvent) => void
  onNavigate?: (date: Date) => void
  onViewChange?: (view: string) => void
  onEventDeleted?: () => void
  className?: string
}

interface BigCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: DbEvent // Store original event data
}

export default function CalendarView({
  events = [],
  filters,
  showFilters = false,
  onFiltersChange,
  onEventClick,
  onNavigate,
  onViewChange,
  onEventDeleted,
  className = ''
}: CalendarViewProps) {
  const { user } = useAuth()
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<DbEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter states - local state for UI controls
  const [search, setSearch] = useState(filters?.search || '')
  const [entityId, setEntityId] = useState(filters?.clubId || filters?.zoneId || filters?.districtId || '')
  const [entityType, setEntityType] = useState<'club' | 'zone' | 'district'>('club')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private' | 'internal-use'>(filters?.visibility || 'all')
  const [filtersCollapsed, setFiltersCollapsed] = useState(true)

  // Determine entity type based on current filters
  useEffect(() => {
    if (filters) {
      if (filters.districtId) {
        setEntityType('district')
        setEntityId(filters.districtId)
      } else if (filters.zoneId) {
        setEntityType('zone')
        setEntityId(filters.zoneId)
      } else if (filters.clubId) {
        setEntityType('club')
        setEntityId(filters.clubId)
      }
      setSearch(filters.search || '')
      setVisibility(filters.visibility || 'all')
    }
  }, [filters])

  // Get current filter state text
  const getFilterStateText = () => {
    const activeFilters = []
    if (search) activeFilters.push(`"${search}"`)
    if (entityId) {
      let entityText = `${entityType} selected`
      
      // Add checkbox context
      if (entityType === 'district') {
        const includes = []
        if (filters?.includeZoneEvents !== false) includes.push('zones')
        if (filters?.includeClubEvents !== false) includes.push('clubs')
        if (includes.length > 0) entityText += ` (+${includes.join(', ')})`
      } else if (entityType === 'zone' && filters?.includeClubEvents !== false) {
        entityText += ' (+clubs)'
      }
      activeFilters.push(entityText)
    }
    if (visibility !== 'all') activeFilters.push(`${visibility} events`)
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters'
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    setEntityId('')
    setEntityType('club')
    setVisibility('all')
    onFiltersChange?.({
      search: '',
      districtId: '',
      zoneId: '',
      clubId: '',
      visibility: 'all',
      includeZoneEvents: true,
      includeClubEvents: true
    })
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<GlobalFilters>) => {
    const currentFilters = {
      search,
      districtId: entityType === 'district' ? entityId : '',
      zoneId: entityType === 'zone' ? entityId : '',
      clubId: entityType === 'club' ? entityId : '',
      visibility,
      includeZoneEvents: filters?.includeZoneEvents,
      includeClubEvents: filters?.includeClubEvents,
      ...newFilters
    }
    onFiltersChange?.(currentFilters)
  }

  // NO AUTOMATIC LOADING - Events will be passed in via props

  // Filter events by search term (client-side filtering)
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

  // Convert our events to react-big-calendar format
  const bigCalendarEvents: BigCalendarEvent[] = useMemo(() => {
    return filteredEvents.map(event => {
      // Parse datetime strings directly - much simpler!
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)

      return {
        id: event.id,
        title: event.title,
        start: startDate,
        end: endDate,
        resource: event
      }
    })
  }, [filteredEvents])

  // Handle event click
  const handleSelectEvent = (event: BigCalendarEvent) => {
    setSelectedEvent(event.resource)
    setIsModalOpen(true)
    if (onEventClick) {
      onEventClick(event.resource)
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  // Handle navigation (month changes)
  const handleNavigate = (newDate: Date) => {
    setDate(newDate)
    if (onNavigate) {
      onNavigate(newDate)
    }
  }

  // Handle view changes (month/week/day)
  const handleViewChange = (newView: View) => {
    setView(newView)
    if (onViewChange) {
      onViewChange(newView)
    }
  }

  // Custom event component with club colors
  const EventComponent = ({ event }: { event: BigCalendarEvent }) => {
    const clubColor = event.resource.entity_id 
      ? generateClubColor(event.resource.entity_id)
      : { bg: 'bg-gray-100', text: 'text-gray-800' }

    return (
      <div 
        className={`${clubColor.bg} ${clubColor.text} px-1 py-0.5 rounded text-xs font-medium truncate`}
        title={`${event.title} - ${event.resource.club?.name || 'Unknown Club'}`}
      >
        {event.title}
      </div>
    )
  }

  // Custom toolbar
  const CustomToolbar = (toolbar: ToolbarProps<BigCalendarEvent, object>) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV')
    }

    const goToNext = () => {
      toolbar.onNavigate('NEXT')
    }

    const goToCurrent = () => {
      toolbar.onNavigate('TODAY')
    }

    const changeView = (viewName: View) => {
      toolbar.onView(viewName)
    }

    return (
      <div className="flex items-center justify-between mb-4 p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">
            {toolbar.label}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToBack}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            ‹
          </button>
          <button
            onClick={goToCurrent}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            ›
          </button>
          
          {/* Add Event Button - only show if user is authenticated */}
          {user && (
            <button
              onClick={() => window.location.href = '/events/create'}
              className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Event</span>
            </button>
          )}
          
          <div className="ml-4 flex space-x-1">
            <button
              onClick={() => changeView(Views.MONTH)}
              className={`px-3 py-1 rounded ${
                toolbar.view === Views.MONTH 
                  ? 'bg-blue-500 text-white' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => changeView(Views.WEEK)}
              className={`px-3 py-1 rounded ${
                toolbar.view === Views.WEEK 
                  ? 'bg-blue-500 text-white' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => changeView(Views.DAY)}
              className={`px-3 py-1 rounded ${
                toolbar.view === Views.DAY 
                  ? 'bg-blue-500 text-white' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {showFilters && (
        <div className="mb-6">
          {/* Filter Header */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <span className="hidden sm:inline">{getFilterStateText()}</span>
                  <span className="sm:hidden">
                    {getFilterStateText().length > 20 
                      ? getFilterStateText().substring(0, 20) + '...' 
                      : getFilterStateText()
                    }
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <span>{filtersCollapsed ? 'Show' : 'Hide'}</span>
                  {filtersCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={clearFilters}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className={`transition-all duration-300 ease-in-out ${
              filtersCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-screen opacity-100'
            }`}>
              <div className="p-4">
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
                        onChange={(e) => {
                          setSearch(e.target.value)
                          handleFilterChange({ search: e.target.value })
                        }}
                        placeholder="Search by title, description..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
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
                        handleFilterChange({
                          districtId: type === 'district' ? id : '',
                          zoneId: type === 'zone' ? id : '',
                          clubId: type === 'club' ? id : ''
                        })
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
                            onChange={(e) => handleFilterChange({ includeZoneEvents: e.target.checked })}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-1 text-gray-600">+Zones</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters?.includeClubEvents !== false}
                            onChange={(e) => handleFilterChange({ includeClubEvents: e.target.checked })}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                            onChange={(e) => handleFilterChange({ includeClubEvents: e.target.checked })}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                      onChange={(e) => {
                        const newVisibility = e.target.value as 'all' | 'public' | 'private' | 'internal-use'
                        setVisibility(newVisibility)
                        handleFilterChange({ visibility: newVisibility })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
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
        </div>
      )}
      <div className="h-[600px]">
        <Calendar
        localizer={localizer}
        events={bigCalendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        date={date}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        onSelectEvent={handleSelectEvent}
        components={{
          toolbar: CustomToolbar,
          event: EventComponent
        }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        step={60}
        timeslots={1}
        showMultiDayTimes
        />
      </div>
      
      {/* Event Modal */}
      <EventModal 
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDelete={() => {
          handleCloseModal()
          onEventDeleted?.()
        }}
      />
    </div>
  )
}
