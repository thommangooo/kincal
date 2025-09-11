'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { ArrowLeft, Plus, Trash2, Building, MapPin, Users, Check, X } from 'lucide-react'

interface EntityPermission {
  id: string
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  entity_name: string
}

interface AvailableEntity {
  id: string
  name: string
  type: 'club' | 'zone' | 'district'
}

export default function UserPermissionsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const [permissions, setPermissions] = useState<EntityPermission[]>([])
  const [availableEntities, setAvailableEntities] = useState<AvailableEntity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadUserData()
    }
  }, [userId])

  const loadUserData = async () => {
    try {
      // Load user info
      const { data: userData, error: userError } = await supabase
        .from('approved_users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError
      setUser(userData)

      // Load user's current permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_entity_permissions')
        .select(`
          id,
          entity_type,
          entity_id,
          club:clubs!entity_id(name),
          zone:zones!entity_id(name),
          district:districts!entity_id(name)
        `)
        .eq('user_email', userData.email)

      if (permissionsError) throw permissionsError

      // Transform permissions data
      const transformedPermissions = permissionsData?.map(p => ({
        id: p.id,
        entity_type: p.entity_type,
        entity_id: p.entity_id,
        entity_name: (p.club as { name: string }[])?.[0]?.name || (p.zone as { name: string }[])?.[0]?.name || (p.district as { name: string }[])?.[0]?.name || 'Unknown'
      })) || []

      setPermissions(transformedPermissions)

      // Load all available entities
      const [clubsRes, zonesRes, districtsRes] = await Promise.all([
        supabase.from('clubs').select('id, name'),
        supabase.from('zones').select('id, name'),
        supabase.from('districts').select('id, name')
      ])

      const allEntities: AvailableEntity[] = [
        ...(clubsRes.data || []).map(c => ({ ...c, type: 'club' as const })),
        ...(zonesRes.data || []).map(z => ({ ...z, type: 'zone' as const })),
        ...(districtsRes.data || []).map(d => ({ ...d, type: 'district' as const }))
      ]

      setAvailableEntities(allEntities)

    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPermission = async (entityId: string, entityType: 'club' | 'zone' | 'district') => {
    if (!user) return // Ensure user exists before proceeding
    
    try {
      const { error } = await supabase
        .from('user_entity_permissions')
        .insert({
          user_email: user.email,
          entity_type: entityType,
          entity_id: entityId
        })

      if (error) throw error
      loadUserData()
    } catch (error) {
      console.error('Error adding permission:', error)
      alert('Error adding permission.')
    }
  }

  const removePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('user_entity_permissions')
        .delete()
        .eq('id', permissionId)

      if (error) throw error
      loadUserData()
    } catch (error) {
      console.error('Error removing permission:', error)
      alert('Error removing permission.')
    }
  }

  const getEntityIcon = (type: 'club' | 'zone' | 'district') => {
    switch (type) {
      case 'club': return <Building className="h-4 w-4" />
      case 'zone': return <MapPin className="h-4 w-4" />
      case 'district': return <Users className="h-4 w-4" />
    }
  }

  const getEntityColor = (type: 'club' | 'zone' | 'district') => {
    switch (type) {
      case 'club': return 'bg-green-100 text-green-800'
      case 'zone': return 'bg-blue-100 text-blue-800'
      case 'district': return 'bg-purple-100 text-purple-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading permissions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">User not found.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Entity Permissions for {user.email}
            </h1>
            <p className="text-gray-600">
              Manage which entities {user.email} can post on behalf of
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Permissions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Current Permissions ({permissions.length})
                </h2>
              </div>
              <div className="p-6">
                {permissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No entity permissions assigned.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getEntityIcon(permission.entity_type)}
                          <div>
                            <p className="font-medium text-gray-900">{permission.entity_name}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEntityColor(permission.entity_type)}`}>
                              {permission.entity_type}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removePermission(permission.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove permission"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Available Entities */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Available Entities
                </h2>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {availableEntities.map((entity) => {
                    const hasPermission = permissions.some(p => p.entity_id === entity.id)
                    return (
                      <div key={`${entity.type}-${entity.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getEntityIcon(entity.type)}
                          <div>
                            <p className="font-medium text-gray-900">{entity.name}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEntityColor(entity.type)}`}>
                              {entity.type}
                            </span>
                          </div>
                        </div>
                        {hasPermission ? (
                          <div className="flex items-center text-green-600">
                            <Check className="h-4 w-4" />
                            <span className="ml-1 text-sm">Assigned</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => addPermission(entity.id, entity.type)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Add permission"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
