'use client'

import { useState, useEffect } from 'react'
import { getUserEntityPermissions, getDistricts, getZones, getClubs, UserEntityPermission, District, Zone, Club } from '@/lib/database'
import { Building, Users, MapPin } from 'lucide-react'

interface EntitySelectorProps {
  userEmail: string
  userRole: 'superuser' | 'editor'
  selectedEntity: { type: 'club' | 'zone' | 'district'; id: string } | null
  onEntitySelect: (entity: { type: 'club' | 'zone' | 'district'; id: string } | null) => void
  className?: string
}

export default function EntitySelector({ userEmail, userRole, selectedEntity, onEntitySelect, className = '' }: EntitySelectorProps) {
  const [permissions, setPermissions] = useState<UserEntityPermission[]>([])
  const [allEntities, setAllEntities] = useState<{clubs: Club[], zones: Zone[], districts: District[]}>({clubs: [], zones: [], districts: []})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        if (userRole === 'superuser') {
          // Superusers can see all entities
          const [clubs, zones, districts] = await Promise.all([
            getClubs(),
            getZones(), 
            getDistricts()
          ])
          setAllEntities({ clubs, zones, districts })
        } else {
          // Editors can only see entities they have permissions for
          const userPermissions = await getUserEntityPermissions(userEmail)
          setPermissions(userPermissions)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [userEmail, userRole])

  const getEntityIcon = (type: 'club' | 'zone' | 'district') => {
    switch (type) {
      case 'club':
        return <Users className="h-4 w-4" />
      case 'zone':
        return <MapPin className="h-4 w-4" />
      case 'district':
        return <Building className="h-4 w-4" />
    }
  }

  const getEntityName = (permission: UserEntityPermission) => {
    switch (permission.entity_type) {
      case 'club':
        return (permission.entity as any)?.name || 'Unknown Club'
      case 'zone':
        return (permission.entity as any)?.name || 'Unknown Zone'
      case 'district':
        return (permission.entity as any)?.name || 'Unknown District'
    }
  }

  const getEntityDescription = (permission: UserEntityPermission) => {
    switch (permission.entity_type) {
      case 'club':
        const club = permission.entity as any
        return `${club?.zone?.name || 'Unknown Zone'} • ${club?.district?.name || 'Unknown District'}`
      case 'zone':
        const zone = permission.entity as any
        return `${zone?.district?.name || 'Unknown District'}`
      case 'district':
        const district = permission.entity as any
        return `${district?.province || 'Unknown Province'}`
    }
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posting on behalf of
        </label>
        <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
      </div>
    )
  }

  // For editors, check if they have permissions
  if (userRole === 'editor' && permissions.length === 0) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posting on behalf of
        </label>
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            No posting permissions found. Please contact an administrator to assign entity permissions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Organization *
      </label>
      <div className="space-y-2">
        {userRole === 'superuser' ? (
          // Superusers see all entities
          <>
            {/* Districts */}
            {allEntities.districts.map((district) => {
              const isSelected = selectedEntity?.type === 'district' && selectedEntity?.id === district.id
              return (
                <button
                  key={`district-${district.id}`}
                  type="button"
                  onClick={() => onEntitySelect({ type: 'district', id: district.id })}
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      {getEntityIcon('district')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{district.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          district
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{district.province}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
            
            {/* Zones */}
            {allEntities.zones.map((zone) => {
              const isSelected = selectedEntity?.type === 'zone' && selectedEntity?.id === zone.id
              return (
                <button
                  key={`zone-${zone.id}`}
                  type="button"
                  onClick={() => onEntitySelect({ type: 'zone', id: zone.id })}
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      {getEntityIcon('zone')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{zone.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          zone
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Zone {zone.zone_letter} • {(zone as any).district?.name || 'Unknown District'}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
            
            {/* Clubs */}
            {allEntities.clubs.map((club) => {
              const isSelected = selectedEntity?.type === 'club' && selectedEntity?.id === club.id
              return (
                <button
                  key={`club-${club.id}`}
                  type="button"
                  onClick={() => onEntitySelect({ type: 'club', id: club.id })}
                  className={`w-full p-4 text-left border rounded-lg transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      {getEntityIcon('club')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{club.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          club
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{(club as any).zone?.name || 'Unknown Zone'} • {(club as any).district?.name || 'Unknown District'}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </>
        ) : (
          // Editors see only their permitted entities
          permissions.map((permission) => {
            const isSelected = selectedEntity?.type === permission.entity_type && selectedEntity?.id === permission.entity_id
            
            return (
              <button
                key={permission.id}
                type="button"
                onClick={() => onEntitySelect({
                  type: permission.entity_type,
                  id: permission.entity_id
                })}
                className={`w-full p-4 text-left border rounded-lg transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getEntityIcon(permission.entity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {getEntityName(permission)}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        permission.entity_type === 'club' ? 'bg-green-100 text-green-800' :
                        permission.entity_type === 'zone' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {permission.entity_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getEntityDescription(permission)}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
      
      {selectedEntity && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> You will be posting on behalf of{' '}
            {userRole === 'superuser' ? (
              // For superusers, find the entity from allEntities
              selectedEntity.type === 'club' ? 
                allEntities.clubs.find(c => c.id === selectedEntity.id)?.name :
              selectedEntity.type === 'zone' ?
                allEntities.zones.find(z => z.id === selectedEntity.id)?.name :
                allEntities.districts.find(d => d.id === selectedEntity.id)?.name
            ) : (
              // For editors, find the entity from permissions
              permissions.find(p => p.entity_type === selectedEntity.type && p.entity_id === selectedEntity.id)?.entity?.name
            ) || 'selected entity'}
          </p>
        </div>
      )}
    </div>
  )
}
