#!/bin/bash

# Supabase Project Backup Script
# This script creates comprehensive backups of your Supabase projects

set -e

# Configuration
BACKUP_DIR="./supabase-backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECTS=(
    "kin-calendar"  # Add your other project names here
    # "project-2"
    # "project-3"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Supabase Project Backup${NC}"
echo "=================================="

# Create backup directory
mkdir -p "$BACKUP_DIR"

for project in "${PROJECTS[@]}"; do
    echo -e "\n${YELLOW}📦 Backing up project: $project${NC}"
    
    # Create project-specific backup directory
    PROJECT_BACKUP_DIR="$BACKUP_DIR/$project-$DATE"
    mkdir -p "$PROJECT_BACKUP_DIR"
    
    echo "📋 Step 1: Exporting database schema..."
    # Export schema (structure only)
    pg_dump --schema-only --no-owner --no-privileges \
        -h db.$(echo $project | tr '-' '.').supabase.co \
        -p 5432 \
        -d postgres \
        -U postgres \
        > "$PROJECT_BACKUP_DIR/schema.sql" 2>/dev/null || {
        echo -e "${RED}❌ Schema export failed. Make sure you have the correct connection details.${NC}"
        continue
    }
    
    echo "📊 Step 2: Exporting database data..."
    # Export data only
    pg_dump --data-only --no-owner --no-privileges \
        -h db.$(echo $project | tr '-' '.').supabase.co \
        -p 5432 \
        -d postgres \
        -U postgres \
        > "$PROJECT_BACKUP_DIR/data.sql" 2>/dev/null || {
        echo -e "${RED}❌ Data export failed. Make sure you have the correct connection details.${NC}"
        continue
    }
    
    echo "🗂️ Step 3: Creating complete backup..."
    # Create complete backup (schema + data)
    pg_dump --no-owner --no-privileges \
        -h db.$(echo $project | tr '-' '.').supabase.co \
        -p 5432 \
        -d postgres \
        -U postgres \
        > "$PROJECT_BACKUP_DIR/complete_backup.sql" 2>/dev/null || {
        echo -e "${RED}❌ Complete backup failed. Make sure you have the correct connection details.${NC}"
        continue
    }
    
    echo "📝 Step 4: Documenting project details..."
    # Create project metadata file
    cat > "$PROJECT_BACKUP_DIR/project-info.txt" << EOF
Project: $project
Backup Date: $(date)
Backup Type: Full Database Backup

Files included:
- schema.sql: Database structure only
- data.sql: Data only
- complete_backup.sql: Full backup (schema + data)
- project-info.txt: This file

To restore this backup:
1. Create a new Supabase project
2. Run: psql -h <new-host> -U postgres -d postgres -f complete_backup.sql

Note: You may need to adjust connection details and recreate RLS policies.
EOF
    
    echo "📁 Step 5: Creating archive..."
    # Create compressed archive
    cd "$BACKUP_DIR"
    tar -czf "${project}-${DATE}.tar.gz" "$project-$DATE"
    rm -rf "$project-$DATE"
    cd ..
    
    echo -e "${GREEN}✅ Backup completed for $project${NC}"
    echo "   Archive: $BACKUP_DIR/${project}-${DATE}.tar.gz"
done

echo -e "\n${GREEN}🎉 All backups completed!${NC}"
echo "=================================="
echo "Backup location: $BACKUP_DIR"
echo -e "${YELLOW}⚠️  Important: Test restore these backups before deleting any projects!${NC}"

# Create restoration guide
cat > "$BACKUP_DIR/RESTORATION_GUIDE.md" << 'EOF'
# Supabase Project Restoration Guide

## Quick Restoration to New Supabase Project

1. **Create new Supabase project**
2. **Extract backup:**
   ```bash
   tar -xzf project-name-YYYYMMDD_HHMMSS.tar.gz
   ```
3. **Restore database:**
   ```bash
   psql -h db.your-project.supabase.co -U postgres -d postgres -f complete_backup.sql
   ```
4. **Recreate RLS policies** (if needed)
5. **Update environment variables**

## Alternative Platforms

### Turso (SQLite)
- Requires schema conversion (PostgreSQL → SQLite)
- Use tools like `pgloader` or manual conversion
- May lose some PostgreSQL-specific features

### Neon (PostgreSQL)
- Direct compatibility with PostgreSQL backups
- Minimal changes required
- Good Supabase alternative

### Railway (PostgreSQL)
- Direct compatibility with PostgreSQL backups
- Similar to Neon in terms of compatibility

### PlanetScale (MySQL)
- Requires significant schema conversion
- Not recommended for complex PostgreSQL features

## Testing Restoration

Before deleting original projects:
1. Create test projects on target platform
2. Restore backups
3. Verify functionality
4. Test all features
5. Document any issues or required changes

## Cost Comparison

- Supabase Pro: $25/month per project
- Neon: $0-19/month (free tier available)
- Railway: $5/month minimum
- Turso: Free tier available
- PlanetScale: Free tier available
EOF

echo -e "\n📖 Restoration guide created: $BACKUP_DIR/RESTORATION_GUIDE.md"
