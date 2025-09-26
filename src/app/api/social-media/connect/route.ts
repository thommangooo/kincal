import { NextRequest, NextResponse } from 'next/server'
import { createSocialMediaAccount } from '@/lib/socialMedia'
import { getEncryptionKey } from '@/lib/encryption'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pagesData, entityType, entityId, userEmail } = body

    if (!pagesData || !entityType || !entityId || !userEmail) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    console.log('Creating accounts for pages:', pagesData)
    console.log('Entity info:', { entityType, entityId, userEmail })
    
    // Debug encryption key
    const encryptionKey = getEncryptionKey()
    console.log('Connect route encryption key hash (first 16 chars):', encryptionKey.substring(0, 16))

    // Create admin Supabase client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create social media accounts for each page
    const createdAccounts = []
    for (const page of pagesData) {
      try {
        console.log(`Creating account for page: ${page.name} (${page.id})`)
        const account = await createSocialMediaAccount({
          entity_type: entityType,
          entity_id: entityId,
          platform: 'facebook',
          account_id: page.id,
          account_name: page.name,
          page_id: page.id,
          access_token: page.access_token,
          token_expires_at: new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)).toISOString(), // 60 days
          created_by_email: userEmail
        }, supabaseAdmin)
        console.log(`Successfully created account:`, account)
        createdAccounts.push(account)
      } catch (error) {
        console.error(`Error creating account for page ${page.name}:`, error)
        // Continue with other pages even if one fails
      }
    }

    console.log(`Created ${createdAccounts.length} accounts out of ${pagesData.length} pages`)

    return NextResponse.json({ 
      success: true, 
      accounts: createdAccounts,
      message: `Successfully connected ${createdAccounts.length} Facebook page(s)`
    })

  } catch (error) {
    console.error('Error connecting Facebook accounts:', error)
    return NextResponse.json({ error: 'Failed to connect Facebook accounts' }, { status: 500 })
  }
}
