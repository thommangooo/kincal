import { supabase } from './supabase'
import { createUserWithPermissions } from './database'
import { createClient } from '@supabase/supabase-js'

// Create an anonymous client for public operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

export interface EditorRequest {
  id: string
  email: string
  name: string
  phone?: string
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  message_to_approver?: string
  status: 'pending' | 'approved' | 'rejected'
  ip_address?: string
  created_at: string
  reviewed_at?: string
  reviewed_by_email?: string
  admin_notes?: string
  entity_name?: string // Computed field
}

export interface CreateEditorRequestData {
  email: string
  name: string
  phone?: string
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  message_to_approver?: string
  ip_address?: string
}

// Create a new editor request
export async function createEditorRequest(data: CreateEditorRequestData): Promise<EditorRequest> {
  // First, validate that the entity exists
  const entityExists = await validateEntityExists(data.entity_type, data.entity_id)
  if (!entityExists) {
    throw new Error(`The selected ${data.entity_type} does not exist. Please refresh the page and try again.`)
  }

  // Check for duplicate requests within 24 hours
  const { data: existingRequests, error: checkError } = await supabaseAnon
    .from('editor_requests')
    .select('id, created_at')
    .eq('email', data.email.toLowerCase())
    .eq('entity_type', data.entity_type)
    .eq('entity_id', data.entity_id)
    .eq('status', 'pending')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (checkError) {
    console.error('Error checking for duplicate requests:', checkError)
    // Continue with the request if we can't check for duplicates
  } else if (existingRequests && existingRequests.length > 0) {
    throw new Error('You have already submitted a request for this entity within the last 24 hours. Please wait before submitting another request.')
  }

  // Note: Permission check is handled in the application layer for better error handling
  // The server-side validation will catch duplicates and existing permissions during approval

  // Create the request
  const { data: request, error } = await supabaseAnon
    .from('editor_requests')
    .insert({
      email: data.email.toLowerCase(),
      name: data.name,
      phone: data.phone,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      message_to_approver: data.message_to_approver,
      ip_address: data.ip_address
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating editor request:', error)
    throw new Error('Failed to submit editor request. Please try again.')
  }

  return request as EditorRequest
}

// Get all editor requests (for admin)
export async function getEditorRequests(): Promise<EditorRequest[]> {
  const { data: requests, error } = await supabase
    .from('editor_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching editor requests:', error)
    throw new Error('Failed to fetch editor requests')
  }

  // Resolve entity names in application code
  const requestsWithNames = await Promise.all(
    (requests as EditorRequest[]).map(async (request) => {
      try {
        const entityName = await getEntityName(request.entity_type, request.entity_id)
        return { ...request, entity_name: entityName }
      } catch (error) {
        console.error('Error resolving entity name:', error)
        return { ...request, entity_name: 'Unknown Entity' }
      }
    })
  )

  return requestsWithNames
}

// Get editor requests by status
export async function getEditorRequestsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<EditorRequest[]> {
  const { data: requests, error } = await supabase
    .from('editor_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching editor requests:', error)
    throw new Error('Failed to fetch editor requests')
  }

  // Resolve entity names in application code
  const requestsWithNames = await Promise.all(
    (requests as EditorRequest[]).map(async (request) => {
      try {
        const entityName = await getEntityName(request.entity_type, request.entity_id)
        return { ...request, entity_name: entityName }
      } catch (error) {
        console.error('Error resolving entity name:', error)
        return { ...request, entity_name: 'Unknown Entity' }
      }
    })
  )

  return requestsWithNames
}

// Approve an editor request
export async function approveEditorRequest(
  requestId: string, 
  reviewedByEmail: string, 
  adminNotes?: string
): Promise<void> {
  // Get the request details
  const { data: request, error: fetchError } = await supabase
    .from('editor_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) {
    throw new Error('Editor request not found')
  }

  if (request.status !== 'pending') {
    throw new Error('This request has already been processed')
  }

  // Try to create user with permissions directly
  // If user already exists, the createUserWithPermissions function will handle it
  try {
    await createUserWithPermissions({
      email: request.email,
      name: request.name,
      role: 'editor',
      entityIds: [request.entity_id]
    })
  } catch (error) {
    console.error('Error creating user with permissions:', error)
    // If it's a duplicate user error, try to add just the permission
    if (error instanceof Error && error.message.includes('already exists')) {
      try {
        const { error: permissionError } = await supabase
          .from('user_entity_permissions')
          .insert({
            user_email: request.email,
            entity_type: request.entity_type,
            entity_id: request.entity_id
          })

        if (permissionError) {
          console.error('Error adding entity permission:', permissionError)
          throw new Error('Failed to add entity permission')
        }
      } catch (permError) {
        console.error('Exception adding entity permission:', permError)
        throw new Error('Failed to add entity permission')
      }
    } else {
      throw new Error('Failed to create user with permissions')
    }
  }

  // Update the request status
  const { error: updateError } = await supabase
    .from('editor_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by_email: reviewedByEmail,
      admin_notes: adminNotes
    })
    .eq('id', requestId)

  if (updateError) {
    console.error('Error updating request status:', updateError)
    throw new Error('Failed to update request status')
  }
}

// Reject an editor request
export async function rejectEditorRequest(
  requestId: string, 
  reviewedByEmail: string, 
  adminNotes?: string
): Promise<void> {
  const { error } = await supabase
    .from('editor_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by_email: reviewedByEmail,
      admin_notes: adminNotes
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error rejecting editor request:', error)
    throw new Error('Failed to reject editor request')
  }
}

// Check if user already has permissions for an entity
export async function checkUserEntityPermission(
  email: string, 
  entityType: 'club' | 'zone' | 'district', 
  entityId: string
): Promise<boolean> {
  const { data: hasPermission, error } = await supabase
    .rpc('user_has_entity_permission', {
      user_email_param: email.toLowerCase(),
      entity_type_param: entityType,
      entity_id_param: entityId
    })

  if (error) {
    console.error('Error checking user permission:', error)
    return false
  }

  return hasPermission || false
}

// Validate that an entity exists in the correct table
export async function validateEntityExists(entityType: 'club' | 'zone' | 'district', entityId: string): Promise<boolean> {
  try {
    let tableName: string
    switch (entityType) {
      case 'club':
        tableName = 'clubs'
        break
      case 'zone':
        tableName = 'zones'
        break
      case 'district':
        tableName = 'districts'
        break
      default:
        return false
    }

    const { data, error } = await supabaseAnon
      .from(tableName)
      .select('id')
      .eq('id', entityId)
      .single()

    if (error || !data) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating entity exists:', error)
    return false
  }
}

// Get entity name by type and id
export async function getEntityName(entityType: 'club' | 'zone' | 'district', entityId: string): Promise<string> {
  try {
    let tableName: string
    switch (entityType) {
      case 'club':
        tableName = 'clubs'
        break
      case 'zone':
        tableName = 'zones'
        break
      case 'district':
        tableName = 'districts'
        break
      default:
        return 'Unknown Entity'
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('name')
      .eq('id', entityId)
      .single()

    if (error || !data) {
      console.error('Error getting entity name:', error)
      return 'Unknown Entity'
    }

    return data.name || 'Unknown Entity'
  } catch (error) {
    console.error('Error getting entity name:', error)
    return 'Unknown Entity'
  }
}

// Rate limiting: Check if user has made too many requests recently
export async function checkRateLimit(email: string, ipAddress?: string): Promise<{ allowed: boolean; message?: string }> {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Check email-based rate limit (1 request per email per 24 hours)
  const { data: emailRequests, error: emailError } = await supabaseAnon
    .from('editor_requests')
    .select('id')
    .eq('email', email.toLowerCase())
    .gte('created_at', oneDayAgo.toISOString())

  if (emailError) {
    console.error('Error checking email rate limit:', emailError)
    // Allow the request if we can't check rate limits
  } else if (emailRequests && emailRequests.length > 0) {
    return { allowed: false, message: 'You can only submit one request per day. Please try again tomorrow.' }
  }

  // Check IP-based rate limit (3 requests per IP per 24 hours)
  if (ipAddress) {
    const { data: ipRequests, error: ipError } = await supabaseAnon
      .from('editor_requests')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneDayAgo.toISOString())

    if (ipError) {
      console.error('Error checking IP rate limit:', ipError)
      // Allow the request if we can't check IP rate limits
    } else if (ipRequests && ipRequests.length >= 3) {
      return { allowed: false, message: 'Too many requests from this IP address. Please try again tomorrow.' }
    }
  }

  return { allowed: true }
}

