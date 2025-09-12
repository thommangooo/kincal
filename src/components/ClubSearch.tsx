'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Users, MapPin, Building } from 'lucide-react'
import { getClubsWithUsageStatus, getZonesWithUsageStatus, getDistrictsWithUsageStatus, Club, Zone, District } from '@/lib/database'

interface ClubSearchProps {
  value: string
  onChange: (entityId: string, entityType: 'club' | 'zone' | 'district') => void
  placeholder?: string
  className?: string
}

type SearchableEntity = 
  | (Club & { isActive: boolean, entityType: 'club' })
  | (Zone & { isActive: boolean, displayName: string, entityType: 'zone' })
  | (District & { isActive: boolean, entityType: 'district' })

export default function ClubSearch({ value, onChange, placeholder = "Search for a club, zone, or district...", className = "" }: ClubSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [entities, setEntities] = useState<SearchableEntity[]>([])
  const [filteredEntities, setFilteredEntities] = useState<SearchableEntity[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [selectedEntity, setSelectedEntity] = useState<SearchableEntity | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load all entities on mount
  useEffect(() => {
    const loadEntities = async () => {
      try {
        const [clubsData, zonesData, districtsData] = await Promise.all([
          getClubsWithUsageStatus(),
          getZonesWithUsageStatus(),
          getDistrictsWithUsageStatus()
        ])

        // Combine all entities with their types
        const allEntities: SearchableEntity[] = [
          ...clubsData.map(club => ({ ...club, entityType: 'club' as const })),
          ...zonesData.map(zone => ({ ...zone, entityType: 'zone' as const })),
          ...districtsData.map(district => ({ ...district, entityType: 'district' as const }))
        ]

        setEntities(allEntities)
      } catch (error) {
        console.error('Error loading entities:', error)
      }
    }
    loadEntities()
  }, [])

  // Filter entities based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEntities([])
      return
    }

    const filtered = entities.filter(entity => {
      const searchLower = searchTerm.toLowerCase()
      
      if (entity.entityType === 'club') {
        return entity.name.toLowerCase().includes(searchLower)
      } else if (entity.entityType === 'zone') {
        return entity.displayName.toLowerCase().includes(searchLower) || 
               entity.name.toLowerCase().includes(searchLower)
      } else if (entity.entityType === 'district') {
        return entity.name.toLowerCase().includes(searchLower)
      }
      return false
    }).slice(0, 10) // Limit to 10 results for performance

    setFilteredEntities(filtered)
    setSelectedIndex(-1)
  }, [searchTerm, entities])

  // Set initial search term when value changes
  useEffect(() => {
    if (value) {
      const entity = entities.find(e => e.id === value)
      if (entity) {
        setSelectedEntity(entity)
        if (entity.entityType === 'club') {
          setSearchTerm(entity.name)
        } else if (entity.entityType === 'zone') {
          setSearchTerm(entity.displayName)
        } else if (entity.entityType === 'district') {
          setSearchTerm(entity.name)
        }
      }
    } else {
      setSearchTerm('')
      setSelectedEntity(null)
    }
  }, [value, entities])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    setIsOpen(term.length > 0)
    
    // Clear selection if user is typing
    if (value && selectedEntity) {
      const currentDisplayName = selectedEntity.entityType === 'zone' 
        ? selectedEntity.displayName 
        : selectedEntity.name
      if (term !== currentDisplayName) {
        onChange('', 'club') // Reset to club type for backward compatibility
      }
    }
  }

  const handleEntitySelect = (entity: SearchableEntity) => {
    const displayName = entity.entityType === 'zone' ? entity.displayName : entity.name
    setSearchTerm(displayName)
    setSelectedEntity(entity)
    onChange(entity.id, entity.entityType)
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setSearchTerm('')
    setSelectedEntity(null)
    onChange('', 'club') // Reset to club type for backward compatibility
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredEntities.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredEntities.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredEntities.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredEntities.length) {
          handleEntitySelect(filteredEntities[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleFocus = () => {
    if (searchTerm.length > 0) {
      setIsOpen(true)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on dropdown
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kin-red focus:border-transparent transition-colors text-sm"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredEntities.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredEntities.map((entity, index) => {
            const isActive = entity.isActive
            const isSelected = index === selectedIndex
            
            return (
              <button
                key={`${entity.entityType}-${entity.id}`}
                onClick={() => handleEntitySelect(entity)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center ${
                  isSelected ? 'bg-gray-50' : ''
                } ${!isActive ? 'opacity-60' : ''}`}
              >
                {entity.entityType === 'club' && (
                  <Users className={`h-4 w-4 mr-3 flex-shrink-0 ${isActive ? 'text-gray-400' : 'text-gray-300'}`} />
                )}
                {entity.entityType === 'zone' && (
                  <MapPin className={`h-4 w-4 mr-3 flex-shrink-0 ${isActive ? 'text-gray-400' : 'text-gray-300'}`} />
                )}
                {entity.entityType === 'district' && (
                  <Building className={`h-4 w-4 mr-3 flex-shrink-0 ${isActive ? 'text-gray-400' : 'text-gray-300'}`} />
                )}
                <div className="flex-1">
                  <div className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {entity.entityType === 'zone' ? entity.displayName : entity.name}
                  </div>
                  {entity.entityType === 'club' && entity.zone && (
                    <div className="text-sm text-gray-500">
                      {entity.zone.name} • {entity.zone.district?.name}
                    </div>
                  )}
                  <div className="flex items-center mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isActive ? 'Active on KinCal' : 'Not using KinCal'}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {isOpen && searchTerm.length > 0 && filteredEntities.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No clubs, zones, or districts found matching &ldquo;{searchTerm}&rdquo;
        </div>
      )}
    </div>
  )
}
