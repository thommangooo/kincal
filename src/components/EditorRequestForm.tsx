'use client'

import { useState, useEffect } from 'react'
import { 
  createEditorRequest, 
  checkUserEntityPermission, 
  checkRateLimit,
  CreateEditorRequestData 
} from '@/lib/editorRequests'
import { getAllEntitiesForAssignment, Club, Zone, District } from '@/lib/database'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Users, 
  MessageSquare,
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Send
} from 'lucide-react'

interface EditorRequestFormData {
  name: string
  email: string
  phone: string
  entityType: 'club' | 'zone' | 'district'
  entityId: string
  messageToApprover: string
}

interface EditorRequestFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export default function EditorRequestForm({ onSuccess, onCancel, className = '' }: EditorRequestFormProps) {
  const [formData, setFormData] = useState<EditorRequestFormData>({
    name: '',
    email: '',
    phone: '',
    entityType: 'club',
    entityId: '',
    messageToApprover: ''
  })
  
  const [entities, setEntities] = useState<{ clubs: Club[], zones: Zone[], districts: District[] }>({
    clubs: [],
    zones: [],
    districts: []
  })
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [submitted, setSubmitted] = useState(false)

  // Load entities on mount
  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoading(true)
        const entitiesData = await getAllEntitiesForAssignment()
        setEntities(entitiesData)
      } catch (error) {
        console.error('Error loading entities:', error)
        setMessage('Error loading clubs and organizations. Please refresh the page.')
        setMessageType('error')
      } finally {
        setLoading(false)
      }
    }
    loadEntities()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.entityId) {
      setMessage('Please fill in all required fields.')
      setMessageType('error')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setMessage('Please enter a valid email address.')
      setMessageType('error')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      // Check rate limiting
      const rateLimitCheck = await checkRateLimit(formData.email)
      if (!rateLimitCheck.allowed) {
        setMessage(rateLimitCheck.message || 'Rate limit exceeded. Please try again later.')
        setMessageType('error')
        setSubmitting(false)
        return
      }

      // Check if user already has permissions for this entity
      // Note: This check might fail for non-authenticated users, so we'll handle it gracefully
      try {
        const hasPermission = await checkUserEntityPermission(
          formData.email, 
          formData.entityType, 
          formData.entityId
        )

        if (hasPermission) {
          setMessage('You already have editor permissions for this entity.')
          setMessageType('error')
          setSubmitting(false)
          return
        }
      } catch (permissionError) {
        // If permission check fails (e.g., due to auth issues), continue with the request
        // The server-side validation will catch duplicates anyway
        console.log('Permission check failed, continuing with request:', permissionError)
      }

      // Get user's IP address (simplified - in production you might want to get this server-side)
      const requestData: CreateEditorRequestData = {
        email: formData.email,
        name: formData.name,
        phone: formData.phone || undefined,
        entity_type: formData.entityType,
        entity_id: formData.entityId,
        message_to_approver: formData.messageToApprover || undefined
      }

      await createEditorRequest(requestData)
      
      setSubmitted(true)
      setMessage('Your request to add your Kin club has been submitted successfully! You will be notified once it has been reviewed.')
      setMessageType('success')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error submitting editor request:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit request. Please try again.'
      setMessage(errorMessage)
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const getEntityIcon = (type: 'club' | 'zone' | 'district') => {
    switch (type) {
      case 'club':
        return <Users className="h-4 w-4" />
      case 'zone':
        return <MapPin className="h-4 w-4" />
      case 'district':
        return <Building className="h-4 w-4" />
    }
  }

  const getEntityOptions = () => {
    switch (formData.entityType) {
      case 'club':
        return entities.clubs.map(club => (
          <option key={club.id} value={club.id}>
            {club.name} ({club.zone?.name || 'Unknown Zone'}, {club.district?.name || 'Unknown District'})
          </option>
        ))
      case 'zone':
        return entities.zones.map(zone => (
          <option key={zone.id} value={zone.id}>
            {zone.name} ({zone.district?.name || 'Unknown District'})
          </option>
        ))
      case 'district':
        return entities.districts.map(district => (
          <option key={district.id} value={district.id}>
            {district.name}
          </option>
        ))
    }
  }

  if (submitted) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted</h2>
          <p className="text-gray-600 mb-4">
            Your request to add your Kin club has been submitted successfully. 
            You will be notified once it has been reviewed by an administrator.
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Add My Kin Club</h2>
        <p className="text-gray-600">
          Fill out the form below to request adding your club, zone, or district to the Kin Calendar system.
        </p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-start space-x-3 ${
          messageType === 'success' ? 'bg-green-50 border border-green-200' :
          messageType === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : messageType === 'error' ? (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          )}
          <p className={`text-sm ${
            messageType === 'success' ? 'text-green-800' :
            messageType === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-2" />
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4 inline mr-2" />
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email address"
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="h-4 w-4 inline mr-2" />
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your phone number (optional)"
            disabled={submitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entity Type *
          </label>
          <select
            value={formData.entityType}
            onChange={(e) => {
              setFormData({ 
                ...formData, 
                entityType: e.target.value as 'club' | 'zone' | 'district',
                entityId: '' // Reset entity selection when type changes
              })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={submitting || loading}
          >
            <option value="club">Club</option>
            <option value="zone">Zone</option>
            <option value="district">District</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getEntityIcon(formData.entityType)}
            <span className="ml-2 capitalize">{formData.entityType} *</span>
          </label>
          <select
            value={formData.entityId}
            onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={submitting || loading}
          >
            <option value="">Select a {formData.entityType}</option>
            {getEntityOptions()}
          </select>
          {loading && (
            <p className="mt-1 text-sm text-gray-500">Loading {formData.entityType}s...</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Message to Approver
          </label>
          <textarea
            value={formData.messageToApprover}
            onChange={(e) => setFormData({ ...formData, messageToApprover: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Optional message to help the approver understand your request"
            rows={3}
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

