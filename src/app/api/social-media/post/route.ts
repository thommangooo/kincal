import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, eventData, eventId } = body

    console.log('Facebook posting request:', { accountId, eventData: eventData?.title, eventId })

    if (!accountId || !eventData || !eventId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get the social media account from database
    console.log('Looking for account with ID:', accountId)
    
    // Create a Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: account, error: accountError } = await supabaseAdmin
      .from('social_media_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('is_active', true)
      .single()

    console.log('Database query result:', { account, accountError })

    if (accountError || !account) {
      console.error('Account not found:', accountError)
      return NextResponse.json({ error: 'Social media account not found' }, { status: 404 })
    }

    console.log('Found account:', { id: account.id, name: account.account_name, page_id: account.page_id })

    // Decrypt the access token
    let accessToken: string
    try {
      console.log('Encrypted token length:', account.access_token_encrypted.length)
      console.log('Encrypted token format:', account.access_token_encrypted.substring(0, 50) + '...')
      accessToken = decrypt(account.access_token_encrypted)
      console.log('Access token decrypted successfully, length:', accessToken.length)
    } catch (decryptError) {
      console.error('Decryption error:', decryptError)
      console.error('Encrypted token that failed:', account.access_token_encrypted)
      return NextResponse.json({ error: 'Failed to decrypt access token' }, { status: 500 })
    }

    // Create Facebook Post with event information
    console.log('Creating Facebook Post with event details:', { page_id: account.page_id, title: eventData.title })
    
    // Prepare post data for Facebook
    let postMessage = `🎉 ${eventData.title}\n\n${eventData.description || ''}\n\n📅 ${new Date(eventData.start_date).toLocaleDateString()}`
    if (eventData.location) {
      postMessage += `\n📍 ${eventData.location}`
    }
    postMessage += `\n\n#KinCalendar #Kinsmen`
    
    const postPayload: any = {
      message: postMessage,
      access_token: accessToken
    }
    
    // Handle image upload if provided
    if (eventData.image_url) {
      try {
        console.log('Uploading image to Facebook:', eventData.image_url)
        
        const photoResponse = await fetch(`https://graph.facebook.com/v18.0/${account.page_id}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: eventData.image_url,
            published: false, // Don't publish the photo separately
            access_token: accessToken
          })
        })
        
        if (photoResponse.ok) {
          const photoData = await photoResponse.json()
          console.log('Image uploaded successfully:', photoData.id)
          postPayload.attached_media = JSON.stringify([{
            media_fbid: photoData.id
          }])
        } else {
          console.log('Image upload failed, continuing without image')
        }
      } catch (imageError) {
        console.log('Image upload error, continuing without image:', imageError)
      }
    }
    
    const facebookResponse = await fetch(`https://graph.facebook.com/v18.0/${account.page_id}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postPayload)
    })

    console.log('Facebook API response status:', facebookResponse.status)

    if (!facebookResponse.ok) {
      const errorData = await facebookResponse.json()
      console.error('Facebook API error:', errorData)
      return NextResponse.json({ 
        error: `Facebook posting failed: ${errorData.error?.message || 'Unknown error'}` 
      }, { status: 400 })
    }

    const result = await facebookResponse.json()

    // Store the post record in our database
    const { error: postError } = await supabaseAdmin
      .from('social_media_posts')
      .insert({
        content_id: eventId,
        content_type: 'event',
        social_account_id: accountId,
        platform_post_id: result.id,
        status: 'posted',
        posted_at: new Date().toISOString()
      })

    if (postError) {
      console.error('Error storing post record:', postError)
      // Don't fail the request if we can't store the record
    }

    return NextResponse.json({ 
      success: true, 
      postId: result.id,
      message: `Successfully posted event details to Facebook on ${account.account_name}` 
    })

  } catch (error) {
    console.error('Error posting to Facebook:', error)
    return NextResponse.json({ error: 'Failed to post to Facebook' }, { status: 500 })
  }
}
