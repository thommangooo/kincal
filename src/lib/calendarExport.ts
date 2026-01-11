import { Event } from './database'

/**
 * Maps Canadian provinces/territories to IANA timezone identifiers
 * Returns null if province is unknown or spans multiple timezones
 */
export function getTimezoneFromProvince(province: string | null | undefined): string | null {
  if (!province) return null
  
  const provinceUpper = province.toUpperCase()
  
  // Most provinces have a single primary timezone
  const provinceTimezoneMap: Record<string, string> = {
    'ONTARIO': 'America/Toronto',
    'QUEBEC': 'America/Toronto',
    'NEW BRUNSWICK': 'America/Moncton',
    'NOVA SCOTIA': 'America/Halifax',
    'PRINCE EDWARD ISLAND': 'America/Halifax',
    'NEWFOUNDLAND AND LABRADOR': 'America/St_Johns',
    'YUKON': 'America/Whitehorse',
    'NORTHWEST TERRITORIES': 'America/Yellowknife',
    'NUNAVUT': 'America/Iqaluit', // Most of Nunavut uses Eastern, but it spans multiple zones
    'BRITISH COLUMBIA': 'America/Vancouver',
    'ALBERTA': 'America/Edmonton',
    'SASKATCHEWAN': 'America/Regina', // Most of SK doesn't observe DST, but Regina does
    'MANITOBA': 'America/Winnipeg'
  }
  
  return provinceTimezoneMap[provinceUpper] || null
}

// Generate Google Calendar URL
export function generateGoogleCalendarUrl(event: Event): string {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || '',
    location: event.location || '',
    trp: 'false'
  })
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Generate Outlook Calendar URL
export function generateOutlookCalendarUrl(event: Event): string {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  // Format dates for Outlook (YYYY-MM-DDTHH:MM:SS)
  const formatDate = (date: Date) => {
    return date.toISOString().split('.')[0]
  }
  
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: start,
    enddt: end,
    body: event.description || '',
    location: event.location || ''
  })
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

// Generate Yahoo Calendar URL
export function generateYahooCalendarUrl(event: Event): string {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  // Format dates for Yahoo Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  
  const params = new URLSearchParams({
    v: '60',
    view: 'd',
    type: '20',
    title: event.title,
    st: start,
    et: end,
    desc: event.description || '',
    in_loc: event.location || ''
  })
  
  return `https://calendar.yahoo.com/?${params.toString()}`
}

// Generate ICS file content
export function generateICSContent(event: Event): string {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  const now = formatDate(new Date())
  
  // Generate unique ID for the event
  const uid = `${event.id}@kincal.com`
  
  // Escape special characters for ICS format
  const escapeICS = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
  }
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kin Calendar//Event Export//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICS(event.description)}` : '',
    event.location ? `LOCATION:${escapeICS(event.location)}` : '',
    event.club ? `ORGANIZER:CN=${escapeICS(event.club.name)}` : '',
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n')
  
  return icsContent
}

// Download ICS file
export function downloadICSFile(event: Event): void {
  const icsContent = generateICSContent(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Copy event details to clipboard
export async function copyEventDetails(event: Event): Promise<boolean> {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
  
  // Check if it's an all-day event
  const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0 && 
                  endDate.getHours() === 23 && endDate.getMinutes() === 59
  
  let eventText = `${event.title}\n`
  eventText += `Date: ${formatDate(startDate)}`
  if (startDate.toDateString() !== endDate.toDateString()) {
    eventText += ` - ${formatDate(endDate)}`
  }
  eventText += `\n`
  
  if (!isAllDay) {
    eventText += `Time: ${formatTime(startDate)}`
    if (startDate.toDateString() === endDate.toDateString()) {
      eventText += ` - ${formatTime(endDate)}`
    }
    eventText += `\n`
  } else {
    eventText += `Time: All Day Event\n`
  }
  
  if (event.location) {
    eventText += `Location: ${event.location}\n`
  }
  
  if (event.club) {
    eventText += `Club: ${event.club.name}\n`
  }
  
  if (event.description) {
    eventText += `\nDescription:\n${event.description}\n`
  }
  
  if (event.event_url) {
    eventText += `\nMore Info: ${event.event_url}\n`
  }
  
  try {
    await navigator.clipboard.writeText(eventText)
    return true
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}

// Generate ICS content for multiple events (calendar feed)
// timezone: IANA timezone identifier (e.g., 'America/Toronto') or null for UTC
export function generateEntityICSFeed(events: Event[], entityName: string, timezone: string | null = null): string {
  // Format UTC dates for ICS DTSTAMP (YYYYMMDDTHHMMSSZ)
  const formatDateUTC = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  // Format dates in specified timezone for DTSTART/DTEND (YYYYMMDDTHHMMSS, no Z)
  // When using TZID, the time must be in that timezone without the Z suffix
  // If timezone is null, format as UTC with Z suffix
  const formatDateInTimezone = (date: Date, tz: string | null): string => {
    if (!tz) {
      // Use UTC format when no timezone specified
      const result = formatDateUTC(date)
      console.log(`[ICS] formatDateInTimezone: No timezone, using UTC format: ${result}`)
      return result
    }
    
    // Convert UTC date to the specified timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    // Format as YYYYMMDDTHHMMSS
    const parts = formatter.formatToParts(date)
    const year = parts.find(p => p.type === 'year')?.value || ''
    const month = parts.find(p => p.type === 'month')?.value || ''
    const day = parts.find(p => p.type === 'day')?.value || ''
    const hour = parts.find(p => p.type === 'hour')?.value || ''
    const minute = parts.find(p => p.type === 'minute')?.value || ''
    const second = parts.find(p => p.type === 'second')?.value || ''
    
    const result = `${year}${month}${day}T${hour}${minute}${second}`
    console.log(`[ICS] formatDateInTimezone: timezone=${tz}, input=${date.toISOString()}, output=${result}, hasZ=${result.includes('Z')}`)
    return result
  }
  
  // Generate VTIMEZONE block for a given timezone
  // Returns empty string if timezone is null (UTC)
  const generateVTIMEZONE = (tz: string | null): string => {
    if (!tz) return ''
    
    // For now, we'll generate a basic VTIMEZONE for common Canadian timezones
    // A full implementation would need proper DST rules for each timezone
    // For simplicity, we'll use America/Toronto rules for Eastern timezones
    // and provide basic support for others
    
    if (tz === 'America/Toronto') {
      return [
        'BEGIN:VTIMEZONE',
        `TZID:${tz}`,
        'BEGIN:STANDARD',
        'DTSTART:20231105T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'TZNAME:EST',
        'TZOFFSETFROM:-0400',
        'TZOFFSETTO:-0500',
        'END:STANDARD',
        'BEGIN:DAYLIGHT',
        'DTSTART:20240310T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'TZNAME:EDT',
        'TZOFFSETFROM:-0500',
        'TZOFFSETTO:-0400',
        'END:DAYLIGHT',
        'END:VTIMEZONE'
      ].join('\r\n')
    }
    
    if (tz === 'America/Moncton' || tz === 'America/Halifax') {
      return [
        'BEGIN:VTIMEZONE',
        `TZID:${tz}`,
        'BEGIN:STANDARD',
        'DTSTART:20231105T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'TZNAME:AST',
        'TZOFFSETFROM:-0300',
        'TZOFFSETTO:-0400',
        'END:STANDARD',
        'BEGIN:DAYLIGHT',
        'DTSTART:20240310T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'TZNAME:ADT',
        'TZOFFSETFROM:-0400',
        'TZOFFSETTO:-0300',
        'END:DAYLIGHT',
        'END:VTIMEZONE'
      ].join('\r\n')
    }
    
    if (tz === 'America/Vancouver') {
      return [
        'BEGIN:VTIMEZONE',
        `TZID:${tz}`,
        'BEGIN:STANDARD',
        'DTSTART:20231105T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'TZNAME:PST',
        'TZOFFSETFROM:-0700',
        'TZOFFSETTO:-0800',
        'END:STANDARD',
        'BEGIN:DAYLIGHT',
        'DTSTART:20240310T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'TZNAME:PDT',
        'TZOFFSETFROM:-0800',
        'TZOFFSETTO:-0700',
        'END:DAYLIGHT',
        'END:VTIMEZONE'
      ].join('\r\n')
    }
    
    if (tz === 'America/Edmonton' || tz === 'America/Winnipeg') {
      return [
        'BEGIN:VTIMEZONE',
        `TZID:${tz}`,
        'BEGIN:STANDARD',
        'DTSTART:20231105T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'TZNAME:CST',
        'TZOFFSETFROM:-0500',
        'TZOFFSETTO:-0600',
        'END:STANDARD',
        'BEGIN:DAYLIGHT',
        'DTSTART:20240310T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'TZNAME:CDT',
        'TZOFFSETFROM:-0600',
        'TZOFFSETTO:-0500',
        'END:DAYLIGHT',
        'END:VTIMEZONE'
      ].join('\r\n')
    }
    
    if (tz === 'America/Regina') {
      // Saskatchewan doesn't observe DST
      return [
        'BEGIN:VTIMEZONE',
        `TZID:${tz}`,
        'BEGIN:STANDARD',
        'DTSTART:20230101T000000',
        'RRULE:FREQ=YEARLY;BYMONTH=1;BYDAY=1SU',
        'TZNAME:CST',
        'TZOFFSETFROM:-0600',
        'TZOFFSETTO:-0600',
        'END:STANDARD',
        'END:VTIMEZONE'
      ].join('\r\n')
    }
    
    if (tz === 'America/St_Johns') {
      return [
        'BEGIN:VTIMEZONE',
        `TZID:${tz}`,
        'BEGIN:STANDARD',
        'DTSTART:20231105T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
        'TZNAME:NST',
        'TZOFFSETFROM:-0230',
        'TZOFFSETTO:-0330',
        'END:STANDARD',
        'BEGIN:DAYLIGHT',
        'DTSTART:20240310T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
        'TZNAME:NDT',
        'TZOFFSETFROM:-0330',
        'TZOFFSETTO:-0230',
        'END:DAYLIGHT',
        'END:VTIMEZONE'
      ].join('\r\n')
    }
    
    if (tz === 'America/Whitehorse' || tz === 'America/Yellowknife' || tz === 'America/Iqaluit') {
      // Note: These timezones have complex DST rules and some areas may not observe DST
      // Using simplified rules - may need adjustment for specific locations
      if (tz === 'America/Iqaluit') {
        // Iqaluit uses Eastern Time
        return [
          'BEGIN:VTIMEZONE',
          `TZID:${tz}`,
          'BEGIN:STANDARD',
          'DTSTART:20231105T020000',
          'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
          'TZNAME:EST',
          'TZOFFSETFROM:-0400',
          'TZOFFSETTO:-0500',
          'END:STANDARD',
          'BEGIN:DAYLIGHT',
          'DTSTART:20240310T020000',
          'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
          'TZNAME:EDT',
          'TZOFFSETFROM:-0500',
          'TZOFFSETTO:-0400',
          'END:DAYLIGHT',
          'END:VTIMEZONE'
        ].join('\r\n')
      } else {
        // Whitehorse and Yellowknife use Mountain Time (though some areas don't observe DST)
        return [
          'BEGIN:VTIMEZONE',
          `TZID:${tz}`,
          'BEGIN:STANDARD',
          'DTSTART:20231105T020000',
          'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
          'TZNAME:MST',
          'TZOFFSETFROM:-0600',
          'TZOFFSETTO:-0700',
          'END:STANDARD',
          'BEGIN:DAYLIGHT',
          'DTSTART:20240310T020000',
          'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
          'TZNAME:MDT',
          'TZOFFSETFROM:-0700',
          'TZOFFSETTO:-0600',
          'END:DAYLIGHT',
          'END:VTIMEZONE'
        ].join('\r\n')
      }
    }
    
    // For other timezones, use UTC as fallback
    return ''
  }
  
  const now = formatDateUTC(new Date())
  
  // Escape special characters for ICS format
  const escapeICS = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
  }
  
  // Determine calendar timezone for header (use provided timezone or UTC)
  const calendarTimezone = timezone || 'UTC'
  const vtimezoneBlock = generateVTIMEZONE(timezone)
  
  // Calendar header
  const calendarHeader = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kin Canada Calendar//Entity Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(entityName)}`,
    `X-WR-TIMEZONE:${calendarTimezone}`,
    `X-WR-CALDESC:${escapeICS(`Events from ${entityName}`)}`,
    ...(vtimezoneBlock ? [vtimezoneBlock] : [])
  ].join('\r\n')
  
  // Generate VEVENT for each event
  const eventEntries = events.map(event => {
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)
    const start = formatDateInTimezone(startDate, timezone)
    const end = formatDateInTimezone(endDate, timezone)
    const uid = `${event.id}@kincal.com`
    
    // Debug: Log first event's conversion for troubleshooting
    if (events.indexOf(event) === 0) {
      console.log('[ICS Feed] Event time conversion:', {
        eventTitle: event.title,
        originalUTC: event.start_date,
        convertedLocal: start,
        timezone: timezone || 'UTC',
        startDateObject: startDate.toISOString(),
        localTimeString: startDate.toLocaleString('en-US', { timeZone: timezone || 'UTC' }),
        startHasZ: start.includes('Z'),
        endHasZ: end.includes('Z')
      })
    }
    
    // Use TZID parameter if timezone is specified, otherwise use UTC format
    // CRITICAL: start and end should NOT have Z suffix when using TZID
    let dtstart = timezone ? `DTSTART;TZID=${timezone}:${start}` : `DTSTART:${start}`
    let dtend = timezone ? `DTEND;TZID=${timezone}:${end}` : `DTEND:${end}`
    
    // Final safety check - remove Z if it somehow got added when using TZID
    if (timezone) {
      // If using TZID, remove any trailing Z (shouldn't be there, but safety check)
      if (dtstart.endsWith('Z')) {
        console.error('[ICS Feed] ERROR: Z suffix detected in DTSTART with TZID! Removing it.', {
          original: dtstart,
          timezone,
          startValue: start
        })
        dtstart = dtstart.replace(/Z$/, '')
      }
      if (dtend.endsWith('Z')) {
        console.error('[ICS Feed] ERROR: Z suffix detected in DTEND with TZID! Removing it.', {
          original: dtend,
          timezone,
          endValue: end
        })
        dtend = dtend.replace(/Z$/, '')
      }
    }
    
    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      dtstart,
      dtend,
      `SUMMARY:${escapeICS(event.title)}`,
      event.description ? `DESCRIPTION:${escapeICS(event.description)}` : '',
      event.location ? `LOCATION:${escapeICS(event.location)}` : '',
      `ORGANIZER:CN=${escapeICS(entityName)}`,
      event.event_url ? `URL:${event.event_url}` : '',
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    ].filter(line => line !== '').join('\r\n')
  }).join('\r\n')
  
  // Calendar footer
  const calendarFooter = 'END:VCALENDAR'
  
  return [calendarHeader, eventEntries, calendarFooter].join('\r\n')
}

// Build absolute URLs for an entity's ICS feed (http(s) and webcal), plus Google add-by-url link
export function buildEntityIcsSubscriptionUrls(entityType: 'club' | 'zone' | 'district' | 'kin_canada', entityId: string) {
  // Local origin for same-origin downloads/copying while developing
  const localOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
  // Prefer explicitly configured public URL for subscription links (required by Google/webcal)
  const configuredPublic = process.env.NEXT_PUBLIC_APP_URL
  const effectiveLocalBase = localOrigin || configuredPublic || 'http://localhost:3000'

  // Public base must be https and non-localhost for best compatibility
  let publicBase = configuredPublic || effectiveLocalBase
  if (publicBase.startsWith('http://')) publicBase = publicBase.replace('http://', 'https://')

  const httpIcsUrl = `${effectiveLocalBase}/api/calendar/${entityType}/${entityId}/feed`
  const publicIcsUrl = `${publicBase}/api/calendar/${entityType}/${entityId}/feed`

  // Many native calendar apps recognize webcal:// for subscription and require public reachability
  const webcalUrl = publicIcsUrl.replace(/^https?:\/\//, 'webcal://')
  // Google Calendar settings page (no pre-filling)
  const googleSettingsUrl = `https://calendar.google.com/calendar/r/settings/addbyurl`

  return { httpIcsUrl, publicIcsUrl, webcalUrl, googleSettingsUrl }
}

// Get calendar export options
export function getCalendarExportOptions(event: Event, showToast?: (message: string) => void) {
  return [
    {
      name: 'Google Calendar',
      url: generateGoogleCalendarUrl(event),
      icon: '📅',
      description: 'Add to Google Calendar'
    },
    {
      name: 'Outlook',
      url: generateOutlookCalendarUrl(event),
      icon: '📧',
      description: 'Add to Outlook Calendar'
    },
    {
      name: 'Yahoo Calendar',
      url: generateYahooCalendarUrl(event),
      icon: '📆',
      description: 'Add to Yahoo Calendar'
    },
    {
      name: 'Download ICS',
      action: () => {
        downloadICSFile(event)
        showToast?.('ICS file downloaded successfully!')
      },
      icon: '💾',
      description: 'Download .ics file for any calendar app'
    },
    {
      name: 'Copy Details',
      action: async () => {
        const success = await copyEventDetails(event)
        if (success) {
          showToast?.('Event details copied to clipboard!')
        } else {
          showToast?.('Failed to copy to clipboard')
        }
      },
      icon: '📋',
      description: 'Copy event details to clipboard'
    }
  ]
}
