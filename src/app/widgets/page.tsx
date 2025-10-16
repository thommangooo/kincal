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
  
  // Widget configuration state
  const [widgetConfig, setWidgetConfig] = useState({
    calendarScope: 'club-only' as 'club-only' | 'club-and-zone' | 'all-clubs-in-zone', // Calendar scope options
    showFilters: true,
    visibility: 'all' as 'all' | 'public' | 'internal-use'
  })

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
  const generateEmbedUrl = (widgetType: 'calendar' | 'announcements') => {
    if (!selectedEntity) return ''

    const baseUrl = `${window.location.origin}/embed/${widgetType}`
    const urlParams = new URLSearchParams()
    
    // Add widget configuration parameters
    if (widgetConfig.visibility !== 'all') {
      urlParams.set('visibility', widgetConfig.visibility)
    }
    urlParams.set('showFilters', widgetConfig.showFilters.toString())
    
    // Handle calendar scope for calendar widget
    if (widgetType === 'calendar') {
      switch (widgetConfig.calendarScope) {
        case 'club-only':
          // Find the user's club and set club parameter
          const userClub = userEntities.find(e => e.type === 'club')
          if (userClub) {
            urlParams.set('club', userClub.id)
          }
          break
        case 'club-and-zone':
          // Set both club and zone parameters
          const club = userEntities.find(e => e.type === 'club')
          const zone = userEntities.find(e => e.type === 'zone')
          if (club) urlParams.set('club', club.id)
          if (zone) urlParams.set('zone', zone.id)
          break
        case 'all-clubs-in-zone':
          // Set zone parameter to show all clubs in the zone
          const userZone = userEntities.find(e => e.type === 'zone')
          if (userZone) {
            urlParams.set('zone', userZone.id)
          }
          break
      }
    } else {
      // For announcements, use the selected entity
      urlParams.set(selectedEntity.type, selectedEntity.id)
    }
    
    return `${baseUrl}?${urlParams.toString()}`
  }

  // Generate direct link URL for club pages
  const generateDirectLinkUrl = (widgetType: 'calendar' | 'announcements') => {
    if (!selectedEntity) return ''

    // For direct links, we only support club-level pages
    const userClub = userEntities.find(e => e.type === 'club')
    if (!userClub) return ''

    const baseUrl = `${window.location.origin}/club/${userClub.id}/${widgetType}`
    const urlParams = new URLSearchParams()
    
    // Add widget configuration parameters
    if (widgetConfig.visibility !== 'all') {
      urlParams.set('visibility', widgetConfig.visibility)
    }
    urlParams.set('showFilters', widgetConfig.showFilters.toString())
    
    // Add return URL parameter (clubs can customize this)
    // Note: URLSearchParams.set() automatically encodes values, so don't use encodeURIComponent
    urlParams.set('returnUrl', window.location.origin)
    
    // Handle calendar scope for calendar widget
    if (widgetType === 'calendar') {
      switch (widgetConfig.calendarScope) {
        case 'club-only':
          // For club-only, no additional parameters needed (defaults to club)
          break
        case 'club-and-zone':
          // Set zone parameter
          const zone = userEntities.find(e => e.type === 'zone')
          if (zone) urlParams.set('zone', zone.id)
          break
        case 'all-clubs-in-zone':
          // Set zone parameter to show all clubs in the zone
          const userZone = userEntities.find(e => e.type === 'zone')
          if (userZone) {
            urlParams.set('zone', userZone.id)
          }
          break
      }
    }
    
    return `${baseUrl}?${urlParams.toString()}`
  }

  // Generate iframe embed code
  const generateEmbedCode = (widgetType: 'calendar' | 'announcements', width: string = '100%', height: string = '600') => {
    const url = generateEmbedUrl(widgetType)
    
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

          {/* Widget Configuration */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Widget Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Calendar Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which calendar(s)?
                </label>
                <select
                  value={widgetConfig.calendarScope}
                  onChange={(e) => setWidgetConfig(prev => ({ ...prev, calendarScope: e.target.value as 'club-only' | 'club-and-zone' | 'all-clubs-in-zone' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="club-only">Club Only</option>
                  <option value="club-and-zone">Club and Zone</option>
                  <option value="all-clubs-in-zone">All Clubs in the Zone + Zone</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {widgetConfig.calendarScope === 'club-only' 
                    ? 'Show events only from your club'
                    : widgetConfig.calendarScope === 'club-and-zone'
                    ? 'Show events from your club and zone'
                    : 'Show events from all clubs in your zone plus zone events'
                  }
                </p>
              </div>

              {/* Visibility Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Visibility
                </label>
                <select
                  value={widgetConfig.visibility}
                  onChange={(e) => setWidgetConfig(prev => ({ ...prev, visibility: e.target.value as 'all' | 'public' | 'internal-use' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Content</option>
                  <option value="public">Public Only</option>
                  <option value="internal-use">Internal Use Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Filter content by visibility level
                </p>
              </div>

              {/* Show Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Controls
                </label>
                <select
                  value={widgetConfig.showFilters ? 'true' : 'false'}
                  onChange={(e) => setWidgetConfig(prev => ({ ...prev, showFilters: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Show Filters</option>
                  <option value="false">Hide Filters</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Whether to show filter controls in the widget
                </p>
              </div>
            </div>
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
            <div className="space-y-8">
              {/* Calendar Widget */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Calendar Widget</h2>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Live Preview</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <iframe
                      src={generateEmbedUrl('calendar')}
                      width="100%"
                      height="600"
                      frameBorder="0"
                      style={{ border: 'none' }}
                      title="Calendar Widget Preview"
                    ></iframe>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Embed Code (iframe)
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
                      Direct Link (for WordPress and sites that don&apos;t support iframes)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={generateDirectLinkUrl('calendar')}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(generateDirectLinkUrl('calendar'), 'calendar-direct')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedCode === 'calendar-direct' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use this URL to link directly to your club&apos;s calendar page. 
                      You can customize the return URL by adding <code className="bg-gray-100 px-1 rounded">returnUrl=YOUR_WEBSITE_URL</code> to the URL.
                    </p>
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
                  <h3 className="font-medium text-gray-900 mb-2">Live Preview</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <iframe
                      src={generateEmbedUrl('announcements')}
                      width="100%"
                      height="600"
                      frameBorder="0"
                      style={{ border: 'none' }}
                      title="Announcements Widget Preview"
                    ></iframe>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Embed Code (iframe)
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
                      Direct Link (for WordPress and sites that don&apos;t support iframes)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={generateDirectLinkUrl('announcements')}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(generateDirectLinkUrl('announcements'), 'announcements-direct')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {copiedCode === 'announcements-direct' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use this URL to link directly to your club&apos;s announcements page. 
                      You can customize the return URL by adding <code className="bg-gray-100 px-1 rounded">returnUrl=YOUR_WEBSITE_URL</code> to the URL.
                    </p>
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
