'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getEditorRequests, 
  approveEditorRequest, 
  rejectEditorRequest,
  EditorRequest 
} from '@/lib/editorRequests'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Users,
  MessageSquare,
  Calendar,
  AlertCircle,
  Flag
} from 'lucide-react'

interface EditorRequestManagementProps {
  currentUserEmail: string
  onRequestProcessed?: () => void
}

export default function EditorRequestManagement({ currentUserEmail, onRequestProcessed }: EditorRequestManagementProps) {
  const [requests, setRequests] = useState<EditorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [showRejectModal, setShowRejectModal] = useState<EditorRequest | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalRequest, setApprovalRequest] = useState<EditorRequest | null>(null)
  const [approvalCompleted, setApprovalCompleted] = useState(false)
  const [rejectionCompleted, setRejectionCompleted] = useState(false)

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      const requestsData = await getEditorRequests()
      setRequests(requestsData)
    } catch (error) {
      console.error('Error loading editor requests:', error)
      setMessage('Error loading editor requests')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  // Debug effect to track showApprovalModal state changes
  useEffect(() => {
    console.log('showApprovalModal state changed:', showApprovalModal)
    console.log('approvalRequest:', approvalRequest)
  }, [showApprovalModal, approvalRequest])

  const handleApprove = async (request: EditorRequest) => {
    // Show the approval modal first
    setApprovalRequest(request)
    setApprovalCompleted(false)
    setShowApprovalModal(true)
  }

  const handleRejectClick = async (request: EditorRequest) => {
    // Show the reject modal first
    setShowRejectModal(request)
    setRejectionCompleted(false)
  }

  const confirmApproval = async () => {
    if (!approvalRequest) return

    setProcessing(approvalRequest.id)
    try {
      console.log('Starting approval process for request:', approvalRequest.id)
      await approveEditorRequest(approvalRequest.id, currentUserEmail)
      console.log('Approval successful')
      
      // Mark approval as completed and keep modal open
      setApprovalCompleted(true)
      
      setMessage(`Editor request from ${approvalRequest.name} has been approved successfully!`)
      setMessageType('success')
      
      // Don't call onRequestProcessed here - wait until modal closes
    } catch (error) {
      console.error('Error approving request:', error)
      setMessage(`Error approving request: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setMessageType('error')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!showRejectModal) return

    setProcessing(showRejectModal.id)
    try {
      await rejectEditorRequest(showRejectModal.id, currentUserEmail, rejectNotes)
      
      // Mark rejection as completed and keep modal open
      setRejectionCompleted(true)
      
      setMessage(`Editor request from ${showRejectModal.name} has been rejected.`)
      setMessageType('success')
      
      // Don't call onRequestProcessed here - wait until modal closes
    } catch (error) {
      console.error('Error rejecting request:', error)
      setMessage(`Error rejecting request: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setMessageType('error')
    } finally {
      setProcessing(null)
    }
  }

  const getEntityIcon = (type: 'club' | 'zone' | 'district' | 'kin_canada') => {
    switch (type) {
      case 'club':
        return <Users className="h-4 w-4" />
      case 'zone':
        return <MapPin className="h-4 w-4" />
      case 'district':
        return <Building className="h-4 w-4" />
      case 'kin_canada':
        return <Flag className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-800 bg-yellow-100'
      case 'approved':
        return 'text-green-800 bg-green-100'
      case 'rejected':
        return 'text-red-800 bg-red-100'
      default:
        return 'text-gray-800 bg-gray-100'
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading editor requests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg flex items-start space-x-3 ${
          messageType === 'success' ? 'bg-green-50 border border-green-200' :
          messageType === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : messageType === 'error' ? (
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
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


      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-600" />
              Pending Club Addition Requests ({pendingRequests.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{request.name}</h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-1" />
                          {request.email}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Requesting Access To</label>
                        <div className="flex items-center mt-1">
                          {getEntityIcon(request.entity_type)}
                          <span className="ml-2 text-sm text-gray-900">
                            {request.entity_name} ({request.entity_type})
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</label>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {request.phone && (
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</label>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-900">{request.phone}</span>
                        </div>
                      </div>
                    )}

                    {request.message_to_approver && (
                      <div className="mb-3">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Message</label>
                        <div className="flex items-start mt-1">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="ml-2 text-sm text-gray-900">{request.message_to_approver}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={processing === request.id}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {processing === request.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectClick(request)}
                      disabled={processing === request.id}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Processed Club Addition Requests ({processedRequests.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.name}</div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getEntityIcon(request.entity_type)}
                        <span className="ml-2 text-sm text-gray-900">
                          {request.entity_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.reviewed_at ? new Date(request.reviewed_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Club Addition Requests</h3>
          <p className="text-gray-500">There are no pending or processed club addition requests.</p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {rejectionCompleted ? 'Send Rejection Notification' : 'Reject Editor Request'}
            </h3>
            
            {!rejectionCompleted ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to reject the request from <strong>{showRejectModal.name}</strong> for <strong>{showRejectModal.entity_name}</strong>?
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rejection (optional)
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Optional reason for rejection..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(null)
                      setRejectNotes('')
                      setRejectionCompleted(false)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing === showRejectModal.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === showRejectModal.id ? 'Processing...' : 'Reject Request'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    The request from <strong>{showRejectModal.name}</strong> has been rejected. You can now send them a notification email.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      const mailtoLink = `mailto:${showRejectModal.email}?subject=Kin Club Addition Request - Not Approved&body=Dear ${showRejectModal.name},%0D%0A%0D%0AThank you for your interest in becoming an editor for ${showRejectModal.entity_name}.%0D%0A%0D%0AUnfortunately, we are unable to approve your request at this time.${rejectNotes ? `%0D%0A%0D%0AReason: ${rejectNotes}` : ''}%0D%0A%0D%0AIf you have any questions, please feel free to contact us.%0D%0A%0D%0AKin Calendar Administration`
                      window.open(mailtoLink, '_blank')
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Email
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(null)
                      setRejectNotes('')
                      setRejectionCompleted(false)
                      
                      // Call the callback after modal closes
                      if (onRequestProcessed) {
                        onRequestProcessed()
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && approvalRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border-4 border-red-500">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {approvalCompleted ? 'Send Approval Notification' : 'Approve Editor Request'}
            </h3>
            
            {!approvalCompleted ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to approve the request from <strong>{approvalRequest.name}</strong> for <strong>{approvalRequest.entity_name}</strong>?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowApprovalModal(false)
                      setApprovalRequest(null)
                      setApprovalCompleted(false)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmApproval}
                    disabled={processing === approvalRequest.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === approvalRequest.id ? 'Processing...' : 'Approve Request'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    The request from <strong>{approvalRequest.name}</strong> has been approved successfully! You can now send them a notification email.
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      const mailtoLink = `mailto:${approvalRequest.email}?subject=Kin Club Added - You are now an editor&body=Dear ${approvalRequest.name},%0D%0A%0D%0AYour request to become an editor for ${approvalRequest.entity_name} has been approved!%0D%0A%0D%0AYou can now log in to the Kin Calendar system and manage events for your ${approvalRequest.entity_type}.%0D%0A%0D%0AWelcome to the team!%0D%0A%0D%0AKin Calendar Administration`
                      window.open(mailtoLink, '_blank')
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Email
                  </button>
                  <button
                    onClick={() => {
                      setShowApprovalModal(false)
                      setApprovalRequest(null)
                      setApprovalCompleted(false)
                      
                      // Call the callback after modal closes
                      if (onRequestProcessed) {
                        onRequestProcessed()
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}


    </div>
  )
}
