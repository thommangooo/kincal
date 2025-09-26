import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      location, 
      image_url, 
      event_url, 
      visibility, 
      entity_type, 
      entity_id, 
      created_by_email 
    } = body

    // Create a Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the zone_id and district_id for the entity
    let zone_id, district_id
    if (entity_type === 'club') {
      const { data: club } = await supabaseAdmin
        .from('clubs')
        .select('zone_id, district_id')
        .eq('id', entity_id)
        .single()
      zone_id = club?.zone_id
      district_id = club?.district_id
    } else if (entity_type === 'zone') {
      zone_id = entity_id
      const { data: zone } = await supabaseAdmin
        .from('zones')
        .select('district_id')
        .eq('id', entity_id)
        .single()
      district_id = zone?.district_id
    } else if (entity_type === 'district') {
      district_id = entity_id
    }

    console.log('Creating event with data:', body)
    console.log('Environment check:', {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
    })

    // Create the event
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        title,
        description,
        start_date,
        end_date: end_date || start_date, // Use start_date as end_date if not provided
        location,
        image_url,
        event_url,
        visibility,
        entity_type,
        entity_id,
        zone_id,
        district_id,
        created_by_email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      console.error('Event data that failed:', {
        title,
        description,
        start_date,
        end_date: end_date || start_date,
        location,
        image_url,
        event_url,
        visibility,
        entity_type,
        entity_id,
        zone_id,
        district_id,
        created_by_email
      })
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Event created successfully:', event)
    return NextResponse.json({ success: true, event })

  } catch (error) {
    console.error('Error in events API:', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
