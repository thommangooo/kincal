import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface District {
  id: string
  name: string
  province: string
  created_at: string
  updated_at: string
}

export interface Zone {
  id: string
  name: string
  district_id: string
  zone_letter: string
  created_at: string
  updated_at: string
  district?: District
}

export interface Club {
  id: string
  name: string
  city: string
  club_type: 'Kinsmen' | 'Kinette' | 'Kin'
  zone_id: string
  district_id: string
  website?: string
  created_at: string
  updated_at: string
  zone?: Zone
  district?: District
}

export interface Event {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  location?: string
  club_id: string | null
  zone_id: string | null
  district_id: string | null
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  visibility: 'public' | 'private'
  tags?: string[]
  event_url?: string | null
  image_url?: string | null
  created_by_email: string
  created_at: string
  updated_at: string
  club?: Club
  zone?: Zone
  district?: District
}

export interface Announcement {
  id: string
  title: string
  content: string // HTML content
  publish_date: string
  expiry_date?: string | null
  club_id: string | null
  zone_id: string | null
  district_id: string | null
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  visibility: 'public' | 'private'
  tags?: string[]
  priority: number
  image_url?: string | null
  created_by_email: string
  created_at: string
  updated_at: string
  club?: Club
  zone?: Zone
  district?: District
}

export interface UserEntityPermission {
  id: string
  user_email: string
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  created_at: string
  updated_at: string
  entity?: Club | Zone | District
}

export interface MagicLinkToken {
  id: string
  email: string
  token: string
  expires_at: string
  used: boolean
  created_at: string
}
