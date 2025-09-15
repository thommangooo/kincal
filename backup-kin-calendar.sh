#!/bin/bash

# Kin Calendar Supabase Backup Script
# Simplified backup for the Kin Calendar project specifically

set -e

# Configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
SUPABASE_URL=""  # Your Supabase project URL (e.g., https://xyz.supabase.co)
SUPABASE_DB_PASSWORD=""  # Your database password
PROJECT_REF=""  # Your project reference (from Supabase URL)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Kin Calendar Supabase Backup${NC}"
echo "================================="

# Check if configuration is provided
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Configuration missing!${NC}"
    echo "Please edit this script and provide:"
    echo "1. SUPABASE_URL (e.g., https://xyz.supabase.co)"
    echo "2. SUPABASE_DB_PASSWORD (your database password)"
    echo "3. PROJECT_REF (your project reference)"
    echo ""
    echo "You can find these in your Supabase dashboard:"
    echo "- URL: Settings > API > Project URL"
    echo "- Password: Settings > Database > Database password"
    echo "- Project Ref: From the URL (xyz in https://xyz.supabase.co)"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./kin-calendar-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Creating backup in: $BACKUP_DIR${NC}"

# Set PGPASSWORD for pg_dump
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

# Database connection details
DB_HOST="db.$PROJECT_REF.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "📋 Step 1: Exporting complete database backup..."
pg_dump --no-owner --no-privileges --clean --if-exists \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    > "$BACKUP_DIR/kin-calendar-complete.sql"

echo "📊 Step 2: Exporting schema only..."
pg_dump --schema-only --no-owner --no-privileges \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    > "$BACKUP_DIR/kin-calendar-schema.sql"

echo "🗂️ Step 3: Exporting data only..."
pg_dump --data-only --no-owner --no-privileges \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    > "$BACKUP_DIR/kin-calendar-data.sql"

echo "📝 Step 4: Creating project documentation..."
cat > "$BACKUP_DIR/README.md" << EOF
# Kin Calendar Supabase Backup

**Backup Date:** $(date)
**Project:** Kin Calendar
**Original Supabase URL:** $SUPABASE_URL

## Files Included

- \`kin-calendar-complete.sql\` - Full backup (schema + data + clean commands)
- \`kin-calendar-schema.sql\` - Database structure only
- \`kin-calendar-data.sql\` - Data only
- \`README.md\` - This documentation

## Current Database Structure

Based on the codebase analysis, this project includes:

### Tables
- \`districts\` - Kin Canada districts
- \`zones\` - Zones within districts
- \`clubs\` - Kin clubs within zones
- \`events\` - Event information
- \`announcements\` - Announcement content
- \`approved_users\` - User whitelist/approval system
- \`user_entity_permissions\` - Role-based permissions
- \`magic_link_tokens\` - Authentication tokens

### Features
- Row Level Security (RLS) policies
- File storage bucket for images
- Complex permission system
- Magic link authentication

## Restoration Options

### 1. Restore to New Supabase Project
\`\`\`bash
# Create new Supabase project, then:
psql -h db.new-project.supabase.co -U postgres -d postgres -f kin-calendar-complete.sql
\`\`\`

### 2. Restore to Alternative Platform

#### Neon (PostgreSQL - Recommended)
- Direct compatibility with PostgreSQL backups
- Free tier available
- Minimal migration required

#### Turso (SQLite)
- Requires schema conversion
- May lose PostgreSQL-specific features
- More complex migration

#### Railway (PostgreSQL)
- Good compatibility
- Similar to Neon

### 3. Migration Considerations

**Authentication System:**
- Current: Custom magic link with whitelist
- Clerk: Standard auth (would need custom approval layer)
- Supabase: Direct compatibility

**Database Features:**
- Current: PostgreSQL with RLS, JSON columns, arrays
- SQLite alternatives: Limited feature set
- PostgreSQL alternatives: Full compatibility

**File Storage:**
- Current: Supabase Storage
- Alternatives: AWS S3, Cloudinary, etc.

## Cost Analysis

**Current Supabase Pro:** \$25/month per project

**Alternatives:**
- Neon: Free tier + \$0-19/month
- Railway: \$5/month minimum
- Turso: Free tier available
- PlanetScale: Free tier available

## Testing Before Migration

1. Create test project on target platform
2. Restore this backup
3. Test all functionality
4. Verify authentication system
5. Check file storage
6. Validate permissions system

## Next Steps

1. ✅ Backup created
2. 🔄 Test restoration on target platform
3. 📊 Compare costs and features
4. 🚀 Plan migration strategy
5. 🗑️ Delete original project (only after successful testing)
EOF

echo "📁 Step 5: Creating compressed archive..."
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo -e "\n${GREEN}✅ Backup completed successfully!${NC}"
echo "================================="
echo "📦 Archive: ${BACKUP_DIR}.tar.gz"
echo "📖 Documentation included in the archive"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Test restore this backup before deleting your Supabase project!${NC}"
echo ""
echo "Next steps:"
echo "1. Extract and review the backup"
echo "2. Test restore on a new Supabase project"
echo "3. Consider alternative platforms (Neon, Railway, Turso)"
echo "4. Only delete original project after successful testing"
