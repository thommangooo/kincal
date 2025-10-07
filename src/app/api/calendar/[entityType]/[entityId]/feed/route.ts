import { NextRequest, NextResponse } from 'next/server'
import { getEvents, getEntityDetails } from '@/lib/database'
import { generateEntityICSFeed } from '@/lib/calendarExport'

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const { entityType, entityId } = params
    
    // Validate entity type
    if (!['club', 'zone', 'district'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }
    
    // Get entity details to get the name
    const entity = await getEntityDetails(
      entityType as 'club' | 'zone' | 'district',
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
    }
    
    const events = await getEvents(filters)
    
    // Generate ICS feed
    const icsContent = generateEntityICSFeed(
      events,
      entity.name,
      entityType as 'club' | 'zone' | 'district'
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
        'Access-Control-Allow-Headers': 'Content-Type'
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

