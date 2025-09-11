'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventFormSchema, EventFormData } from '@/lib/validations'
import { getEvent, createEvent, updateEvent, getDistricts, getZones, getClubs, getUserRole, District, Zone, Club } from '@/lib/database'
import type { DbEvent } from '@/lib/supabase'
import { toNull } from '@/lib/nullish'
import { useAuth } from '@/contexts/AuthContext'
import EntitySelector from '@/components/EntitySelector'
import ImageUpload from '@/components/ImageUpload'
import Toast from '@/components/Toast'
import { Calendar } from 'lucide-react'

interface EventFormProps {
  mode: 'create' | 'edit'
  eventId?: string
}

export default function EventForm({ mode, eventId }: EventFormProps) {
  const [loading, setLoading] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)
  const [event, setEvent] = useState<DbEvent | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [districts, setDistricts] = useState<District[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'club' | 'zone' | 'district'; id: string } | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'superuser' | 'editor' | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  
  const router = useRouter()
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    watch
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      visibility: 'public',
      tags: []
    }
  })

  // Show toast message
  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (mode === 'edit' && eventId) {
          // Load existing event data for editing
          const [eventData, districtsData, zonesData, clubsData, role] = await Promise.all([
            getEvent(eventId),
            getDistricts(),
            getZones(),
            getClubs(),
            getUserRole(user?.email || '')
          ])
          
          setEvent(eventData)
          setDistricts(districtsData)
          setZones(zonesData)
          setClubs(clubsData)
          setUserRole(role)
          
          // Check if user can edit this event
          if (user?.email !== eventData.created_by_email) {
            showToastMessage('You do not have permission to edit this event')
            router.push('/')
            return
          }
          
          // Set form values
          setValue('title', eventData.title)
          setValue('description', eventData.description || '')
          setValue('location', eventData.location || '')
          setValue('event_url', eventData.event_url || '')
          setValue('tags', eventData.tags || [])
          
          // Set dates
          const startDate = new Date(eventData.start_date)
          const endDate = new Date(eventData.end_date)
          setValue('start_date', startDate.toISOString().split('T')[0])
          setValue('end_date', endDate.toISOString().split('T')[0])
          
          // Set times if they exist in the datetime
          const startTime = startDate.toTimeString().slice(0, 5)
          const endTime = endDate.toTimeString().slice(0, 5)
          
          // Only set times if they're not default all-day times
          if (startTime !== '00:00' || endTime !== '23:59') {
            setValue('start_time', startTime)
            setValue('end_time', endTime)
          }
          
          // Set entity
          setSelectedEntity({
            type: eventData.entity_type,
            id: eventData.entity_id
          })
          
          // Set image
          setImageUrl(eventData.image_url)
        } else {
          // Load data for creating new event
          const [districtsData, zonesData, clubsData, role] = await Promise.all([
            getDistricts(),
            getZones(),
            getClubs(),
            getUserRole(user?.email || '')
          ])
          
          setDistricts(districtsData)
          setZones(zonesData)
          setClubs(clubsData)
          setUserRole(role)
        }
        
      } catch (error) {
        console.error('Error loading data:', error)
        showToastMessage(mode === 'edit' ? 'Error loading event data' : 'Error loading form data')
        if (mode === 'edit') {
          router.push('/')
        }
      } finally {
        setLoading(false)
      }
    }
    
    if (mode === 'create' || (mode === 'edit' && eventId)) {
      loadData()
    }
  }, [mode, eventId, user, router, setValue])

  const onSubmit = async (data: EventFormData) => {
    if (!selectedEntity) {
      showToastMessage('Please select an entity to post on behalf of')
      return
    }

    setSubmitting(true)
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
        visibility: 'public' as const,
        tags: data.tags || null,
        event_url: toNull(data.event_url),
        image_url: imageUrl,
        created_by_email: user?.email || 'demo@example.com'
      }

      if (mode === 'edit' && eventId) {
        await updateEvent(eventId, eventData)
        showToastMessage('Event updated successfully!')
      } else {
        await createEvent(eventData)
        showToastMessage('Event created successfully!')
      }
      
      router.push('/')
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} event:`, error)
      showToastMessage(`Error ${mode === 'edit' ? 'updating' : 'creating'} event`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (mode === 'edit' && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600">The event you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'edit' ? 'Edit Event' : 'Create New Event'}
            </h1>
            <p className="text-gray-600">
              {mode === 'edit' ? 'Update your event details' : 'Share your Kin club event with the community'}
            </p>
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
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your event..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Entity Selection */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Posting Entity</h2>
                <EntitySelector
                  userEmail={user?.email || ''}
                  userRole={userRole || 'editor'}
                  selectedEntity={selectedEntity}
                  onEntitySelect={setSelectedEntity}
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
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
                      End Date *
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time (Optional)
                    </label>
                    <input
                      {...register('start_time')}
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave blank for all-day events</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time (Optional)
                    </label>
                    <input
                      {...register('end_time')}
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave blank for all-day events</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      {...register('location')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Event location"
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                    )}
                  </div>

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
                      Tags
                    </label>
                    <input
                      {...register('tags')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter tags separated by commas"
                    />
                    <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
                    {errors.tags && (
                      <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
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
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
