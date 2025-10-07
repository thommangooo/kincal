import { Event } from './database'

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
export function generateEntityICSFeed(events: Event[], entityName: string, _entityType: 'club' | 'zone' | 'district'): string {
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const now = formatDate(new Date())
  
  // Escape special characters for ICS format
  const escapeICS = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
  }
  
  // Calendar header
  const calendarHeader = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kin Canada Calendar//Entity Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(entityName)}`,
    `X-WR-TIMEZONE:America/Toronto`,
    `X-WR-CALDESC:${escapeICS(`Events from ${entityName}`)}`
  ].join('\r\n')
  
  // Generate VEVENT for each event
  const eventEntries = events.map(event => {
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)
    const start = formatDate(startDate)
    const end = formatDate(endDate)
    const uid = `${event.id}@kincal.com`
    
    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
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
export function buildEntityIcsSubscriptionUrls(entityType: 'club' | 'zone' | 'district', entityId: string) {
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
  // Google Calendar subscription URL using cid parameter
  const googleAddByUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(publicIcsUrl)}`
  
  // Alternative: Direct Google Calendar add-by-url settings page
  const googleSettingsUrl = `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(publicIcsUrl)}`

  return { httpIcsUrl, publicIcsUrl, webcalUrl, googleAddByUrl, googleSettingsUrl }
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
