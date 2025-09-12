'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Megaphone, Plus, ChevronDown, ChevronUp, Search, Filter, MapPin, Users, Building } from 'lucide-react'
import { getAnnouncements, Announcement, getDistricts, getZones, getClubs, District, Zone, Club } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'
import AnnouncementCard from './AnnouncementCard'


interface AnnouncementsListProps {
  filters?: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'internal-use'
  }
  showFilters?: boolean
  onFiltersChange?: (filters: {
    search: string
    districtId: string
    zoneId: string
    clubId: string
    visibility: 'all' | 'public' | 'private'
  }) => void
}

export default function AnnouncementsList({ filters, showFilters = false, onFiltersChange }: AnnouncementsListProps) {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [search, setSearch] = useState(filters?.search || '')
  const [districtId, setDistrictId] = useState(filters?.districtId || '')
  const [zoneId, setZoneId] = useState(filters?.zoneId || '')
  const [clubId, setClubId] = useState(filters?.clubId || '')
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>(filters?.visibility === 'internal-use' ? 'private' : (filters?.visibility as 'all' | 'public' | 'private') || 'all')
  const [filtersCollapsed, setFiltersCollapsed] = useState(true)
  
  // Filter data
  const [districts, setDistricts] = useState<District[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [filteredZones, setFilteredZones] = useState<Zone[]>([])
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([])

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
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
    loadFilterData()
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

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true)
      try {
        const announcementFilters = {
          ...(districtId && { districtId }),
          ...(zoneId && { zoneId }),
          ...(clubId && { clubId }),
          ...(visibility && visibility !== 'all' && { 
            visibility: visibility === 'private' ? 'private' as const : visibility as 'public' | 'private'
          })
        }
        
        const announcementsData = await getAnnouncements(announcementFilters)
        setAnnouncements(announcementsData)
      } catch (error) {
        console.error('Error loading announcements:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAnnouncements()
  }, [districtId, zoneId, clubId, visibility])

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.({
      search,
      districtId,
      zoneId,
      clubId,
      visibility
    })
  }, [search, districtId, zoneId, clubId, visibility, onFiltersChange])

  // Filter announcements by search term
  const filteredAnnouncements = announcements.filter(announcement => {
    if (!search) return true
    
    const searchTerm = search.toLowerCase()
    return announcement.title.toLowerCase().includes(searchTerm) ||
           announcement.content.toLowerCase().includes(searchTerm) ||
           announcement.club?.name.toLowerCase().includes(searchTerm)
  })

  const clearFilters = () => {
    setSearch('')
    setDistrictId('')
    setZoneId('')
    setClubId('')
    setVisibility('all')
  }

  // Get current filter state text
  const getFilterStateText = () => {
    const activeFilters = []
    if (search) activeFilters.push(`"${search}"`)
    if (districtId) {
      const district = districts.find(d => d.id === districtId)
      if (district) activeFilters.push(district.name)
    }
    if (zoneId) {
      const zone = zones.find(z => z.id === zoneId)
      if (zone) activeFilters.push(zone.name)
    }
    if (clubId) {
      const club = clubs.find(c => c.id === clubId)
      if (club) activeFilters.push(club.name)
    }
    if (visibility !== 'all') {
      activeFilters.push(visibility === 'public' ? 'Public' : 'Internal')
    }
    
    if (activeFilters.length === 0) return 'No filters applied'
    return activeFilters.join(' • ')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading announcements...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Announcements
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  Stay updated with the latest news and updates from Kin clubs across the community.
                </p>
                <p className="text-xs text-gray-500">
                  {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <Link
                href="/announcements/create"
                className="inline-flex items-center px-4 py-2 bg-kin-red text-white rounded-lg hover:bg-kin-red-dark transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Announcement
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Filters */}
      {showFilters && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setFiltersCollapsed(!filtersCollapsed)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors group"
                >
                  <Filter className="h-4 w-4 mr-2 text-kin-red group-hover:text-kin-red-dark transition-colors" />
                  Filters
                  <span className="ml-2">
                    {filtersCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </span>
                </button>
                <div className="text-xs text-gray-500">
                  {getFilterStateText()}
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-kin-red hover:text-kin-red-dark font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
          <div className={`transition-all duration-300 ease-in-out ${
            filtersCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-screen opacity-100'
          }`}>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search content
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by title, content..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors text-sm"
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
              </div>
              
              <div className="mt-4">
                {/* Visibility Filter */}
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'all' | 'public' | 'private')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors text-sm"
                  >
                    <option value="all">All Announcements</option>
                    <option value="public">Public Only</option>
                    <option value="private">Internal Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="p-4 sm:p-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new announcement.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map(announcement => (
              <AnnouncementCard 
                key={announcement.id} 
                announcement={announcement} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
