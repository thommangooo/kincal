'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Filter, MapPin, Users, Building, Flag, ChevronDown, ChevronUp } from 'lucide-react'
import { getDistricts, getZones, getClubs, getKinCanada, District, Zone, Club, KinCanada } from '@/lib/database'

interface EventFiltersProps {
  onFiltersChange?: (filters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private'
    includeZoneEvents?: boolean
    includeClubEvents?: boolean
    includeKinCanadaEvents?: boolean
  }) => void
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export default function EventFilters({ onFiltersChange, collapsible = false, defaultCollapsed = true }: EventFiltersProps) {
  const [search, setSearch] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [clubId, setClubId] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [includeZoneEvents, setIncludeZoneEvents] = useState(true)
  const [includeClubEvents, setIncludeClubEvents] = useState(true)
  const [includeKinCanadaEvents, setIncludeKinCanadaEvents] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  
  // Track previous values to prevent unnecessary calls
  const prevFiltersRef = useRef<string>('')
  
  const [districts, setDistricts] = useState<District[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [kinCanada, setKinCanada] = useState<KinCanada | null>(null)
  const [filteredZones, setFilteredZones] = useState<Zone[]>([])
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [districtsData, zonesData, clubsData, kinCanadaData] = await Promise.all([
          getDistricts(),
          getZones(),
          getClubs(),
          getKinCanada().catch(() => null) // Gracefully handle if table doesn't exist yet
        ])
        setDistricts(districtsData)
        setZones(zonesData)
        setClubs(clubsData)
        setKinCanada(kinCanadaData)
      } catch (error) {
        console.error('Error loading filter data:', error)
      }
    }
    loadData()
  }, [])

  // Filter zones when district changes
  useEffect(() => {
    if (districtId) {
      const filtered = zones.filter(zone => zone.district_id === districtId)
      setFilteredZones(filtered)
      setZoneId('') // Reset zone selection
    } else {
      setFilteredZones(zones)
    }
  }, [districtId, zones])

  // Filter clubs when zone changes
  useEffect(() => {
    if (zoneId) {
      const filtered = clubs.filter(club => club.zone_id === zoneId)
      setFilteredClubs(filtered)
      setClubId('') // Reset club selection
    } else {
      setFilteredClubs(clubs)
    }
  }, [zoneId, clubs])

  // Notify parent of filter changes
  useEffect(() => {
    const currentFilters = {
      search,
      districtId,
      zoneId,
      clubId,
      visibility,
      includeZoneEvents,
      includeClubEvents,
      includeKinCanadaEvents
    }
    
    // Create a string representation to compare with previous
    const filtersString = JSON.stringify(currentFilters)
    
    // Only call onFiltersChange if filters actually changed
    if (filtersString !== prevFiltersRef.current) {
      prevFiltersRef.current = filtersString
      onFiltersChange?.(currentFilters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, districtId, zoneId, clubId, visibility, includeZoneEvents, includeClubEvents, includeKinCanadaEvents])

  const clearFilters = () => {
    setSearch('')
    setDistrictId('')
    setZoneId('')
    setClubId('')
    setVisibility('all')
    setIncludeZoneEvents(true)
    setIncludeClubEvents(true)
    setIncludeKinCanadaEvents(true)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2 text-kin-red" />
          Filters
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearFilters}
            className="text-sm text-kin-red hover:text-kin-red-dark font-medium transition-colors"
          >
            Clear all
          </button>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
            >
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className={`space-y-4 transition-all duration-300 ease-in-out ${
        collapsible && isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-screen opacity-100'
      }`}>

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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* District Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="h-4 w-4 inline mr-1" />
            District
          </label>
          <select
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors"
          >
            <option value="">All Districts</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        {/* Zone Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Zone
          </label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors"
            disabled={!districtId}
          >
            <option value="">All Zones</option>
            {filteredZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Club Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="h-4 w-4 inline mr-1" />
            Club
          </label>
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors"
            disabled={!zoneId}
          >
            <option value="">All Clubs</option>
            {filteredClubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>

        {/* Include Options - Show based on selected entity */}
        {districtId && !zoneId && !clubId && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700">Include Events From:</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeZoneEvents}
                  onChange={(e) => setIncludeZoneEvents(e.target.checked)}
                  className="h-4 w-4 text-kin-red focus:ring-kin-red border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Zone events in this district</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeClubEvents}
                  onChange={(e) => setIncludeClubEvents(e.target.checked)}
                  className="h-4 w-4 text-kin-red focus:ring-kin-red border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Club events in this district</span>
              </label>
            </div>
          </div>
        )}

        {zoneId && !clubId && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700">Include Events From:</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeClubEvents}
                  onChange={(e) => setIncludeClubEvents(e.target.checked)}
                  className="h-4 w-4 text-kin-red focus:ring-kin-red border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Club events in this zone</span>
              </label>
            </div>
          </div>
        )}

        {/* Kin Canada Events Filter - Independent checkbox */}
        {kinCanada && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Flag className="h-4 w-4 mr-2 text-blue-600" />
              Kin Canada Calendar
            </h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeKinCanadaEvents}
                  onChange={(e) => setIncludeKinCanadaEvents(e.target.checked)}
                  className="h-4 w-4 text-kin-red focus:ring-kin-red border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include Kin Canada calendar events
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Kin Canada events are independent of district/zone/club filters above
              </p>
            </div>
          </div>
        )}

        {/* Visibility Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'all' | 'public' | 'private')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors"
          >
            <option value="all">All Events</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>
      </div>
    </div>
  )
}
