import { supabase } from './supabase'
import { encrypt, decrypt } from './encryption'
import { FacebookPage } from './facebook'

// Types for social media accounts
export interface SocialMediaAccount {
  id: string
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  platform: 'facebook' | 'instagram'
  account_id: string
  account_name: string
  page_id?: string
  is_active: boolean
  last_used_at?: string
  error_count: number
  created_by_email: string
  created_at: string
  updated_at: string
}

export interface SocialMediaPost {
  id: string
  content_id: string
  content_type: 'event' | 'announcement'
  social_account_id: string
  platform_post_id?: string
  status: 'pending' | 'posted' | 'failed' | 'cancelled'
  error_message?: string
  custom_message?: string
  posted_at?: string
  created_at: string
  updated_at: string
}

// Create a new social media account
export async function createSocialMediaAccount(account: {
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  platform: 'facebook' | 'instagram'
  account_id: string
  account_name: string
  page_id?: string
  access_token: string
  refresh_token?: string
  token_expires_at?: string
  created_by_email: string
}, supabaseClient = supabase): Promise<SocialMediaAccount> {
  const { data, error } = await supabaseClient
    .from('social_media_accounts')
    .insert({
      entity_type: account.entity_type,
      entity_id: account.entity_id,
      platform: account.platform,
      account_id: account.account_id,
      account_name: account.account_name,
      page_id: account.page_id,
      access_token_encrypted: encrypt(account.access_token),
      refresh_token_encrypted: account.refresh_token ? encrypt(account.refresh_token) : null,
      token_expires_at: account.token_expires_at,
      created_by_email: account.created_by_email
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Get social media accounts for an entity
export async function getSocialMediaAccounts(
  entityType: 'club' | 'zone' | 'district',
  entityId: string
): Promise<SocialMediaAccount[]> {
  const { data, error } = await supabase
    .from('social_media_accounts')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Get a specific social media account
export async function getSocialMediaAccount(id: string): Promise<SocialMediaAccount | null> {
  const { data, error } = await supabase
    .from('social_media_accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

// Get decrypted access token for an account
export async function getDecryptedAccessToken(accountId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('social_media_accounts')
    .select('access_token_encrypted')
    .eq('id', accountId)
    .single()

  if (error || !data?.access_token_encrypted) return null
  
  try {
    return decrypt(data.access_token_encrypted)
  } catch {
    return null
  }
}

// Update access token for an account
export async function updateAccessToken(
  accountId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: string
): Promise<void> {
  const updateData: any = {
    access_token_encrypted: encrypt(accessToken),
    updated_at: new Date().toISOString()
  }

  if (refreshToken) {
    updateData.refresh_token_encrypted = encrypt(refreshToken)
  }

  if (expiresAt) {
    updateData.token_expires_at = expiresAt
  }

  const { error } = await supabase
    .from('social_media_accounts')
    .update(updateData)
    .eq('id', accountId)

  if (error) throw error
}

// Delete a social media account
export async function deactivateSocialMediaAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from('social_media_accounts')
    .delete()
    .eq('id', accountId)

  if (error) throw error
}

// Record a successful post
export async function recordSuccessfulPost(
  contentId: string,
  contentType: 'event' | 'announcement',
  socialAccountId: string,
  platformPostId: string,
  customMessage?: string
): Promise<SocialMediaPost> {
  const { data, error } = await supabase
    .from('social_media_posts')
    .insert({
      content_id: contentId,
      content_type: contentType,
      social_account_id: socialAccountId,
      platform_post_id: platformPostId,
      status: 'posted',
      custom_message: customMessage,
      posted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Update the social media account's last_used_at
  await supabase
    .from('social_media_accounts')
    .update({ 
      last_used_at: new Date().toISOString(),
      error_count: 0 // Reset error count on successful post
    })
    .eq('id', socialAccountId)

  return data
}

// Record a failed post
export async function recordFailedPost(
  contentId: string,
  contentType: 'event' | 'announcement',
  socialAccountId: string,
  errorMessage: string,
  customMessage?: string
): Promise<SocialMediaPost> {
  const { data, error } = await supabase
    .from('social_media_posts')
    .insert({
      content_id: contentId,
      content_type: contentType,
      social_account_id: socialAccountId,
      status: 'failed',
      error_message: errorMessage,
      custom_message: customMessage
    })
    .select()
    .single()

  if (error) throw error

  // Increment error count on the social media account
  await supabase
    .from('social_media_accounts')
    .update({ 
      error_count: supabase.raw('error_count + 1'),
      updated_at: new Date().toISOString()
    })
    .eq('id', socialAccountId)

  return data
}

// Get posts for a piece of content
export async function getSocialMediaPosts(
  contentId: string,
  contentType: 'event' | 'announcement'
): Promise<SocialMediaPost[]> {
  const { data, error } = await supabase
    .from('social_media_posts')
    .select(`
      *,
      social_media_accounts!inner(
        account_name,
        platform
      )
    `)
    .eq('content_id', contentId)
    .eq('content_type', contentType)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Check if user has permission to manage social media for an entity
export async function canManageSocialMedia(
  userEmail: string,
  entityType: 'club' | 'zone' | 'district',
  entityId: string
): Promise<boolean> {
  // Check if user is superuser
  const { data: userData } = await supabase
    .from('approved_users')
    .select('role')
    .eq('email', userEmail)
    .single()

  if (userData?.role === 'superuser') return true

  // Check if user has entity permissions
  const { data: permissionData } = await supabase
    .from('user_entity_permissions')
    .select('id')
    .eq('user_email', userEmail)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .single()

  return !!permissionData
}

// Get Facebook pages for a user (used during OAuth flow)
export async function getFacebookPagesForUser(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get Facebook pages: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  return data.data || []
}
