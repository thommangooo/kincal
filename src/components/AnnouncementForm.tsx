'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { announcementFormSchema, AnnouncementFormData } from '@/lib/validations'
import { getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncement, getZones, getClubs, getUserRole, Zone, Club } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUpload from '@/components/ImageUpload'
import EntitySelector from '@/components/EntitySelector'
import Toast from '@/components/Toast'
import { ArrowLeft, Users } from 'lucide-react'

interface AnnouncementFormProps {
  mode: 'create' | 'edit'
  announcementId?: string
}

export default function AnnouncementForm({ mode, announcementId }: AnnouncementFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<{type: 'club' | 'zone' | 'district', id: string} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<{
    role: 'superuser' | 'editor'
    club_id?: string
    zone_id?: string
    district_id?: string
  } | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      visibility: 'public',
      tags: []
    }
  })

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return
      
      try {
        if (mode === 'edit' && announcementId) {
          // Load existing announcement data for editing
          const [announcementData, zonesData, clubsData, role] = await Promise.all([
            getAnnouncementById(announcementId),
            getZones(),
            getClubs(),
            getUserRole(user.email)
          ])
          
          // Check if user can edit this announcement
          if (user?.email !== announcementData.created_by_email) {
            showToastMessage('You do not have permission to edit this announcement')
            router.push('/announcements')
            return
          }
          
          setZones(zonesData)
          setClubs(clubsData)
          setUserRole(role)
          
          // Set form values
          setValue('title', announcementData.title)
          setValue('visibility', announcementData.visibility)
          setValue('tags', announcementData.tags || [])
          setContent(announcementData.content)
          setImageUrl(announcementData.image_url)
          
          // Set dates
          const publishDate = new Date(announcementData.publish_date)
          setValue('publish_date', publishDate.toISOString().slice(0, 16))
          
          if (announcementData.expiry_date) {
            const expiryDate = new Date(announcementData.expiry_date)
            setValue('expiry_date', expiryDate.toISOString().slice(0, 16))
          }
          
          // Set entity
          setSelectedEntity({
            type: announcementData.entity_type,
            id: announcementData.entity_id
          })
        } else {
          // Load data for create mode
          const [zonesData, clubsData, role] = await Promise.all([
            getZones(),
            getClubs(),
            getUserRole(user.email)
          ])
          setZones(zonesData)
          setClubs(clubsData)
          setUserRole(role)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user, mode, announcementId, setValue, router])

  const onSubmit = useCallback(async (data: AnnouncementFormData) => {
    console.log('Form submitted with data:', data)
    console.log('Selected entity:', selectedEntity)
    console.log('Content:', content)
    
    // Clear any previous errors
    setError(null)
    
    if (!selectedEntity) {
      setError('Please select an organization to post on behalf of')
      return
    }

    if (!content || content.trim() === '' || content === '<p></p>') {
      setError('Please enter announcement content')
      return
    }

    setSubmitting(true)
    try {
      // Derive entity IDs from selected entity
      let club_id = null
      let zone_id = null
      let district_id = null
      const entity_type = selectedEntity.type
      const entity_id = selectedEntity.id

      switch (selectedEntity.type) {
        case 'club':
          club_id = selectedEntity.id
          // Find the club to get its zone and district
          const club = clubs.find(c => c.id === selectedEntity.id)
          if (club) {
            zone_id = club.zone_id
            const clubZone = zones.find(z => z.id === club.zone_id)
            if (clubZone) {
              district_id = clubZone.district_id
            }
          }
          break
        case 'zone':
          zone_id = selectedEntity.id
          // Find the zone to get its district
          const zone = zones.find(z => z.id === selectedEntity.id)
          if (zone) {
            district_id = zone.district_id
          }
          // For zone announcements, we need to find a representative club
          const zoneClubs = clubs.filter(c => c.zone_id === selectedEntity.id)
          if (zoneClubs.length > 0) {
            club_id = zoneClubs[0].id // Use the first club in the zone as a placeholder
          } else {
            // If no clubs found in zone, this is an error
            throw new Error(`No clubs found in the selected zone. Please contact an administrator.`)
          }
          break
        case 'district':
          district_id = selectedEntity.id
          // For district announcements, we need to find a representative club
          const districtClubs = clubs.filter(c => {
            const clubZone = zones.find(z => z.id === c.zone_id)
            return clubZone && clubZone.district_id === selectedEntity.id
          })
          if (districtClubs.length > 0) {
            club_id = districtClubs[0].id // Use the first club in the district as a placeholder
            const firstClub = districtClubs[0]
            zone_id = firstClub.zone_id
          } else {
            // If no clubs found in district, this is an error
            throw new Error(`No clubs found in the selected district. Please contact an administrator.`)
          }
          break
      }

      // Validate that we have all required IDs
      if (!club_id || !zone_id || !district_id) {
        console.error('Missing required IDs:', { club_id, zone_id, district_id, selectedEntity })
        throw new Error('Unable to determine required organization IDs. Please try selecting a different organization.')
      }

      console.log('Derived entity IDs:', { club_id, zone_id, district_id, entity_type, entity_id })

      const announcementData = {
        title: data.title,
        content: content,
        publish_date: new Date(data.publish_date).toISOString(),
        expiry_date: data.expiry_date ? new Date(data.expiry_date).toISOString() : null,
        club_id,
        zone_id,
        district_id,
        entity_type,
        entity_id,
        visibility: data.visibility || 'public' as const,
        tags: data.tags || null,
        priority: 0, // Default priority
        image_url: imageUrl,
        created_by_email: user?.email || 'demo@example.com'
      }

      console.log('Creating/updating announcement with data:', announcementData)
      
      if (mode === 'create') {
        const result = await createAnnouncement(announcementData)
        console.log('Announcement created successfully:', result)
        showToastMessage('Announcement created successfully!')
        router.push('/announcements')
      } else if (mode === 'edit' && announcementId) {
        const result = await updateAnnouncement(announcementId, announcementData)
        console.log('Announcement updated successfully:', result)
        showToastMessage('Announcement updated successfully!')
        router.push('/announcements')
      }
    } catch (error) {
      console.error('Error creating/updating announcement:', error)
      setError('Failed to save announcement. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [selectedEntity, content, clubs, zones, user, mode, announcementId, router])


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading announcement...</span>
              </div>
            </div>
          </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {mode === 'create' ? 'Create New Announcement' : 'Edit Announcement'}
            </h1>
            <p className="text-gray-600">
              {mode === 'create' 
                ? 'Share important updates and news with your Kin community'
                : 'Update your announcement details'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* Basic Information */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Announcement Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      {...register('title')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter announcement title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <RichTextEditor
                      content={content}
                      onChange={(newContent) => {
                        console.log('Content changed:', newContent)
                        setContent(newContent)
                        if (error && newContent && newContent.trim() !== '' && newContent !== '<p></p>') {
                          setError(null)
                        }
                      }}
                      placeholder="Write your announcement content here..."
                    />
                    {(!content || content.trim() === '' || content === '<p></p>') && (
                      <p className="mt-1 text-sm text-red-600">Content is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Announcement Image
                    </label>
                    <ImageUpload
                      value={imageUrl}
                      onChange={setImageUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Publishing Options */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Publishing Options</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publish Date *
                    </label>
                    <input
                      {...register('publish_date')}
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.publish_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.publish_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date (Optional)
                    </label>
                    <input
                      {...register('expiry_date')}
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

              </div>

              {/* Organization */}
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
                    onEntitySelect={(entity) => {
                      setSelectedEntity(entity)
                      if (error && entity) {
                        setError(null)
                      }
                    }}
                  />
                  {!selectedEntity && (
                    <p className="mt-1 text-sm text-red-600">Please select an organization to post on behalf of</p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
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
                  disabled={submitting || !content || content.trim() === '' || content === '<p></p>' || !selectedEntity}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Announcement' : 'Update Announcement')}
                </button>
              </div>
            </div>
          </form>
        </div>
      
      <Toast message={toastMessage} isVisible={showToast} />
    </div>
  )
}
