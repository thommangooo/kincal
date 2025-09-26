import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  console.log('=== FACEBOOK EVENTS API CALLED ===')
  console.log('Request URL:', request.url)
  
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    const accountId = searchParams.get('accountId')

    console.log('Parameters:', { pageId, accountId })

    if (!pageId || !accountId) {
      console.log('Missing required parameters')
      return NextResponse.json({ error: 'Missing pageId or accountId' }, { status: 400 })
    }

    // Get the social media account from database
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

    if (accountError || !account) {
      return NextResponse.json({ error: 'Social media account not found' }, { status: 404 })
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decrypt(account.access_token_encrypted)
    } catch (decryptError) {
      console.error('Decryption error:', decryptError)
      return NextResponse.json({ error: 'Failed to decrypt access token' }, { status: 500 })
    }

    // Try to fetch events from Facebook page feed instead of events endpoint
    console.log('Fetching posts from Facebook page feed:', pageId)
    const facebookResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed?fields=id,message,created_time,attachments&access_token=${accessToken}`)
    
    if (!facebookResponse.ok) {
      const errorData = await facebookResponse.json()
      console.error('Facebook API error:', errorData)
      return NextResponse.json({ 
        error: `Failed to fetch Facebook events: ${errorData.error?.message || 'Unknown error'}` 
      }, { status: 400 })
    }

           const data = await facebookResponse.json()
           const posts = data.data || []

           console.log('=== RAW FACEBOOK DATA ===')
           console.log('Total posts fetched:', posts.length)
           console.log('Sample post structure:', JSON.stringify(posts[0], null, 2))
           console.log('========================')

           // Show all posts (no filtering since we're importing as announcements)
           console.log('=== ALL POSTS ===')
           console.log('Total posts fetched:', posts.length)
           posts.forEach((post: {
            id: string
            message?: string
            created_time: string
            attachments?: {
              data?: Array<{
                media?: {
                  image?: {
                    src: string
                  }
                }
              }>
            }
          }, index: number) => {
             console.log(`Post ${index + 1}:`, {
               id: post.id,
               message: post.message?.substring(0, 200) + '...',
               created_time: post.created_time,
               attachments: post.attachments?.data?.length || 0,
               has_image: !!post.attachments?.data?.[0]?.media?.image?.src
             })
           })
           console.log('================')

           // Use all posts (no filtering)
           const eventPosts = posts

           // Transform Facebook posts to our format
           const transformedEvents = eventPosts.map((post: {
            id: string
            message?: string
            created_time: string
            attachments?: {
              data?: Array<{
                media?: {
                  image?: {
                    src: string
                  }
                }
              }>
            }
          }) => ({
             id: post.id,
             title: post.message?.substring(0, 100) || 'Facebook Post',
             description: post.message || '',
             start_time: post.created_time,
             end_time: null,
             location: '',
             cover_image: post.attachments?.data?.[0]?.media?.image?.src || null,
             facebook_url: `https://facebook.com/${post.id}`,
             source: 'facebook_post'
           }))

           console.log('=== TRANSFORMED EVENTS ===')
           console.log('Final transformed data:', JSON.stringify(transformedEvents, null, 2))
           console.log('=========================')

    return NextResponse.json({ 
      success: true, 
      events: transformedEvents,
      page_name: account.account_name,
      message: `Found ${transformedEvents.length} event-related posts from ${account.account_name}`
    })

  } catch (error) {
    console.error('Error fetching Facebook events:', error)
    return NextResponse.json({ error: 'Failed to fetch Facebook events' }, { status: 500 })
  }
}
