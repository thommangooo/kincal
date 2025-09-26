-- Social Media Integration for Kin Calendar
-- This script adds support for Facebook and Instagram posting

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create social media accounts table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('club', 'zone', 'district')),
  entity_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  account_id VARCHAR(255) NOT NULL, -- Platform-specific account ID
  account_name VARCHAR(255) NOT NULL, -- Display name
  page_id VARCHAR(255), -- Facebook page ID for posting
  access_token_encrypted TEXT, -- Encrypted OAuth access token
  refresh_token_encrypted TEXT, -- Encrypted refresh token
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  created_by_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social media posts tracking table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL, -- References events.id or announcements.id
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('event', 'announcement')),
  social_account_id UUID NOT NULL REFERENCES social_media_accounts(id) ON DELETE CASCADE,
  platform_post_id VARCHAR(255), -- ID from the social platform
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'cancelled')),
  error_message TEXT,
  custom_message TEXT, -- Custom message for the social post
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_accounts_entity ON social_media_accounts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_media_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_active ON social_media_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_social_accounts_created_by ON social_media_accounts(created_by_email);

CREATE INDEX IF NOT EXISTS idx_social_posts_content ON social_media_posts(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_social_posts_account ON social_media_posts(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform_id ON social_media_posts(platform_post_id);

-- Enable RLS
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_media_accounts
CREATE POLICY "Users can view accounts for their entities" ON social_media_accounts
  FOR SELECT USING (
    created_by_email = auth.email() OR
    EXISTS (
      SELECT 1 FROM user_entity_permissions uep
      WHERE uep.user_email = auth.email()
      AND uep.entity_type = social_media_accounts.entity_type
      AND uep.entity_id = social_media_accounts.entity_id
    )
  );

CREATE POLICY "Users can manage accounts for their entities" ON social_media_accounts
  FOR ALL USING (
    created_by_email = auth.email() OR
    EXISTS (
      SELECT 1 FROM user_entity_permissions uep
      WHERE uep.user_email = auth.email()
      AND uep.entity_type = social_media_accounts.entity_type
      AND uep.entity_id = social_media_accounts.entity_id
    )
  );

-- RLS Policies for social_media_posts
CREATE POLICY "Users can view posts for their content" ON social_media_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = social_media_posts.content_id
      AND social_media_posts.content_type = 'event'
      AND e.created_by_email = auth.email()
    ) OR
    EXISTS (
      SELECT 1 FROM announcements a
      WHERE a.id = social_media_posts.content_id
      AND social_media_posts.content_type = 'announcement'
      AND a.created_by_email = auth.email()
    )
  );

CREATE POLICY "Users can manage posts for their content" ON social_media_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = social_media_posts.content_id
      AND social_media_posts.content_type = 'event'
      AND e.created_by_email = auth.email()
    ) OR
    EXISTS (
      SELECT 1 FROM announcements a
      WHERE a.id = social_media_posts.content_id
      AND social_media_posts.content_type = 'announcement'
      AND a.created_by_email = auth.email()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_accounts_updated_at 
  BEFORE UPDATE ON social_media_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at 
  BEFORE UPDATE ON social_media_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
