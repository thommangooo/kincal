'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventFormSchema, EventFormData } from '@/lib/validations'
import { getEvent, createEvent, updateEvent, getDistricts, getZones, getClubs, getUserRole, District, Zone, Club } from '@/lib/database'
import { getSocialMediaAccounts } from '@/lib/socialMedia'
import type { DbEvent } from '@/lib/supabase'
import { toNull } from '@/lib/nullish'
import { useAuth } from '@/contexts/AuthContext'
import EntitySelector from '@/components/EntitySelector'
import ImageUpload from '@/components/ImageUpload'
import Toast from '@/components/Toast'
import { Calendar, Users } from 'lucide-react'
// Removed dateUtils imports - using standard Date objects now

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
  const [userRole, setUserRole] = useState<{
    role: 'superuser' | 'editor'
    club_id?: string
    zone_id?: string
    district_id?: string
  } | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [socialMediaAccounts, setSocialMediaAccounts] = useState<any[]>([])
  const [postToFacebook, setPostToFacebook] = useState(false)
  
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
      visibility: 'public'
    }
  })

  // Show toast message
  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  const loadSocialMediaAccounts = async () => {
    if (selectedEntity) {
      try {
        const accounts = await getSocialMediaAccounts(selectedEntity.type, selectedEntity.id)
        setSocialMediaAccounts(accounts)
      } catch (error) {
        console.error('Error loading social media accounts:', error)
      }
    }
  }

  const postEventToFacebook = async (eventId: string, eventData: EventFormData, accounts: any[]) => {
    // Post to each connected Facebook page
    for (const account of accounts) {
      try {
        const response = await fetch('/api/social-media/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: account.id,
            eventData: {
              title: eventData.title,
              description: eventData.description || '',
              start_date: eventData.start_date,
              end_date: eventData.end_date,
              location: eventData.location || '',
              image_url: imageUrl
            },
            eventId: eventId
          })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to post to ${account.account_name}`)
        }
      } catch (error) {
        console.error(`Error posting to ${account.account_name}:`, error)
        throw error
      }
    }
  }

  // Load social media accounts when entity changes
  useEffect(() => {
    loadSocialMediaAccounts()
  }, [selectedEntity])

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
            user?.email ? getUserRole(user.email) : Promise.resolve(null)
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
          
          // Extract dates and times from datetime fields
          const startDateObj = new Date(eventData.start_date)
          const endDateObj = new Date(eventData.end_date)
          
          // Extract the actual date parts from the stored datetime
          // This ensures we get the exact date that was originally entered
          const startYear = startDateObj.getFullYear()
          const startMonth = String(startDateObj.getMonth() + 1).padStart(2, '0')
          const startDay = String(startDateObj.getDate()).padStart(2, '0')
          const endYear = endDateObj.getFullYear()
          const endMonth = String(endDateObj.getMonth() + 1).padStart(2, '0')
          const endDay = String(endDateObj.getDate()).padStart(2, '0')
          
          // Set dates using the exact date that was stored
          setValue('start_date', `${startYear}-${startMonth}-${startDay}`)
          setValue('end_date', `${endYear}-${endMonth}-${endDay}`)
          
          // Set times if this is not an all-day event
          // Check if it's an all-day event (starts at midnight and ends at 23:59)
          const isAllDayEvent = startDateObj.getHours() === 0 && startDateObj.getMinutes() === 0 && 
                               endDateObj.getHours() === 23 && endDateObj.getMinutes() === 59
          
          if (!isAllDayEvent) {
            // Extract time components and format as HH:MM
            const startHour = String(startDateObj.getHours()).padStart(2, '0')
            const startMinute = String(startDateObj.getMinutes()).padStart(2, '0')
            const endHour = String(endDateObj.getHours()).padStart(2, '0')
            const endMinute = String(endDateObj.getMinutes()).padStart(2, '0')
            
            setValue('start_time', `${startHour}:${startMinute}`)
            setValue('end_time', `${endHour}:${endMinute}`)
          }
          
          // Set entity
          setSelectedEntity({
            type: eventData.entity_type,
            id: eventData.entity_id
          })
          
          // Set image
          setImageUrl(eventData.image_url || null)
        } else {
          // Load data for creating new event
          const [districtsData, zonesData, clubsData, role] = await Promise.all([
            getDistricts(),
            getZones(),
            getClubs(),
            user?.email ? getUserRole(user.email) : Promise.resolve(null)
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
      showToastMessage('Please select an organization to post on behalf of')
      return
    }


    setSubmitting(true)
    try {
      // Store dates and times separately - much simpler!
      // For all-day events, we'll store just the date and null times
      // For timed events, we'll store both date and time
      
      // Convert date strings to datetime for database storage
      let startDateTime: string
      let endDateTime: string
      
      if (data.start_time && data.end_time) {
        // Timed event - combine date and time
        startDateTime = new Date(`${data.start_date}T${data.start_time}:00`).toISOString()
        endDateTime = new Date(`${data.end_date}T${data.end_time}:00`).toISOString()
      } else {
        // All-day event - store as local dates to preserve the intended date
        // Parse dates manually and create local dates
        const [startYear, startMonth, startDay] = data.start_date.split('-').map(Number)
        const [endYear, endMonth, endDay] = data.end_date.split('-').map(Number)
        
        // Create local dates for the same day (start at 00:00 local, end at 23:59 local)
        const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0)
        const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59)
        
        startDateTime = startDate.toISOString()
        endDateTime = endDate.toISOString()
      }

      // Get the related IDs based on the selected entity
      let clubId: string | null = ''
      let zoneId: string | null = ''
      let districtId: string = ''
      
      console.log('Selected entity:', selectedEntity)
      console.log('Available clubs:', clubs)
      console.log('Available zones:', zones)
      
      switch (selectedEntity.type) {
        case 'club':
          clubId = selectedEntity.id
          // Find the club to get its zone and district
          const club = clubs.find(c => c.id === selectedEntity.id)
          if (club) {
            zoneId = club.zone_id
            const clubZone = zones.find(z => z.id === club.zone_id)
            if (clubZone) {
              districtId = clubZone.district_id
            }
          }
          console.log('Club found:', club)
          break
        case 'zone':
          zoneId = selectedEntity.id
          // Find the zone to get its district
          const zone = zones.find(z => z.id === selectedEntity.id)
          if (zone) {
            districtId = zone.district_id
          }
          // For zone events, don't assign to a specific club
          clubId = null
          console.log('Zone found:', zone)
          break
        case 'district':
          districtId = selectedEntity.id
          // For district events, don't assign to a specific club or zone
          clubId = null
          zoneId = null
          break
      }
      
      console.log('Derived IDs:', { clubId, zoneId, districtId })

      // Validate that we have the required ID for the selected entity type
      if (selectedEntity.type === 'club' && !clubId) {
        throw new Error('Unable to determine club ID. Please try selecting a different club or contact an administrator.')
      }
      if (selectedEntity.type === 'zone' && !zoneId) {
        throw new Error('Unable to determine zone ID. Please try selecting a different zone or contact an administrator.')
      }
      if (selectedEntity.type === 'district' && !districtId) {
        throw new Error('Unable to determine district ID. Please try selecting a different district or contact an administrator.')
      }

      const eventData = {
        title: data.title,
        description: data.description || null,
        start_date: startDateTime,
        end_date: endDateTime,
        location: data.location || null,
        club_id: clubId,
        zone_id: zoneId,
        district_id: districtId,
        entity_type: selectedEntity.type,
        entity_id: selectedEntity.id,
        visibility: 'public' as const,
        tags: null,
        event_url: toNull(data.event_url),
        image_url: imageUrl,
        created_by_email: user?.email || 'demo@example.com'
      }

      let createdEventId: string
      
      if (mode === 'edit' && eventId) {
        await updateEvent(eventId, eventData)
        createdEventId = eventId
        showToastMessage('Event updated successfully!')
      } else {
        const newEvent = await createEvent(eventData)
        createdEventId = newEvent.id
        showToastMessage('Event created successfully!')
      }
      
      // Post to Facebook if requested and accounts are connected
      if (postToFacebook && socialMediaAccounts.length > 0) {
        try {
          await postEventToFacebook(createdEventId, data, socialMediaAccounts)
          showToastMessage('Event posted to Facebook successfully!')
        } catch (error) {
          console.error('Error posting to Facebook:', error)
          showToastMessage('Event created, but Facebook posting failed. You can try again later.')
        }
      }
      
      router.push('/')
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} event:`, error)
      
      // Show more specific error message
      let errorMessage = `Error ${mode === 'edit' ? 'updating' : 'creating'} event`
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`
      }
      
      showToastMessage(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </main>
    )
  }

  if (mode === 'edit' && !event) {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600">The event you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </main>
    )
  }

  return (
    <>
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
                      onChange={(e) => {
                        // Copy start date to end date as soon as start date is entered
                        if (e.target.value) {
                          setValue('end_date', e.target.value)
                        }
                      }}
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

            {/* Social Media Posting */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">FB</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Post to Facebook</h3>
                        <p className="text-sm text-gray-600">
                          {socialMediaAccounts.length > 0 
                            ? `Share this event on ${socialMediaAccounts.length} Facebook page(s)`
                            : 'Share this event on your Facebook pages'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={postToFacebook}
                        onChange={(e) => setPostToFacebook(e.target.checked)}
                        disabled={socialMediaAccounts.length === 0}
                      />
                      {socialMediaAccounts.length === 0 ? (
                        <span className="text-sm text-gray-500">Connect Facebook first</span>
                      ) : (
                        <span className="text-sm text-gray-600">Post to Facebook</span>
                      )}
                    </div>
                  </div>
                  
                  {socialMediaAccounts.length > 0 && (
                    <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                      <p className="font-medium text-green-800">Connected Facebook Pages:</p>
                      <ul className="mt-2 space-y-1">
                        {socialMediaAccounts.map((account) => (
                          <li key={account.id} className="text-green-700">
                            • {account.account_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {socialMediaAccounts.length === 0 && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <p>To post events to Facebook, you need to connect your Facebook pages first.</p>
                      <p>Go to the <strong>Social Media</strong> page to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Organization
                </h2>
                
                <div className="space-y-4">
                  <EntitySelector
                    userEmail={user?.email || ''}
                    userRole={userRole?.role || 'editor'}
                    selectedEntity={selectedEntity}
                    onEntitySelect={setSelectedEntity}
                  />
                  {!selectedEntity && (
                    <p className="mt-1 text-sm text-red-600">Please select an organization to post on behalf of</p>
                  )}
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
    </>
  )
}
