'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import SocialMediaManager from '@/components/SocialMediaManager'
import FacebookEventImporter from '@/components/FacebookEventImporter'
import { getClubs, getZones, getDistricts, getUserEntityPermissions, getUserRole, Club, Zone, District } from '@/lib/database'
import { Share2, Users, Download, Info } from 'lucide-react'

export default function SocialMediaPage() {
  const { user, loading: authLoading } = useAuth()
  const [entities, setEntities] = useState<Array<{
    id: string
    name: string
    type: 'club' | 'zone' | 'district'
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      loadData()
    } else if (!authLoading && !user) {
      // Redirect to sign in if not authenticated
      window.location.href = '/signin'
    }
  }, [user, authLoading])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (!user?.email) return
      
      // Get user role first
      const userRole = await getUserRole(user.email)
      
      // Get all entities first
      const [allClubs, allZones, allDistricts] = await Promise.all([
        getClubs(),
        getZones(),
        getDistricts()
      ])
      
      // Combine all entities into a single list
      const allEntities: Array<{
        id: string
        name: string
        type: 'club' | 'zone' | 'district'
      }> = []
      
      // If user is superuser, show all entities
      if (userRole?.role === 'superuser') {
        allClubs.forEach(club => allEntities.push({ id: club.id, name: club.name, type: 'club' }))
        allZones.forEach(zone => allEntities.push({ id: zone.id, name: zone.name, type: 'zone' }))
        allDistricts.forEach(district => allEntities.push({ id: district.id, name: district.name, type: 'district' }))
        setEntities(allEntities)
        return
      }
      
      // For regular users, filter based on entity permissions
      const userPermissions = await getUserEntityPermissions(user.email)
      
      // Filter based on user permissions
      for (const permission of userPermissions) {
        if (permission.entity_type === 'club') {
          const club = allClubs.find(c => c.id === permission.entity_id)
          if (club) allEntities.push({ id: club.id, name: club.name, type: 'club' })
        } else if (permission.entity_type === 'zone') {
          const zone = allZones.find(z => z.id === permission.entity_id)
          if (zone) allEntities.push({ id: zone.id, name: zone.name, type: 'zone' })
        } else if (permission.entity_type === 'district') {
          const district = allDistricts.find(d => d.id === permission.entity_id)
          if (district) allEntities.push({ id: district.id, name: district.name, type: 'district' })
        }
      }
      
      setEntities(allEntities)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Share2 className="h-8 w-8 mr-3 text-blue-600" />
              Social Media Management
            </h1>
            <p className="text-gray-600">
              Connect your Facebook pages to import events and automatically post to social media
            </p>
          </div>

          {/* Facebook Event Import */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Download className="h-6 w-6 mr-2" />
              Import Facebook Posts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FacebookEventImporter
                key="fonthill-test"
                entityType="club"
                entityId="5d2f87c6-0334-4866-a4c4-858e988afa7f"
                entityName="Fonthill And District Kinsmen Club"
              />
            </div>
          </div>

          {/* Social Media Managers */}
          {entities.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Users className="h-6 w-6 mr-2" />
                Club Connections
              </h2>
              <div className="flex items-center mb-6">
                <p className="text-gray-600 mr-2">
                  Connect your Facebook pages to automatically post events and announcements.
                </p>
                <div className="relative group">
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    <div className="text-left">
                      <div className="font-semibold mb-1">How it works</div>
                      <ul className="space-y-1 text-xs">
                        <li>• Connect your Facebook pages to enable automatic posting</li>
                        <li>• When creating events or announcements, you can choose to post to Facebook</li>
                        <li>• Posts will be published to your connected Facebook pages</li>
                        <li>• You can disconnect accounts at any time</li>
                      </ul>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entities.map((entity) => (
                  <SocialMediaManager
                    key={entity.id}
                    entityType={entity.type}
                    entityId={entity.id}
                    entityName={entity.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
