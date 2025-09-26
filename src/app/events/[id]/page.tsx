'use client'

import { useParams, useRouter } from 'next/navigation'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { getEventById } from '@/lib/database'
import { DbEvent } from '@/lib/supabase'
import Header from '@/components/Header'
import { ArrowLeft, Calendar, MapPin, Users, Globe, Lock, ExternalLink, Clock, Tag, Download, Edit, Trash2, Share2 } from 'lucide-react'
import Image from 'next/image'
import { formatDate, getEventStatus } from '@/lib/utils'
import { generateClubColor } from '@/lib/colors'
import { getCalendarExportOptions, downloadICSFile, copyEventDetails } from '@/lib/calendarExport'
import { deleteEvent } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'

export default function EventPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const eventId = params.id as string
  
  const [event, setEvent] = useState<DbEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // Show toast message
  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  // Load event data
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true)
        const eventData = await getEventById(eventId)
        setEvent(eventData)
      } catch (error) {
        console.error('Error loading event:', error)
        setError('Event not found or unable to load')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  // Check if user can edit/delete this event
  const canEdit = user && event && user.email === event.created_by_email

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading event...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
              <p className="text-gray-600 mb-6">The event you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calendar
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const status = getEventStatus(event)
  const statusColors = {
    upcoming: 'bg-green-100 text-green-800',
    today: 'bg-blue-100 text-blue-800',
    past: 'bg-gray-100 text-gray-800'
  }
  
  const clubColor = event.entity_id ? generateClubColor(event.entity_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500', bgStyle: 'background-color: #f3f4f6', textStyle: 'color: #1f2937', borderStyle: 'background-color: #6b7280' }

  // Check if it's an all-day event
  const startTime = new Date(event.start_date)
  const endTime = new Date(event.end_date)
  const isAllDay = startTime.getHours() === 0 && startTime.getMinutes() === 0 && 
                  endTime.getHours() === 23 && endTime.getMinutes() === 59

  // Handle share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description || '',
          url: window.location.href
        })
      } catch {
        // User cancelled or error occurred
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        showToastMessage('Event link copied to clipboard!')
      } catch {
        showToastMessage('Failed to copy link')
      }
    }
  }

  return (
    <>
      <Head>
        <title>{event ? `${event.title} - Kin Canada Calendar` : 'Event - Kin Canada Calendar'}</title>
        <meta name="description" content={event?.description || `Event details for ${event?.title || 'this event'}`} />
        {event?.image_url && <meta property="og:image" content={event.image_url} />}
        <meta property="og:title" content={event?.title || 'Event Details'} />
        <meta property="og:description" content={event?.description || 'View event details on Kin Canada Calendar'} />
        <meta property="og:type" content="event" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event?.title || 'Event Details'} />
        <meta name="twitter:description" content={event?.description || 'View event details on Kin Canada Calendar'} />
        {event?.image_url && <meta name="twitter:image" content={event.image_url} />}
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </button>

          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Club Color Indicator */}
            {event.entity_id && (
              <div 
                className="h-1 w-full"
                style={{
                  backgroundColor: clubColor.borderStyle?.split(': ')[1] || '#6b7280'
                }}
              ></div>
            )}

            <div className="p-8">
              {/* Title and Status */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status]}`}>
                      {status}
                    </span>
                    {event.visibility === 'private' ? (
                      <Lock className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Globe className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  
                  {/* Entity Information */}
                  {(event.club || event.zone || event.district) && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className={`w-3 h-3 rounded-full ${clubColor.border}`}></div>
                      {event.club && (
                        <>
                          <span className="text-sm">{event.club.name}</span>
                          {event.zone && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm">{event.zone.name}</span>
                            </>
                          )}
                          {event.district && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm">{event.district.name}</span>
                            </>
                          )}
                        </>
                      )}
                      {!event.club && event.zone && (
                        <>
                          <span className="text-sm">{event.zone.name}</span>
                          {event.district && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm">{event.district.name}</span>
                            </>
                          )}
                        </>
                      )}
                      {!event.club && !event.zone && event.district && (
                        <span className="text-sm">{event.district.name}</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Share event"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => router.push(`/events/edit/${event.id}`)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label="Edit event"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                            try {
                              await deleteEvent(event.id)
                              showToastMessage('Event deleted successfully!')
                              router.push('/')
                            } catch (error) {
                              console.error('Error deleting event:', error)
                              showToastMessage('Error deleting event')
                            }
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Delete event"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Event Image */}
              {event.image_url && (
                <div className="mb-8">
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    width={1200}
                    height={600}
                    className="w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              )}

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Date */}
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(event.start_date)}
                      {new Date(event.start_date).toDateString() !== new Date(event.end_date).toDateString() && (
                        <> - {formatDate(event.end_date)}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Time</p>
                    <p className="text-sm text-gray-600">
                      {isAllDay ? 'All Day Event' : (
                        <>
                          {startTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })}
                          {!isAllDay && endTime && (
                            <> - {endTime.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit', 
                              hour12: true 
                            })}</>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Entity Information */}
                {event.club && (
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Club</p>
                      <p className="text-sm text-gray-600">{event.club.name}</p>
                    </div>
                  </div>
                )}
                
                {!event.club && event.zone && (
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Zone</p>
                      <p className="text-sm text-gray-600">{event.zone.name}</p>
                    </div>
                  </div>
                )}
                
                {!event.club && !event.zone && event.district && (
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">District</p>
                      <p className="text-sm text-gray-600">{event.district.name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* External Link */}
              {event.event_url && (
                <div className="mb-8">
                  <a
                    href={event.event_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Event Details
                  </a>
                </div>
              )}

              {/* Calendar Export */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Add to My Calendar</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => {
                        downloadICSFile(event)
                        showToastMessage('ICS file downloaded successfully!')
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download ICS
                    </button>
                    <button
                      onClick={async () => {
                        const success = await copyEventDetails(event)
                        if (success) {
                          showToastMessage('Event details copied to clipboard!')
                        } else {
                          showToastMessage('Failed to copy to clipboard')
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      <span className="mr-1">📋</span>
                      Copy Details
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {getCalendarExportOptions(event, showToastMessage)
                    .filter(option => option.url) // Only show URL-based options
                    .map((option, index) => (
                    <a
                      key={index}
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      </div>
    </>
  )
}
