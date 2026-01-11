import { NextRequest, NextResponse } from 'next/server'
import { getEvents, getEntityDetails } from '@/lib/database'
import { generateEntityICSFeed, getTimezoneFromProvince } from '@/lib/calendarExport'
import { Club, Zone, District, DbEvent } from '@/lib/supabase'

// This route should be publicly accessible for calendar subscriptions
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  console.log('[Calendar Feed] Route handler called')
  try {
    const { entityType, entityId } = await params
    console.log(`[Calendar Feed] Request received: ${entityType}/${entityId}`)
    console.log(`[Calendar Feed] Full URL: ${request.url}`)
    
    // Validate entity type
    if (!['club', 'zone', 'district', 'kin_canada'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }
    
    // Get entity details to get the name
    const entity = await getEntityDetails(
      entityType as 'club' | 'zone' | 'district' | 'kin_canada',
      entityId
    )
    
    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }
    
    // Get all public events for this entity
    const filters: {
      clubId?: string
      zoneId?: string
      districtId?: string
      kinCanadaId?: string
      visibility: 'public' | 'private' | 'internal-use'
    } = {
      visibility: 'public'
    }
    
    if (entityType === 'club') {
      filters.clubId = entityId
    } else if (entityType === 'zone') {
      filters.zoneId = entityId
    } else if (entityType === 'district') {
      filters.districtId = entityId
    } else if (entityType === 'kin_canada') {
      filters.kinCanadaId = entityId
    }
    
    const events = await getEvents(filters)
    
    // Determine timezone from entity location
    // For clubs: use club's district province
    // For zones: use zone's district province
    // For districts: use UTC (may span multiple provinces/timezones)
    // For kin_canada: use UTC (national entity spans all timezones)
    let timezone: string | null = null
    let province: string | null = null
    
    if (entityType === 'club') {
      const club = entity as Club & { district?: District }
      // Try multiple ways to access the province
      province = club.district?.province || null
      if (province) {
        timezone = getTimezoneFromProvince(province)
      }
    } else if (entityType === 'zone') {
      const zone = entity as Zone & { district?: District }
      province = zone.district?.province || null
      if (province) {
        timezone = getTimezoneFromProvince(province)
      }
    } else if (entityType === 'district') {
      const district = entity as District
      province = district.province || null
      // For districts, we could use the province, but since districts might span
      // multiple timezones (e.g., if they cross province boundaries), UTC is safer
      // Uncomment the next lines if you want to use district province timezone:
      // if (province) {
      //   timezone = getTimezoneFromProvince(province)
      // }
      timezone = null // Use UTC for districts
    } else if (entityType === 'kin_canada') {
      // Kin Canada spans all provinces/timezones, use UTC
      timezone = null
    }
    
    // If timezone detection failed, try to get it from the first event's club
    if (!timezone && events.length > 0) {
      const firstEvent = events[0] as DbEvent & { 
        club?: Club & { district?: District }
        zone?: Zone & { district?: District }
        district?: District
      }
      if (firstEvent.club?.district?.province) {
        province = firstEvent.club.district.province
        timezone = getTimezoneFromProvince(province)
      } else if (firstEvent.zone?.district?.province) {
        province = firstEvent.zone.district.province
        timezone = getTimezoneFromProvince(province)
      } else if (firstEvent.district?.province) {
        province = firstEvent.district.province
        timezone = getTimezoneFromProvince(province)
      }
    }
    
    // Final fallback: if still no timezone, default to America/Toronto for clubs/zones
    // (This is a reasonable default since most Kin Canada clubs are in Eastern Time)
    // Districts and kin_canada should use UTC since they may span multiple timezones
    if (!timezone && entityType !== 'district' && entityType !== 'kin_canada') {
      timezone = 'America/Toronto'
      console.log('Using default timezone America/Toronto as fallback for', entityType)
    }
    
    // Debug logging - detailed timezone detection info
    console.log('[Calendar Feed] Generation started:', {
      entityType,
      entityName: entity.name,
      province,
      detectedTimezone: timezone,
      eventCount: events.length,
      entityStructure: Object.keys(entity || {}),
      entityData: JSON.stringify(entity, null, 2).substring(0, 500) // First 500 chars
    })
    
    // Test timezone conversion on first event if available
    if (events.length > 0) {
      const testEvent = events[0]
      const testDate = new Date(testEvent.start_date)
      console.log('[Calendar Feed] Sample event time conversion test:', {
        eventTitle: testEvent.title,
        originalUTC: testEvent.start_date,
        timezone,
        testDateISO: testDate.toISOString(),
        testDateLocal: testDate.toLocaleString('en-US', { timeZone: timezone || 'UTC' })
      })
    }
    
    // Generate ICS feed with determined timezone
    const icsContent = generateEntityICSFeed(
      events,
      entity.name,
      timezone
    )
    
    // Return ICS with subscription-friendly headers (don't force attachment)
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        // Inline disposition is more compatible with webcal/Google add-by-url flows
        'Content-Disposition': `inline; filename="${entity.name.replace(/[^a-z0-9]/gi, '_')}_calendar.ics"`,
        // Short-lived caching so Google can fetch periodically without stale issues
        'Cache-Control': 'public, max-age=60',
        'Pragma': 'public',
        // Allow CORS for calendar apps
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Version header to track deployments
        'X-ICS-Version': '2.0-tz-fix'
      }
    })
  } catch (error) {
    console.error('Error generating calendar feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate calendar feed' },
      { status: 500 }
    )
  }
}

