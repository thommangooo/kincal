// File: src/lib/dateUtils.ts
// This file contains utilities to handle timezone-aware date operations consistently

/**
 * Creates a date in local timezone without timezone conversion
 * Useful for date inputs that should represent local calendar dates
 */
export function createLocalDate(dateString: string, timeString?: string): Date {
  const time = timeString || '00:00:00'
  // Use the Date constructor with individual components to avoid timezone conversion
  const [year, month, day] = dateString.split('-').map(Number)
  const [hours, minutes, seconds = 0] = time.split(':').map(Number)
  
  return new Date(year, month - 1, day, hours, minutes, seconds)
}

/**
 * Formats a date to YYYY-MM-DD format without timezone conversion
 * Ensures the date displayed is the same date that was selected
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Formats time to HH:MM format without timezone conversion
 */
export function formatTimeForInput(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${hours}:${minutes}`
}

/**
 * Formats time from datetime string without timezone conversion
 * Returns empty string for date-only events
 */
export function formatTimeFromDateTime(dateTimeString: string): string {
  // Handle date-only format: "2024-10-18" (all-day events)
  if (!dateTimeString.includes(' ') && !dateTimeString.includes('T')) {
    return ''
  }
  
  // Handle local datetime format: "2024-10-18 14:12:00"
  if (dateTimeString.includes(' ')) {
    const timePart = dateTimeString.split(' ')[1]
    const [hours, minutes] = timePart.split(':')
    const hour12 = parseInt(hours) % 12 || 12
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM'
    return `${hour12}:${minutes.padStart(2, '0')} ${ampm}`
  }
  
  // Handle ISO format: "2024-10-18T14:12:00.000Z"
  const date = new Date(dateTimeString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Creates a local datetime string from local date and time inputs
 * Stores in YYYY-MM-DD HH:MM:SS format to avoid timezone conversion
 * If no time is provided, stores as YYYY-MM-DD for all-day events
 */
export function createLocalDateTime(dateString: string, timeString?: string): string {
  if (!timeString) {
    // All-day event - store as date only
    return dateString
  }
  
  const [year, month, day] = dateString.split('-').map(Number)
  const [hours, minutes, seconds = 0] = timeString.split(':').map(Number)
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Extracts date from local datetime string for form display
 * Handles both local datetime format and ISO format
 */
export function extractLocalDateFromDateTime(dateTimeString: string): string {
  // Handle local datetime format: "2024-10-18 14:12:00"
  if (dateTimeString.includes(' ')) {
    return dateTimeString.split(' ')[0]
  }
  
  // Handle ISO format: "2024-10-18T14:12:00.000Z"
  const date = new Date(dateTimeString)
  return formatDateForInput(date)
}

/**
 * Extracts time from local datetime string for form display
 * Handles both local datetime format and ISO format
 * Returns empty string for date-only (all-day) events
 */
export function extractLocalTimeFromDateTime(dateTimeString: string): string {
  // Handle date-only format: "2024-10-18" (all-day events)
  if (!dateTimeString.includes(' ') && !dateTimeString.includes('T')) {
    return ''
  }
  
  // Handle local datetime format: "2024-10-18 14:12:00"
  if (dateTimeString.includes(' ')) {
    return dateTimeString.split(' ')[1].slice(0, 5)
  }
  
  // Handle ISO format: "2024-10-18T14:12:00.000Z"
  const date = new Date(dateTimeString)
  return formatTimeForInput(date)
}

/**
 * Creates a date object from datetime string preserving time information
 * Used for time display purposes
 */
export function createDateWithTime(dateTimeString: string): Date {
  // Handle local datetime format: "2024-10-18 14:12:00"
  if (dateTimeString.includes(' ')) {
    const [datePart, timePart] = dateTimeString.split(' ')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes, seconds = 0] = timePart.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes, seconds)
  }
  
  // Handle ISO format: "2024-10-18T14:12:00.000Z"
  return new Date(dateTimeString)
}

/**
 * Compares two dates by their date components only (ignoring time)
 * Useful for calendar day comparisons
 */
export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

/**
 * Gets the date-only portion of a date for calendar comparisons
 * Returns a new Date with time set to midnight
 * Handles both local datetime format and ISO format
 */
export function getDateOnly(date: Date | string): Date {
  if (typeof date === 'string') {
    // Handle local datetime format: "2024-10-18 14:12:00"
    if (date.includes(' ')) {
      const [datePart] = date.split(' ')
      const [year, month, day] = datePart.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    
    // Handle ISO format: "2024-10-18T14:12:00.000Z"
    const d = new Date(date)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Checks if a date falls within a date range (inclusive)
 * Uses date-only comparison to avoid time-related issues
 */
export function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
  const checkDate = getDateOnly(date)
  const rangeStart = getDateOnly(startDate)
  const rangeEnd = getDateOnly(endDate)
  
  return checkDate >= rangeStart && checkDate <= rangeEnd
}
