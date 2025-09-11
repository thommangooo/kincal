# Build Failure Prevention Guide

## The Problem We Just Solved

This project had **relentless Vercel build failures** due to cascading TypeScript and configuration issues. Here's what went wrong and how to prevent it in future projects.

## Root Causes Identified

### 1. DOM Type Collision
**Problem**: Custom `Event` interface conflicted with global DOM `Event` type
**Solution**: Rename custom interfaces to avoid DOM collisions (e.g., `Event` → `DbEvent`)

### 2. Inconsistent Null/Undefined Handling
**Problem**: Database returns `null` for optional fields, but TypeScript interfaces used `undefined`
**Solution**: Standardize on `string | null` for all optional database-backed fields

### 3. Mixed Routing Systems
**Problem**: Next.js App Router (`src/app/`) mixed with Pages Router structure
**Solution**: Use only App Router structure for all pages

### 4. Type System Inconsistencies
**Problem**: Functions returning different types than expected by consumers
**Solution**: Ensure consistent type flow from database → functions → components

## Prevention Checklist

### Before Starting Development

- [ ] **Choose routing system**: App Router OR Pages Router, not both
- [ ] **Plan type naming**: Avoid DOM type collisions (`Event`, `Window`, `Document`, etc.)
- [ ] **Define null strategy**: Decide on `null` vs `undefined` for optional fields
- [ ] **Set up proper TypeScript config**: Exclude temp directories, configure paths

### During Development

- [ ] **Consistent type exports**: Re-export types consistently from database layer
- [ ] **Helper functions**: Create utilities for type conversions (`toNull`, `fromForm`)
- [ ] **Regular builds**: Test builds frequently, not just at the end
- [ ] **ESLint configuration**: Configure rules to catch unused imports/variables

### Before Deployment

- [ ] **Local build test**: `npm run build` must pass locally
- [ ] **Type checking**: `npx tsc --noEmit` should pass
- [ ] **ESLint check**: `npm run lint` should pass
- [ ] **Image configuration**: Configure `next.config.js` for external image hosts

## Key Files to Check

### TypeScript Configuration
```json
// tsconfig.json
{
  "exclude": ["temp_disabled", "**/temp_disabled/**"]
}
```

### Next.js Configuration
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-external-domain.com',
        port: '',
        pathname: '/path/**',
      },
    ],
  },
};
```

### Type Definitions
```typescript
// lib/supabase.ts - Use consistent naming
export interface DbEvent {  // Not "Event" (DOM collision)
  id: string
  title: string
  description: string | null  // Not undefined
  // ... other fields
}

// lib/database.ts - Re-export consistently
export type { DbEvent as Event, ... }
```

### Helper Functions
```typescript
// lib/nullish.ts
export const toNull = <T>(v: T | undefined): T | null => 
  v === undefined ? null : v

export const fromForm = <T>(v: T | undefined | ''): T | null =>
  v === undefined || v === '' ? null : (v as T)
```

## Warning Signs

Watch for these patterns that lead to build failures:

- ❌ **Mixed routing**: Files in both `src/app/` and `src/pages/`
- ❌ **Type collisions**: Custom types with DOM names (`Event`, `Window`, etc.)
- ❌ **Inconsistent nulls**: Mixing `null` and `undefined` for optional fields
- ❌ **Unused imports**: ESLint warnings about unused variables
- ❌ **Type assertions**: Using `as any` or incorrect type assertions
- ❌ **Missing properties**: Objects missing required interface properties

## Emergency Debugging

When builds fail repeatedly:

1. **Isolate the problem**: Create minimal "hello world" to test build system
2. **Check type flow**: Database → functions → components should be consistent
3. **Review external advice**: Look for systematic issues, not just individual errors
4. **Fix systematically**: Address root causes, not just symptoms
5. **Test incrementally**: Fix one issue at a time, test builds frequently

## The Golden Rules

1. **Consistency over convenience**: Pick one approach and stick to it
2. **Type safety first**: Fix type errors before moving on
3. **Build early, build often**: Don't wait until the end to test builds
4. **Document decisions**: Record why you chose `null` over `undefined`, etc.
5. **External validation**: Get advice when stuck in error loops

## What We Learned

- **Systematic approach works**: Fixing root causes is better than whack-a-mole
- **Type consistency matters**: One type mismatch can cascade into many errors
- **Build system is fragile**: Small configuration issues can break everything
- **External perspective helps**: Fresh eyes catch systematic problems
- **Patience required**: Complex type issues take time to resolve properly

---

*Generated after resolving 15+ build failures in a Next.js + Supabase project*
