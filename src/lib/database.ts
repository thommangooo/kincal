import { supabase, DbEvent, Announcement, Club, Zone, District, UserEntityPermission } from './supabase'

// Re-export types for use in other files
export type { DbEvent as Event, Announcement, Club, Zone, District, UserEntityPermission }

// Event operations
export async function getEvents(filters?: {
  clubId?: string
  zoneId?: string
  districtId?: string
  visibility?: 'public' | 'private'
  startDate?: Date
  endDate?: Date
}) {
  let query = supabase
    .from('events')
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .order('start_date', { ascending: true })

  // Handle entity filtering with OR logic when multiple entities are specified
  if (filters?.clubId && filters?.zoneId) {
    // Show events from the specific club OR the specific zone
    query = query.or(`club_id.eq.${filters.clubId},zone_id.eq.${filters.zoneId}`)
  } else if (filters?.clubId) {
    query = query.eq('club_id', filters.clubId)
  } else if (filters?.zoneId) {
    query = query.eq('zone_id', filters.zoneId)
  }
  
  if (filters?.districtId) {
    query = query.eq('district_id', filters.districtId)
  }
  if (filters?.visibility) {
    query = query.eq('visibility', filters.visibility)
  }
  if (filters?.startDate) {
    query = query.gte('start_date', filters.startDate.toISOString())
  }
  if (filters?.endDate) {
    query = query.lte('end_date', filters.endDate.toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data as DbEvent[]
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DbEvent
}

// Alias for convenience
export const getEvent = getEventById

export async function createEvent(event: Omit<DbEvent, 'id' | 'created_at' | 'updated_at'>) {
  console.log('Creating event with data:', event)
  
  // Validate required fields
  if (!event.title) {
    throw new Error('Event title is required')
  }
  if (!event.start_date) {
    throw new Error('Event start date is required')
  }
  if (!event.end_date) {
    throw new Error('Event end date is required')
  }
  if (!event.club_id) {
    throw new Error('Event club_id is required')
  }
  if (!event.zone_id) {
    throw new Error('Event zone_id is required')
  }
  if (!event.district_id) {
    throw new Error('Event district_id is required')
  }
  
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .single()

  console.log('Supabase response:', { data, error })
  console.log('Error details:', JSON.stringify(error, null, 2))

  if (error) {
    console.error('Supabase error details:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    throw error
  }
  return data as Event
}

export async function updateEvent(id: string, updates: Partial<DbEvent>) {
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .single()

  if (error) throw error
  return data as Event
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Club operations
export async function getClubs() {
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      *,
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .order('name')

  if (error) throw error
  return data as Club[]
}

export async function getClubsByZone(zoneId: string) {
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      *,
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .eq('zone_id', zoneId)
    .order('name')

  if (error) throw error
  return data as Club[]
}

export async function getClubsByDistrict(districtId: string) {
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      *,
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .eq('district_id', districtId)
    .order('name')

  if (error) throw error
  return data as Club[]
}

export async function getClubsByType(clubType: 'Kinsmen' | 'Kinette' | 'Kin') {
  const { data, error } = await supabase
    .from('clubs')
    .select(`
      *,
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .eq('club_type', clubType)
    .order('name')

  if (error) throw error
  return data as Club[]
}

// Zone operations
export async function getZones() {
  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      district:districts!district_id(*)
    `)
    .order('name')

  if (error) throw error
  return data as Zone[]
}

export async function getZonesByDistrict(districtId: string) {
  const { data, error } = await supabase
    .from('zones')
    .select(`
      *,
      district:districts!district_id(*)
    `)
    .eq('district_id', districtId)
    .order('name')

  if (error) throw error
  return data as Zone[]
}

// District operations
export async function getDistricts() {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .order('name')

  if (error) throw error
  return data as District[]
}

// Announcement operations
export async function getAnnouncements(filters?: {
  clubId?: string
  zoneId?: string
  districtId?: string
  visibility?: 'public' | 'private'
  limit?: number
  includeExpired?: boolean
}) {
  let query = supabase
    .from('announcements')
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .order('priority', { ascending: false })
    .order('publish_date', { ascending: false })

  // Handle entity filtering with OR logic when multiple entities are specified
  if (filters?.clubId && filters?.zoneId) {
    // Show announcements from the specific club OR the specific zone
    query = query.or(`club_id.eq.${filters.clubId},zone_id.eq.${filters.zoneId}`)
  } else if (filters?.clubId) {
    query = query.eq('club_id', filters.clubId)
  } else if (filters?.zoneId) {
    query = query.eq('zone_id', filters.zoneId)
  }
  
  if (filters?.districtId) {
    query = query.eq('district_id', filters.districtId)
  }
  if (filters?.visibility) {
    query = query.eq('visibility', filters.visibility)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (!filters?.includeExpired) {
    query = query.or('expiry_date.is.null,expiry_date.gt.' + new Date().toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data as Announcement[]
}

export async function getAnnouncementById(id: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Announcement
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .single()

  if (error) throw error
  return data as Announcement
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>) {
  const { data, error } = await supabase
    .from('announcements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .single()

  if (error) throw error
  return data as Announcement
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// User Entity Permissions operations
export async function getUserEntityPermissions(userEmail: string) {
  const { data: permissions, error } = await supabase
    .from('user_entity_permissions')
    .select('*')
    .eq('user_email', userEmail)
    .order('entity_type', { ascending: true })

  if (error) throw error
  if (!permissions || permissions.length === 0) return []

  // Fetch entity details for each permission
  const permissionsWithEntities = await Promise.all(
    permissions.map(async (permission) => {
      let entity = null
      
      try {
        entity = await getEntityDetails(permission.entity_type, permission.entity_id)
      } catch (error) {
        console.error(`Error fetching ${permission.entity_type} ${permission.entity_id}:`, error)
      }

      return {
        ...permission,
        entity
      }
    })
  )

  return permissionsWithEntities as UserEntityPermission[]
}

export async function createUserEntityPermission(permission: Omit<UserEntityPermission, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('user_entity_permissions')
    .insert(permission)
    .select()
    .single()

  if (error) throw error
  return data as UserEntityPermission
}

export async function deleteUserEntityPermission(id: string) {
  const { error } = await supabase
    .from('user_entity_permissions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Helper function to get entity details
export async function getEntityDetails(entityType: 'club' | 'zone' | 'district', entityId: string) {
  let query
  
  switch (entityType) {
    case 'club':
      query = supabase
        .from('clubs')
        .select(`
          *,
          zone:zones(*),
          district:districts(*)
        `)
        .eq('id', entityId)
        .single()
      break
    case 'zone':
      query = supabase
        .from('zones')
        .select(`
          *,
          district:districts(*)
        `)
        .eq('id', entityId)
        .single()
      break
    case 'district':
      query = supabase
        .from('districts')
        .select('*')
        .eq('id', entityId)
        .single()
      break
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

// Get user role and entities from approved_users and user_entity_permissions tables
export async function getUserRole(userEmail: string): Promise<{
  role: 'superuser' | 'editor'
  club_id?: string
  zone_id?: string
  district_id?: string
} | null> {
  
  // Return null if no email provided
  if (!userEmail || userEmail.trim() === '') {
    return null
  }
  
  // Get user role from approved_users table
  const { data: userData, error: userError } = await supabase
    .from('approved_users')
    .select('role')
    .eq('email', userEmail)
    .single()
  
  if (userError || !userData) {
    return null
  }

  // If user is superuser, they don't need entity permissions
  if (userData.role === 'superuser') {
    return {
      role: userData.role as 'superuser' | 'editor'
    }
  }

  // Get user's entity permissions from user_entity_permissions table
  const { data: permissionsData, error: permissionsError } = await supabase
    .from('user_entity_permissions')
    .select('entity_type, entity_id')
    .eq('user_email', userEmail)
  
  if (permissionsError) {
    return {
      role: userData.role as 'superuser' | 'editor'
    }
  }

  // Extract entity IDs by type
  const club_id = permissionsData?.find(p => p.entity_type === 'club')?.entity_id
  const zone_id = permissionsData?.find(p => p.entity_type === 'zone')?.entity_id
  const district_id = permissionsData?.find(p => p.entity_type === 'district')?.entity_id

  return {
    role: userData.role as 'superuser' | 'editor',
    club_id,
    zone_id,
    district_id
  }
}
