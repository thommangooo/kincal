'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventFormSchema, EventFormData } from '@/lib/validations'
import { createEvent } from '@/lib/database'
import { getDistricts, getZones, getClubs, getUserRole, District, Zone, Club } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'
import EntitySelector from '@/components/EntitySelector'
import { Calendar, MapPin, Users, Globe, Lock } from 'lucide-react'

export default function CreateEventPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [districts, setDistricts] = useState<District[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<{type: 'club' | 'zone' | 'district', id: string} | null>(null)
  const [userRole, setUserRole] = useState<'superuser' | 'editor' | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      visibility: 'public',
      tags: []
    }
  })

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return
      
      try {
        console.log('Loading initial data...')
        const [districtsData, zonesData, clubsData, role] = await Promise.all([
          getDistricts(),
          getZones(),
          getClubs(),
          getUserRole(user.email)
        ])
        console.log('Loaded data:', { districts: districtsData.length, zones: zonesData.length, clubs: clubsData.length, role })
        setDistricts(districtsData)
        setZones(zonesData)
        setClubs(clubsData)
        setUserRole(role)
      } catch (error) {
        console.error('Error loading data:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          error: error
        })
      }
    }
    loadData()
  }, [user])

  // Auto-populate end date when start date changes
  const watchedStartDate = watch('start_date')
  useEffect(() => {
    if (watchedStartDate) {
      setValue('end_date', watchedStartDate)
    }
  }, [watchedStartDate, setValue])

  const onSubmit = async (data: EventFormData) => {
    if (!selectedEntity) {
      alert('Please select an entity to post on behalf of')
      return
    }

    setLoading(true)
    try {
      // Combine date and time (use default times if not provided)
      const startDateTime = data.start_time 
        ? new Date(`${data.start_date}T${data.start_time}`)
        : new Date(`${data.start_date}T00:00:00`)
      const endDateTime = data.end_time 
        ? new Date(`${data.end_date}T${data.end_time}`)
        : new Date(`${data.end_date}T23:59:59`)

      // Get the related IDs based on the selected entity
      let clubId = '', zoneId = '', districtId = ''
      
      if (selectedEntity.type === 'club') {
        const club = clubs.find(c => c.id === selectedEntity.id)
        clubId = selectedEntity.id
        zoneId = club?.zone_id || ''
        districtId = club?.district_id || ''
      } else if (selectedEntity.type === 'zone') {
        const zone = zones.find(z => z.id === selectedEntity.id)
        zoneId = selectedEntity.id
        districtId = zone?.district_id || ''
      } else if (selectedEntity.type === 'district') {
        districtId = selectedEntity.id
      }

      const eventData = {
        title: data.title,
        description: data.description || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: data.location || null,
        club_id: clubId,
        zone_id: zoneId,
        district_id: districtId,
        entity_type: selectedEntity.type,
        entity_id: selectedEntity.id,
        visibility: 'public',
        tags: data.tags || [],
        event_url: data.event_url || null,
        image_url: imageUrl,
        created_by_email: user?.email || 'demo@example.com'
      }

      await createEvent(eventData)
      router.push('/')
    } catch (error) {
      console.error('Error creating event:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      console.error('Event data that failed:', {
        title: data.title,
        club_id: data.club_id,
        zone_id: data.zone_id,
        district_id: data.district_id
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
            <p className="text-gray-600">Share your Kin club event with the community</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Basic Information */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title *
                    </label>
                    <input
                      {...register('title')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter event title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your event..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        {...register('location')}
                        type="text"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Event location"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Date & Time
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      {...register('start_date')}
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.start_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time (optional)
                    </label>
                    <input
                      {...register('start_time')}
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.start_time && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      {...register('end_date')}
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.end_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time (optional)
                    </label>
                    <input
                      {...register('end_time')}
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.end_time && (
                      <p className="mt-1 text-sm text-red-600">{errors.end_time.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Entity Selection */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Posting On Behalf Of
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <EntitySelector
                      userEmail={user?.email || ''}
                      userRole={userRole || 'editor'}
                      selectedEntity={selectedEntity}
                      onEntitySelect={setSelectedEntity}
                    />
                    {!selectedEntity && (
                      <p className="mt-1 text-sm text-red-600">Please select an organization to post on behalf of</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Visibility and Additional Info */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                
                <div className="space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event URL
                    </label>
                    <input
                      {...register('event_url')}
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/event"
                    />
                    {errors.event_url && (
                      <p className="mt-1 text-sm text-red-600">{errors.event_url.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Image
                    </label>
                    <ImageUpload
                      value={imageUrl}
                      onChange={setImageUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
