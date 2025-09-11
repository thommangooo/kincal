/**
 * Helper functions for consistent null/undefined handling
 * Based on advice from the build error analysis
 */

/**
 * Convert undefined to null (for database operations)
 */
export const toNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v)

/**
 * Convert null to undefined (for form inputs that expect undefined)
 */
export const toUndef = <T>(v: T | null): T | undefined => (v === null ? undefined : v)

/**
 * Convert form values to null (handles empty strings and undefined)
 */
export const fromForm = <T>(v: T | undefined | ''): T | null =>
  v === undefined || v === '' ? null : (v as T)

/**
 * Convert to input value (handles null/undefined to empty string)
 */
export const toInput = (v: string | null | undefined): string => v ?? ''

/**
 * Safe string conversion for display
 */
export const safeString = (v: string | null | undefined): string => v || ''

/**
 * Check if value is nullish (null or undefined)
 */
export const isNullish = (v: any): v is null | undefined => v == null
