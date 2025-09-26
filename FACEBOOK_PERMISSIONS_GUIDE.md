# Facebook App Permissions Guide

## Required Permissions for Event Creation

To create Facebook Events (not just posts), your Facebook app needs the following permissions:

### 1. Current Permissions (Already Working)
- `pages_manage_posts` - Create and manage posts
- `pages_read_engagement` - Read page engagement data
- `pages_show_list` - List user's pages
- `instagram_basic` - Basic Instagram access

### 2. Additional Permission Needed
- `pages_manage_events` - **Create, edit, and delete events on Facebook Pages**

## How to Request the Permission

### Step 1: Access Facebook Developer Dashboard
1. Go to [Facebook Developer Dashboard](https://developers.facebook.com/apps/)
2. Select your KinCal app

### Step 2: Navigate to App Review
1. In the left sidebar, click **"App Review"**
2. Click **"Permissions and Features"**

### Step 3: Request pages_manage_events Permission
1. Find **"pages_manage_events"** in the list
2. Click **"Request"** next to it

### Step 4: Provide Justification
You'll need to explain why your app needs this permission. Here's a suggested justification:

```
Our KinCal application allows Kinsmen clubs to create and manage events for their community activities. The pages_manage_events permission is essential for:

1. **Event Creation**: Clubs need to create Facebook events for their meetings, fundraisers, and community activities
2. **Event Management**: Clubs need to update event details, times, and locations as plans change
3. **Community Engagement**: Facebook events help clubs reach a broader audience and increase attendance
4. **Automated Integration**: Our system automatically creates Facebook events when clubs add events to their calendar

This permission enables clubs to maintain an active presence on Facebook and engage with their community through properly formatted events rather than just regular posts.
```

### Step 5: Submit for Review
1. Fill out all required fields
2. Submit the request
3. Wait for Facebook's review (typically 1-7 days)

## What Happens After Approval

Once approved:
1. **Reconnect Facebook accounts** to get the new permissions
2. **Events will be created as actual Facebook Events** (not just posts)
3. **Events will appear in Facebook's event system** with proper RSVP functionality
4. **Images will be set as event cover photos**

## Current Workaround

Until the permission is approved, the system will:
- Try to create Facebook Events first
- Fall back to regular posts if event creation fails
- Still include all event information in the posts

## Testing

After getting the permission:
1. Disconnect and reconnect your Facebook account
2. Create a test event with an image
3. Check your Facebook page - you should see a proper Facebook Event
4. The event should appear in Facebook's event system with RSVP options

## Important Notes

- **App Review is required** for `pages_manage_events` - it's not available for development/testing
- **The permission is page-specific** - each page needs to grant the permission
- **Events created will be public** by default (this is Facebook's behavior)
- **Cover images** will be properly set as event covers, not just attached media

This will give you the full Facebook Events functionality you're looking for! 🎉
