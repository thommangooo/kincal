# Build Errors Log - Kincal Project

## Error Summary
Multiple TypeScript compilation failures during Vercel deployment builds. All errors are related to type mismatches between `null` and `undefined` values.

## Error Pattern
The core issue appears to be that:
- Database/Supabase returns `null` for optional fields
- TypeScript interfaces expect `undefined` for optional fields
- This creates type mismatches throughout the application

## Build Error #1 - EventForm.tsx
**File:** `./src/components/EventForm.tsx:195:23`
**Error:** `Type 'string | null' is not assignable to type 'string | undefined'. Type 'null' is not assignable to type 'string | undefined'.`
**Code:**
```typescript
event_url: data.event_url || undefined,
```
**Fix Applied:** Changed to `event_url: data.event_url || null,`

## Build Error #2 - EventForm.tsx (Image URL)
**File:** `./src/components/EventForm.tsx:196:23`
**Error:** `Type 'string | null' is not assignable to type 'string | undefined'. Type 'null' is not assignable to type 'string | undefined'.`
**Code:**
```typescript
image_url: imageUrl || undefined,
```
**Fix Applied:** Changed to `image_url: imageUrl || null,`

## Build Error #3 - AnnouncementForm.tsx
**File:** `./src/components/AnnouncementForm.tsx:195:23`
**Error:** `Type 'string | null' is not assignable to type 'string | undefined'. Type 'null' is not assignable to type 'string | undefined'.`
**Code:**
```typescript
image_url: imageUrl || undefined,
```
**Fix Applied:** Changed to `image_url: imageUrl || null,`

## Build Error #4 - AnnouncementForm.tsx (Expiry Date)
**File:** `./src/components/AnnouncementForm.tsx:196:23`
**Error:** `Type 'string | null' is not assignable to type 'string | undefined'. Type 'null' is not assignable to type 'string | undefined'.`
**Code:**
```typescript
expiry_date: data.expiry_date || undefined,
```
**Fix Applied:** Changed to `expiry_date: data.expiry_date || null,`

## Build Error #5 - Announcements Create Page
**File:** `./src/app/announcements/create/page.tsx:195:23`
**Error:** `Type 'string | null' is not assignable to type 'string | undefined'. Type 'null' is not assignable to type 'string | undefined'.`
**Code:**
```typescript
value={imageUrl}
```
**Fix Applied:** Changed to `value={imageUrl || undefined}`

## Build Error #6 - EventForm.tsx (ImageUpload Props)
**File:** `./src/components/EventForm.tsx:420-422`
**Error:** Using non-existent props on ImageUpload component
**Code:**
```typescript
<ImageUpload
  currentImageUrl={imageUrl}
  onImageUpload={setImageUrl}
  onImageRemove={() => setImageUrl(null)}
/>
```
**Fix Applied:** Changed to:
```typescript
<ImageUpload
  value={imageUrl || undefined}
  onChange={setImageUrl}
/>
```

## Build Error #7 - CalendarView.tsx
**File:** `./src/components/CalendarView.tsx:446:28`
**Error:** `Property 'start_time' does not exist on type 'Event'. Did you mean 'start_date'?`
**Code:**
```typescript
{event.start_time && (
  <p className="text-xs opacity-75 mt-1">
    {formatTime(event.start_time)}
    {event.end_time && ` - ${formatTime(event.end_time)}`}
  </p>
)}
```
**Status:** UNRESOLVED - This is the current blocking error

## Type Definitions Analysis

### Event Interface (from supabase.ts)
```typescript
export interface Event {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  start_time?: string  // ← This should exist
  end_time?: string    // ← This should exist
  location?: string
  club_id: string | null
  zone_id: string | null
  district_id: string | null
  entity_type: 'club' | 'zone' | 'district'
  entity_id: string
  visibility: 'public' | 'private'
  tags?: string[]
  event_url?: string
  image_url?: string
  created_by_email: string
  created_at: string
  updated_at: string
  club?: Club
  zone?: Zone
  district?: District
}
```

### Database Schema (from supabase-events-table.sql)
```sql
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TIME, -- Optional specific start time
  end_time TIME,   -- Optional specific end time
  location VARCHAR(500),
  -- ... other fields
);
```

## Root Cause Analysis

1. **Type Mismatch Pattern**: The application consistently has issues with `null` vs `undefined` types
2. **Interface Inconsistency**: The Event interface shows `start_time?: string` but TypeScript compiler says it doesn't exist
3. **Import Issues**: Possible mismatch between imported Event types from different files

## Files Modified During Debugging
- `src/components/EventForm.tsx`
- `src/components/AnnouncementForm.tsx` 
- `src/app/announcements/create/page.tsx`

## Current Status
- **Build Status**: FAILING
- **Last Error**: CalendarView.tsx - Property 'start_time' does not exist on type 'Event'
- **Confidence Level**: 0% (clearly terrible at estimating success)

## Next Steps Needed
1. Investigate why TypeScript thinks `start_time` doesn't exist on Event type
2. Check for type import conflicts or multiple Event type definitions
3. Consider updating all interfaces to consistently use `null` instead of `undefined`
4. Verify database schema matches TypeScript interfaces

## Build Environment
- **Platform**: Vercel
- **Node Version**: Not specified
- **Next.js Version**: 15.5.2
- **TypeScript**: Enabled with strict type checking
- **Build Command**: `npm run build`

---

## Additional Build Errors from 20+ Failed Attempts

### Build Error #8 - Latest Attempt (Commit: f72a1d3)
**Timestamp:** [22:48:51.798]
**Error:** `./src/components/EventForm.tsx:115:23`
**Type error:** `Argument of type 'string | undefined' is not assignable to parameter of type 'SetStateAction<string | null>'. Type 'undefined' is not assignable to type 'SetStateAction<string | null>'.`
**Code:**
```typescript
setImageUrl(eventData.image_url)
```
**Context:** EventForm.tsx line 115 where `eventData.image_url` is `string | undefined` but `setImageUrl` expects `string | null`

### Build Error #9 - Previous Attempt (Commit: 19d134b)
**Timestamp:** [22:44:27.985]
**Error:** `./src/components/EntitySelector.tsx:71:25`
**Type error:** `Property 'zone' does not exist on type 'Club'.`
**Code:**
```typescript
return `${club?.zone?.name || 'Unknown Zone'} • ${club?.district?.name || 'Unknown District'}`
```
**Context:** Club interface missing optional `zone` and `district` properties

### Build Error #10 - Earlier Attempt (Commit: bc3ff59)
**Timestamp:** [22:36:47.703]
**Error:** `./src/components/CalendarView.tsx:446:28`
**Type error:** `Property 'start_time' does not exist on type 'Event'. Did you mean 'start_date'?`
**Code:**
```typescript
{event.start_time && (
  <p className="text-xs opacity-75 mt-1">
    {formatTime(event.start_time)}
    {event.end_time && ` - ${formatTime(event.end_time)}`}
  </p>
)}
```

### Build Error #11 - Even Earlier (Commit: 50d902e)
**Timestamp:** [22:34:00.051]
**Error:** `./src/app/announcements/create/page.tsx:195:23`
**Type error:** `Type 'string | null' is not assignable to type 'string | undefined'. Type 'null' is not assignable to type 'string | undefined'.`
**Code:**
```typescript
value={imageUrl}
```
**Context:** ImageUpload component expecting `string | undefined` but receiving `string | null`

### Build Error #12 - Another Attempt (Commit: 1c27b89)
**Timestamp:** [22:30:59.118]
**Error:** `./src/app/announcements/create/page.tsx:128:32`
**Type error:** `Argument of type '{ title: string; content: string; publish_date: string; expiry_date: string | null; club_id: string | null; zone_id: string | null; district_id: string | null; entity_type: "club" | "zone" | "district"; ... 5 more ...; created_by_email: string; }' is not assignable to parameter of type 'Omit<Announcement, "id" | "created_at" | "updated_at">'.`
**Context:** `expiry_date` type mismatch - `string | null` vs `string | undefined`

### Build Error #13 - Yet Another (Commit: cc74bca)
**Timestamp:** [22:28:29.171]
**Error:** `./src/app/announcements/create/page.tsx:128:32`
**Type error:** `Types of property 'image_url' are incompatible. Type 'string | null' is not assignable to type 'string | undefined'. Type 'null' is not assignable to type 'string | undefined'.`
**Context:** `image_url` type mismatch in announcement data

### Build Error #14 - Hello World Failure (Commit: efbca85)
**Timestamp:** [23:06:40.788]
**Error:** `./temp_disabled/admin/users/[userId]/permissions/page.tsx:5:26`
**Type error:** `Cannot find module '@/lib/supabase' or its corresponding type declarations.`
**Code:**
```typescript
import { supabase } from '@/lib/supabase'
```
**Context:** Next.js was still scanning `temp_disabled/` directory for TypeScript files even though they were moved out of `src/`

## Pattern Analysis

### Consistent Error Types:
1. **Null vs Undefined Mismatches** (Most Common)
   - Database returns `null`, interfaces expect `undefined`
   - React state uses `null`, form libraries expect `undefined`
   - ImageUpload component type inconsistencies

2. **Missing Interface Properties**
   - Event interface missing `start_time`/`end_time` properties
   - Club interface missing `zone`/`district` optional properties

3. **Import/Module Resolution Issues**
   - TypeScript scanning directories outside of `src/`
   - Module resolution failures

### Failed Fix Attempts:
1. **Type System Standardization** - Attempted to make all optional strings use `string | null` consistently
2. **Interface Updates** - Added missing properties to Event, Club, Zone interfaces
3. **Component Prop Fixes** - Updated ImageUpload and other components to handle both null/undefined
4. **Hello World Approach** - Tried minimal app but Next.js still scanned moved files

### Total Build Attempts: 20+
### Successful Builds: 0
### Confidence Level: -100% (clearly terrible at this)
