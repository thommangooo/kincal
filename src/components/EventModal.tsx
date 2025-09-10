'use client'

import { useEffect, useState } from 'react'
import { Event } from '@/lib/database'
import { formatDate, formatTime, getEventStatus } from '@/lib/utils'
import { getCalendarExportOptions, downloadICSFile, copyEventDetails } from '@/lib/calendarExport'
import { Calendar, MapPin, Users, Globe, Lock, ExternalLink, X, Clock, Tag, Download } from 'lucide-react'
import Toast from './Toast'

// Generate consistent colors for clubs (same as other components)
const generateClubColor = (clubId: string): { bg: string; text: string; border: string } => {
  let hash = 0
  for (let i = 0; i < clubId.length; i++) {
    const char = clubId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  const colorIndex = Math.abs(hash) % 8
  
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'bg-blue-500' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'bg-green-500' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'bg-purple-500' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'bg-orange-500' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'bg-pink-500' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'bg-indigo-500' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'bg-teal-500' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'bg-amber-500' }
  ]
  
  return colors[colorIndex]
}

interface EventModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export default function EventModal({ event, isOpen, onClose }: EventModalProps) {
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // Show toast message
  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !event) return null

  const status = getEventStatus(event)
  const statusColors = {
    upcoming: 'bg-green-100 text-green-800',
    today: 'bg-blue-100 text-blue-800',
    past: 'bg-gray-100 text-gray-800'
  }
  
  const clubColor = event.club_id ? generateClubColor(event.club_id) : { bg: 'bg-gray-100', text: 'text-gray-800', border: 'bg-gray-500' }

  // Check if it's an all-day event
  const startTime = new Date(event.start_date)
  const endTime = new Date(event.end_date)
  const isAllDay = startTime.getHours() === 0 && startTime.getMinutes() === 0 && 
                  endTime.getHours() === 23 && endTime.getMinutes() === 59

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1 pr-4">
              <div className="flex items-center space-x-3 mb-2">
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900">{event.title}</h2>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status]}`}>
                  {status}
                </span>
                {event.visibility === 'private' ? (
                  <Lock className="h-5 w-5 text-gray-500" />
                ) : (
                  <Globe className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {/* Club indicator */}
              {event.club && (
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${clubColor.border}`}></div>
                  <span className="text-sm text-gray-600">{event.club.name}</span>
                  {event.zone && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{event.zone.name}</span>
                    </>
                  )}
                  {event.district && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{event.district.name}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Image */}
              {event.image_url && (
                <div className="w-full">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>
              )}

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(event.start_date)}
                        {event.start_date !== event.end_date && (
                          <> - {formatDate(event.end_date)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Time */}
                  {!isAllDay && (
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Time</p>
                        <p className="text-sm text-gray-600">
                          {formatTime(event.start_date)}
                          {event.end_date && (
                            <> - {formatTime(event.end_date)}</>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* All Day indicator */}
                  {isAllDay && (
                    <div className="flex items-start space-x-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Time</p>
                        <p className="text-sm text-gray-600">All Day Event</p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Club */}
                  {event.club && (
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Club</p>
                        <p className="text-sm text-gray-600">{event.club.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
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
                <div className="pt-4 border-t border-gray-200">
                  <a
                    href={event.event_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Event Details
                  </a>
                </div>
              )}

              {/* Calendar Export */}
              <div className="pt-4 border-t border-gray-200 bg-blue-50 rounded-lg p-4 -mx-4 -mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add to My Calendar</h3>
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
      </div>
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
