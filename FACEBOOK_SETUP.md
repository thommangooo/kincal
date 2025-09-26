# Facebook Integration Setup Guide

This guide will help you set up Facebook integration for the Kin Calendar social media posting feature.

## Prerequisites

- A Facebook Developer account
- Access to your Supabase project
- Your Kin Calendar application deployed or running locally

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" and select "Business" as the app type
3. Fill in the required information:
   - **App Name**: Kin Calendar Social Media
   - **App Contact Email**: Your email address
   - **Business Account**: Select your business account (or create one)

## Step 2: Configure Facebook App Settings

### Basic Settings
1. In your Facebook App dashboard, go to "Settings" > "Basic"
2. Add your app domains:
   - **App Domains**: `your-domain.com` (your production domain)
   - **Privacy Policy URL**: `https://your-domain.com/privacy`
   - **Terms of Service URL**: `https://your-domain.com/terms`

### Products Configuration
1. Go to "Products" in the left sidebar
2. Add the following products (these are the current available options):
   - **Instagram**: For Instagram posting and content management
   - **Facebook Login for Business**: For user authentication and permissions
   - **Webhooks**: For receiving real-time updates (optional for posting)

## Step 3: Configure OAuth Settings

1. Go to "Facebook Login for Business" > "Settings"
2. Add valid OAuth redirect URIs:
   - **Development**: `http://localhost:3000/auth/facebook/callback`
   - **Production**: `https://your-domain.com/auth/facebook/callback`

## Step 4: Configure App Permissions

### Required Permissions
Your app will request these permissions from users:
- `pages_manage_posts` - Post to Facebook pages
- `pages_read_engagement` - Read page insights
- `instagram_basic` - Post to Instagram business accounts
- `pages_show_list` - List user's Facebook pages

### App Review Process
Facebook now uses a "Standard Access" vs "Advanced Access" model:

1. **Standard Access** (Available immediately):
   - You can test these permissions with your own Facebook accounts
   - Perfect for development and testing
   - No review process needed

2. **Advanced Access** (Requires review):
   - Only needed if you want to access other users' data beyond your own accounts
   - Requires successful API test calls first
   - Then submit for review if you need broader access

**For Kin Calendar**: Standard Access is sufficient since users will be connecting their own Facebook accounts and posting to their own pages.

## Step 5: Get App Credentials

1. In your Facebook App dashboard, go to "Settings" > "Basic"
2. Copy the following values:
   - **App ID**: Your Facebook App ID
   - **App Secret**: Your Facebook App Secret (click "Show" to reveal)

## Step 6: Configure Environment Variables

1. Copy your environment template:
   ```bash
   cp env.template .env.local
   ```

2. Add your Facebook credentials to `.env.local`:
   ```env
   # Facebook App Configuration
   FACEBOOK_APP_ID=your_facebook_app_id_here
   FACEBOOK_APP_SECRET=your_facebook_app_secret_here
   FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
   
   # Encryption Key (generate a strong random string)
   ENCRYPTION_KEY=your_strong_encryption_key_here
   ```

### Generating an Encryption Key

You need to generate a strong encryption key yourself. Here are a few ways to do it:

**Option 1: Use Node.js (recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Use OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Use an online generator**
- Go to a secure password generator
- Generate a 64-character random string
- Copy and paste it as your encryption key

**Option 4: Use your existing NEXTAUTH_SECRET**
If you already have a `NEXTAUTH_SECRET` in your environment, you can use the same value for `ENCRYPTION_KEY`.

**Important**: 
- Keep this key secure and never commit it to version control
- Use the same key across all environments (dev, staging, production)
- If you lose this key, all encrypted tokens will be unrecoverable

## Step 7: Database Setup

Run the social media integration SQL script in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `supabase-social-media-integration.sql`
4. Click "Run" to execute the script

## Step 8: Test the Integration

### Development Testing
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the user management page
3. Try connecting a Facebook account
4. Create a test event and attempt to post to Facebook

### Production Deployment
1. Update your environment variables in your deployment platform
2. Ensure your production domain is added to Facebook App settings
3. Update the redirect URI to use your production domain

## Troubleshooting

### Common Issues

**"Invalid OAuth redirect URI"**
- Ensure your redirect URI exactly matches what's configured in Facebook App settings
- Check that you're using the correct domain (localhost for dev, production domain for prod)

**"App not approved for permissions"**
- For development, you can test with your own Facebook accounts
- For production, you need to submit your app for Facebook's review process

**"Token expired" errors**
- The system automatically handles token refresh
- If tokens continue to expire, check your Facebook App configuration

**"Page not found" errors**
- Ensure the user has admin access to the Facebook page
- Verify the page ID is correct in the database

### Debug Mode
To enable debug logging, add this to your environment:
```env
DEBUG_SOCIAL_MEDIA=true
```

## Security Considerations

1. **Token Encryption**: All access tokens are encrypted before storage
2. **HTTPS Required**: Facebook requires HTTPS for production apps
3. **Domain Validation**: Only configured domains can use your Facebook app
4. **Permission Scope**: Only request the minimum permissions needed

## Support

If you encounter issues:
1. Check the Facebook Developer Console for error logs
2. Verify your environment variables are correct
3. Ensure your database schema is properly set up
4. Check that your Facebook app is in the correct mode (Development vs Live)

## Next Steps

Once Facebook integration is working:
1. Test with multiple Facebook pages
2. Verify posting works for both events and announcements
3. Set up monitoring for failed posts
4. Consider adding Instagram integration
5. Implement analytics and reporting features
