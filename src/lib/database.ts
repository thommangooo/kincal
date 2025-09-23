import { supabase, DbEvent, Announcement, Club, Zone, District, UserEntityPermission } from './supabase'

// Re-export types for use in other files
export type { DbEvent as Event, Announcement, Club, Zone, District, UserEntityPermission }

// User management types
export interface ApprovedUser {
  id: string
  email: string
  name: string | null
  role: 'superuser' | 'editor'
  created_at: string
  updated_at: string
}

// Event operations
export async function getEvents(filters?: {
  clubId?: string
  zoneId?: string
  districtId?: string
  visibility?: 'public' | 'private' | 'internal-use'
  startDate?: Date
  endDate?: Date
  includeZoneEvents?: boolean
  includeClubEvents?: boolean
}) {
  console.log('getEvents called with filters:', filters)
  let query = supabase
    .from('events')
    .select(`
      *,
      club:clubs!club_id(*),
      zone:zones!zone_id(*),
      district:districts!district_id(*)
    `)
    .order('start_date', { ascending: true })

  // Handle entity filtering with include options
  if (filters?.clubId) {
    // Club selected - show only that club's events
    query = query.eq('club_id', filters.clubId)
  } else if (filters?.zoneId) {
    // Zone selected - show zone events and optionally club events in that zone
    if (filters.includeClubEvents === false) {
      // Only show zone-posted events (exclude club events)
      query = query.eq('zone_id', filters.zoneId).is('club_id', null)
    } else {
      // Show zone events OR club events in this zone
      // First get all clubs in this zone
      const { data: zoneClubs } = await supabase
        .from('clubs')
        .select('id')
        .eq('zone_id', filters.zoneId)
      
      const clubIds = zoneClubs?.map(club => club.id) || []
      if (clubIds.length > 0) {
        // zone events (club_id is null) OR club events in this zone
        query = query.or(`and(zone_id.eq.${filters.zoneId},club_id.is.null),club_id.in.(${clubIds.join(',')})`)
      } else {
        // No clubs in zone, just zone-posted events
        query = query.eq('zone_id', filters.zoneId).is('club_id', null)
      }
    }
  } else if (filters?.districtId) {
    // District selected - show district events and optionally zone/club events in that district
    const conditions: string[] = []
    // Always include district-posted events unless explicitly filtered out (by unchecking both is still include district)
    conditions.push(`and(district_id.eq.${filters.districtId},zone_id.is.null,club_id.is.null)`)
    
    if (filters.includeZoneEvents !== false) {
      // Include zone-posted events in this district (exclude club events)
      const { data: districtZones } = await supabase
        .from('zones')
        .select('id')
        .eq('district_id', filters.districtId)
      
      const zoneIds = districtZones?.map(zone => zone.id) || []
      if (zoneIds.length > 0) {
        conditions.push(`and(zone_id.in.(${zoneIds.join(',')}),club_id.is.null)`)
      }
    }
    
    if (filters.includeClubEvents !== false) {
      // Include club events for clubs whose zones are in this district
      const { data: districtZones } = await supabase
        .from('zones')
        .select('id')
        .eq('district_id', filters.districtId)
      
      const zoneIds = districtZones?.map(zone => zone.id) || []
      if (zoneIds.length > 0) {
        const { data: districtClubs } = await supabase
          .from('clubs')
          .select('id')
          .in('zone_id', zoneIds)
        
        const clubIds = districtClubs?.map(club => club.id) || []
        if (clubIds.length > 0) {
          conditions.push(`club_id.in.(${clubIds.join(',')})`)
        }
      }
    }
    
    query = query.or(conditions.join(','))
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
  // Validate entity-specific required fields based on entity_type
  if (event.entity_type === 'club' && !event.club_id) {
    throw new Error('Event club_id is required for club events')
  }
  if (event.entity_type === 'zone' && !event.zone_id) {
    throw new Error('Event zone_id is required for zone events')
  }
  if (event.entity_type === 'district' && !event.district_id) {
    throw new Error('Event district_id is required for district events')
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
  visibility?: 'public' | 'private' | 'internal-use'
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

// Get clubs with their usage status (whether they have users with permissions)
export async function getClubsWithUsageStatus(): Promise<(Club & { isActive: boolean })[]> {
  try {
    // Get all clubs with their zone and district info
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select(`
        *,
        zone:zones(*, district:districts(*))
      `)
      .order('name')

    if (clubsError) throw clubsError

    // Get all club IDs that have users with permissions
    const { data: activeClubIds, error: permissionsError } = await supabase
      .from('user_entity_permissions')
      .select('entity_id')
      .eq('entity_type', 'club')

    if (permissionsError) throw permissionsError

    const activeClubIdSet = new Set(activeClubIds?.map(p => p.entity_id) || [])

    // Add usage status to each club
    return clubs?.map(club => ({
      ...club,
      isActive: activeClubIdSet.has(club.id)
    })) || []

  } catch (error) {
    console.error('Error loading clubs with usage status:', error)
    return []
  }
}

// Get zones with their usage status and proper naming
export async function getZonesWithUsageStatus(): Promise<(Zone & { isActive: boolean, displayName: string })[]> {
  try {
    // Get all zones with their district info
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select(`
        *,
        district:districts(*)
      `)
      .order('name')

    if (zonesError) throw zonesError

    // Get all zone IDs that have users with permissions
    const { data: activeZoneIds, error: permissionsError } = await supabase
      .from('user_entity_permissions')
      .select('entity_id')
      .eq('entity_type', 'zone')

    if (permissionsError) throw permissionsError

    const activeZoneIdSet = new Set(activeZoneIds?.map(p => p.entity_id) || [])

    // Add usage status and display name to each zone
    return zones?.map(zone => ({
      ...zone,
      isActive: activeZoneIdSet.has(zone.id),
      displayName: `${zone.name}, ${zone.district?.name || 'Unknown District'}`
    })) || []

  } catch (error) {
    console.error('Error loading zones with usage status:', error)
    return []
  }
}

// Get districts with their usage status
export async function getDistrictsWithUsageStatus(): Promise<(District & { isActive: boolean })[]> {
  try {
    // Get all districts
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select('*')
      .order('name')

    if (districtsError) throw districtsError

    // Get all district IDs that have users with permissions
    const { data: activeDistrictIds, error: permissionsError } = await supabase
      .from('user_entity_permissions')
      .select('entity_id')
      .eq('entity_type', 'district')

    if (permissionsError) throw permissionsError

    const activeDistrictIdSet = new Set(activeDistrictIds?.map(p => p.entity_id) || [])

    // Add usage status to each district
    return districts?.map(district => ({
      ...district,
      isActive: activeDistrictIdSet.has(district.id)
    })) || []

  } catch (error) {
    console.error('Error loading districts with usage status:', error)
    return []
  }
}

// User Management operations
export async function getApprovedUsers(): Promise<ApprovedUser[]> {
  const { data: users, error } = await supabase
    .from('approved_users')
    .select('*')
    .order('email')

  if (error) throw error
  return users || []
}

export async function createApprovedUser(user: {
  email: string
  name?: string
  role: 'superuser' | 'editor'
}): Promise<ApprovedUser> {
  const { data, error } = await supabase
    .from('approved_users')
    .insert({
      email: user.email.toLowerCase(),
      name: user.name || null,
      role: user.role
    })
    .select()
    .single()

  if (error) {
    // If it's a duplicate key error, try to get the existing user
    if (error.code === '23505') { // Unique constraint violation
      const { data: existingUser, error: fetchError } = await supabase
        .from('approved_users')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .single()
      
      if (fetchError) {
        throw new Error(`User already exists but could not be retrieved: ${fetchError.message}`)
      }
      return existingUser
    }
    throw error
  }
  return data
}

export async function updateApprovedUser(id: string, updates: {
  email?: string
  name?: string
  role?: 'superuser' | 'editor'
}): Promise<ApprovedUser> {
  const updateData: Partial<Pick<ApprovedUser, 'email' | 'name' | 'role'>> = {}
  if (updates.email) updateData.email = updates.email.toLowerCase()
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.role) updateData.role = updates.role

  const { data, error } = await supabase
    .from('approved_users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteApprovedUser(id: string): Promise<void> {
  // First, delete all user entity permissions for this user
  const { data: user } = await supabase
    .from('approved_users')
    .select('email')
    .eq('id', id)
    .single()

  if (user) {
    await supabase
      .from('user_entity_permissions')
      .delete()
      .eq('user_email', user.email)
  }

  // Then delete the user
  const { error } = await supabase
    .from('approved_users')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getUserWithPermissions(userId: string): Promise<{
  user: ApprovedUser
  permissions: UserEntityPermission[]
} | null> {
  // Get user details
  const { data: user, error: userError } = await supabase
    .from('approved_users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !user) return null

  // Get user permissions
  const permissions = await getUserEntityPermissions(user.email)

  return {
    user,
    permissions
  }
}

// Create user with entity permissions in a single transaction
export async function createUserWithPermissions(user: {
  email: string
  name?: string
  role: 'superuser' | 'editor'
  entityIds?: string[]
}): Promise<ApprovedUser> {
  // If superuser, no need for entity permissions
  if (user.role === 'superuser') {
    return await createApprovedUser({
      email: user.email,
      name: user.name,
      role: user.role
    })
  }

  // For editors, require at least one entity assignment
  if (!user.entityIds || user.entityIds.length === 0) {
    throw new Error('Editor users must be assigned to at least one entity (club, zone, or district)')
  }

  // Create the user first
  const newUser = await createApprovedUser({
    email: user.email,
    name: user.name,
    role: user.role
  })

  // Get all entities to determine types
  const entities = await getAllEntitiesForAssignment()
  
  // Then create the entity permissions
  for (const entityId of user.entityIds) {
    const entityType = getEntityType(entityId, entities)
    await createUserEntityPermission({
      user_email: user.email.toLowerCase(),
      entity_id: entityId,
      entity_type: entityType
    })
  }

  return newUser
}

// Update user with entity permissions
export async function updateUserWithPermissions(
  userId: string, 
  updates: {
    email?: string
    name?: string
    role?: 'superuser' | 'editor'
    entityIds?: string[]
  }
): Promise<ApprovedUser> {
  // If superuser, no need for entity permissions
  if (updates.role === 'superuser') {
    // Remove all existing permissions for superusers
    const { data: user } = await supabase
      .from('approved_users')
      .select('email')
      .eq('id', userId)
      .single()

    if (user) {
      await supabase
        .from('user_entity_permissions')
        .delete()
        .eq('user_email', user.email)
    }

    return await updateApprovedUser(userId, updates)
  }

  // For editors, require at least one entity assignment
  if (updates.role === 'editor' && (!updates.entityIds || updates.entityIds.length === 0)) {
    throw new Error('Editor users must be assigned to at least one entity (club, zone, or district)')
  }

  // Update the user first
  const updatedUser = await updateApprovedUser(userId, updates)

  // If entityIds are provided, update the permissions
  if (updates.entityIds !== undefined) {
    // Get current user email (in case it was updated)
    const { data: user } = await supabase
      .from('approved_users')
      .select('email')
      .eq('id', userId)
      .single()

    if (user) {
      // Remove all existing permissions
      await supabase
        .from('user_entity_permissions')
        .delete()
        .eq('user_email', user.email)

      // Add new permissions if any
      if (updates.entityIds.length > 0) {
        // Get all entities to determine types
        const entities = await getAllEntitiesForAssignment()
        
        for (const entityId of updates.entityIds) {
          const entityType = getEntityType(entityId, entities)
          await createUserEntityPermission({
            user_email: user.email.toLowerCase(),
            entity_id: entityId,
            entity_type: entityType
          })
        }
      }
    }
  }

  return updatedUser
}

// Get all available entities (clubs, zones, districts) for user assignment
export async function getAllEntitiesForAssignment(): Promise<{
  clubs: Club[]
  zones: Zone[]
  districts: District[]
}> {
  const [clubs, zones, districts] = await Promise.all([
    getClubs(),
    getZones(),
    getDistricts()
  ])

  return { clubs, zones, districts }
}

// Helper function to determine entity type from entity ID
export function getEntityType(entityId: string, entities: { clubs: Club[], zones: Zone[], districts: District[] }): 'club' | 'zone' | 'district' {
  if (entities.clubs.some(club => club.id === entityId)) return 'club'
  if (entities.zones.some(zone => zone.id === entityId)) return 'zone'
  if (entities.districts.some(district => district.id === entityId)) return 'district'
  throw new Error(`Unknown entity ID: ${entityId}`)
}
