'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { announcementFormSchema, AnnouncementFormData } from '@/lib/validations'
import { createAnnouncement } from '@/lib/database'
import { getZones, getClubs, getUserRole, Zone, Club } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import RichTextEditor from '@/components/RichTextEditor'
import ImageUpload from '@/components/ImageUpload'
import EntitySelector from '@/components/EntitySelector'
import Toast from '@/components/Toast'
import { ArrowLeft, Users, Star } from 'lucide-react'

export default function CreateAnnouncementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<{type: 'club' | 'zone' | 'district', id: string} | null>(null)
  const [userRole, setUserRole] = useState<'superuser' | 'editor' | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      visibility: 'public',
      priority: 0,
      tags: [],
      publish_date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    }
  })

  // Handle content changes and sync with form
  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setValue('content', newContent, { shouldValidate: true })
  }

  // Debug form state
  console.log('Form errors:', errors)
  console.log('Form is valid:', isValid)
  console.log('Content length:', content?.length || 0)

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return
      
      try {
        const [zonesData, clubsData, role] = await Promise.all([
          getZones(),
          getClubs(),
          getUserRole(user.email)
        ])
        setZones(zonesData)
        setClubs(clubsData)
        setUserRole(role)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [user])

  const onSubmit = async (data: AnnouncementFormData) => {
    console.log('Form submitted with data:', data)
    console.log('Selected entity:', selectedEntity)
    console.log('Content:', content)
    
    if (!selectedEntity) {
      alert('Please select an entity to post on behalf of')
      return
    }

    if (!content || content.trim() === '') {
      alert('Please provide announcement content')
      return
    }

    setLoading(true)
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
          break
        case 'district':
          district_id = selectedEntity.id
          break
      }

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
        visibility: data.visibility === 'internal-use' ? 'private' : 'public',
        tags: data.tags || null,
        priority: data.priority,
        image_url: imageUrl,
        created_by_email: user?.email || 'demo@example.com'
      }

      console.log('Creating announcement with data:', announcementData)
      const result = await createAnnouncement(announcementData)
      console.log('Announcement created successfully:', result)
      
      // Show success message
      setToastMessage('Announcement created successfully!')
      setShowToast(true)
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/announcements')
      }, 1500)
    } catch (error) {
      console.error('Error creating announcement:', error)
      alert('Failed to create announcement. Please check the console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Announcement</h1>
            <p className="text-gray-600">Share important updates and news with your Kin community</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      onChange={handleContentChange}
                      placeholder="Write your announcement content here..."
                    />
                    {!content && (
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
                      type="date"
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
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>


                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Visibility
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        {...register('visibility')}
                        type="radio"
                        value="public"
                        className="h-4 w-4 text-kin-red focus:ring-kin-red border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Public</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        {...register('visibility')}
                        type="radio"
                        value="internal-use"
                        className="h-4 w-4 text-kin-red focus:ring-kin-red border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Internal Use</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Public announcements are suitable for external sharing. Internal use announcements are for Kin members only.
                  </p>
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
                    userRole={userRole || 'editor'}
                    selectedEntity={selectedEntity}
                    onEntitySelect={setSelectedEntity}
                  />
                  {!selectedEntity && (
                    <p className="mt-1 text-sm text-red-600">Please select an organization to post on behalf of</p>
                  )}
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
                  disabled={loading || !isValid || !selectedEntity}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
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
