'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getZones, getClubs, getUserRole } from '@/lib/database'
import Header from '@/components/Header'
import { Monitor, Calendar, Megaphone, Code, Copy, Check, Users, Building } from 'lucide-react'

interface UserEntity {
  type: 'club' | 'zone' | 'district'
  id: string
  name: string
}

export default function WidgetsPage() {
  const { user, loading: authLoading } = useAuth()
  const [userEntities, setUserEntities] = useState<UserEntity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<UserEntity | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user's entities
  useEffect(() => {
    const loadUserEntities = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const [zones, clubs, userRole] = await Promise.all([
          getZones(),
          getClubs(),
          getUserRole(user.email)
        ])

        const entities: UserEntity[] = []

        // Add user's club if they have one
        if (userRole?.club_id) {
          const club = clubs.find(c => c.id === userRole.club_id)
          if (club) {
            entities.push({
              type: 'club',
              id: club.id,
              name: club.name
            })
          }
        }

        // Add user's zone if they have one
        if (userRole?.zone_id) {
          const zone = zones.find(z => z.id === userRole.zone_id)
          if (zone) {
            entities.push({
              type: 'zone',
              id: zone.id,
              name: zone.name
            })
          }
        }

        // Add user's district if they have one
        if (userRole?.district_id) {
          entities.push({
            type: 'district',
            id: userRole.district_id,
            name: `District ${userRole.district_id}`
          })
        }

        setUserEntities(entities)
        
        // Auto-select if only one entity
        if (entities.length === 1) {
          setSelectedEntity(entities[0])
        }
      } catch (error) {
        console.error('Error loading user entities:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserEntities()
  }, [user])

  // Generate embed URL for a widget
  const generateEmbedUrl = (widgetType: 'calendar' | 'announcements', params: {
    visibility?: 'public' | 'internal-use' | 'all'
    showFilters?: boolean
  } = {}) => {
    if (!selectedEntity) return ''

    const baseUrl = `${window.location.origin}/embed/${widgetType}`
    const urlParams = new URLSearchParams()
    
    // Add entity parameter
    urlParams.set(selectedEntity.type, selectedEntity.id)
    
    // Add optional parameters
    if (params.visibility && params.visibility !== 'all') {
      urlParams.set('visibility', params.visibility)
    }
    
    if (params.showFilters !== undefined) {
      urlParams.set('showFilters', params.showFilters.toString())
    }

    return `${baseUrl}?${urlParams.toString()}`
  }

  // Generate iframe embed code
  const generateEmbedCode = (widgetType: 'calendar' | 'announcements', params: {
    visibility?: 'public' | 'internal-use' | 'all'
    showFilters?: boolean
    width?: string
    height?: string
  } = {}) => {
    const url = generateEmbedUrl(widgetType, params)
    const width = params.width || '100%'
    const height = params.height || '600'
    
    return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" style="border: 1px solid #ccc;"></iframe>`
  }

  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string, codeType: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(codeType)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading widgets...</p>
          </div>
        </div>
      </div>
    )
  }

  // Public view for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Monitor className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Kin Widgets</h1>
              <p className="text-lg text-gray-600 mb-6">
                Embed Kin calendar and announcements directly into your club&apos;s website
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Widgets</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-200 rounded-lg p-6">
                  <Calendar className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Widget</h3>
                  <p className="text-gray-600 mb-4">
                    Display upcoming events and activities for your club, zone, or district.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Filter by club, zone, or district</li>
                    <li>• Show public or internal events</li>
                    <li>• Customizable display options</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <Megaphone className="h-8 w-8 text-green-600 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Announcements Widget</h3>
                  <p className="text-gray-600 mb-4">
                    Share important announcements and updates with your members.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Rich text announcements</li>
                    <li>• Image support</li>
                    <li>• Priority-based ordering</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <Users className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium text-blue-900 mb-2">Getting Started</h3>
                    <p className="text-blue-800 mb-3">
                      To access widget configuration and embed codes, a registered user from your club must sign in.
                    </p>
                    <p className="text-sm text-blue-700">
                      Contact your club administrator or <a href="/signin" className="underline hover:text-blue-900">sign in</a> if you have an account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Authenticated user view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Monitor className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Kin Widgets</h1>
            <p className="text-lg text-gray-600">
              Embed Kin calendar and announcements into your club&apos;s website
            </p>
          </div>

          {/* Entity Selector */}
          {userEntities.length > 1 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Select Entity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {userEntities.map((entity) => (
                  <button
                    key={`${entity.type}-${entity.id}`}
                    onClick={() => setSelectedEntity(entity)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedEntity?.type === entity.type && selectedEntity?.id === entity.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{entity.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{entity.type}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedEntity && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Calendar Widget */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Calendar Widget</h2>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Preview</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="text-center text-gray-500 py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Calendar widget preview</p>
                      <p className="text-sm">Shows events for {selectedEntity.name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Embed Code
                    </label>
                    <div className="flex space-x-2">
                      <textarea
                        value={generateEmbedCode('calendar')}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        rows={3}
                      />
                      <button
                        onClick={() => copyToClipboard(generateEmbedCode('calendar'), 'calendar')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedCode === 'calendar' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Direct URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={generateEmbedUrl('calendar')}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(generateEmbedUrl('calendar'), 'calendar-url')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedCode === 'calendar-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcements Widget */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <Megaphone className="h-6 w-6 text-green-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Announcements Widget</h2>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Preview</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="text-center text-gray-500 py-8">
                      <Megaphone className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>Announcements widget preview</p>
                      <p className="text-sm">Shows announcements for {selectedEntity.name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Embed Code
                    </label>
                    <div className="flex space-x-2">
                      <textarea
                        value={generateEmbedCode('announcements')}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        rows={3}
                      />
                      <button
                        onClick={() => copyToClipboard(generateEmbedCode('announcements'), 'announcements')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedCode === 'announcements' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Direct URL
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={generateEmbedUrl('announcements')}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(generateEmbedUrl('announcements'), 'announcements-url')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedCode === 'announcements-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Embedding Instructions
            </h2>
            <div className="prose max-w-none">
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Copy the embed code for the widget you want to use</li>
                <li>Paste it into your website&apos;s HTML where you want the widget to appear</li>
                <li>Adjust the width and height attributes as needed for your layout</li>
                <li>The widget will automatically load content for {selectedEntity?.name || 'your selected entity'}</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
