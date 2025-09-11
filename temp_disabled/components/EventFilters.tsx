'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MapPin, Users, Building } from 'lucide-react'
import { getDistricts, getZones, getClubs, District, Zone, Club } from '@/lib/database'

interface EventFiltersProps {
  onFiltersChange?: (filters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private'
    contentType: 'all' | 'events' | 'announcements'
  }) => void
}

export default function EventFilters({ onFiltersChange }: EventFiltersProps) {
  const [search, setSearch] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [clubId, setClubId] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [contentType, setContentType] = useState<'all' | 'events' | 'announcements'>('all')
  
  const [districts, setDistricts] = useState<District[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [filteredZones, setFilteredZones] = useState<Zone[]>([])
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [districtsData, zonesData, clubsData] = await Promise.all([
          getDistricts(),
          getZones(),
          getClubs()
        ])
        setDistricts(districtsData)
        setZones(zonesData)
        setClubs(clubsData)
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
    onFiltersChange?.({
      search,
      districtId,
      zoneId,
      clubId,
      visibility,
      contentType
    })
  }, [search, districtId, zoneId, clubId, visibility, contentType, onFiltersChange])

  const clearFilters = () => {
    setSearch('')
    setDistrictId('')
    setZoneId('')
    setClubId('')
    setVisibility('all')
    setContentType('all')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h2>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        {/* Content Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as 'all' | 'events' | 'announcements')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Content</option>
            <option value="events">Events Only</option>
            <option value="announcements">Announcements Only</option>
          </select>
        </div>

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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* Visibility Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'all' | 'public' | 'private')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
