import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function isEventToday(event: { start_date: string; end_date: string }): boolean {
  const today = new Date()
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  return startDate <= today && endDate >= today
}

export function isEventUpcoming(event: { start_date: string }): boolean {
  const now = new Date()
  const startDate = new Date(event.start_date)
  
  return startDate > now
}

export function isEventPast(event: { end_date: string }): boolean {
  const now = new Date()
  const endDate = new Date(event.end_date)
  
  return endDate < now
}

export function getEventStatus(event: { start_date: string; end_date: string }): 'upcoming' | 'today' | 'past' {
  if (isEventToday(event)) return 'today'
  if (isEventUpcoming(event)) return 'upcoming'
  return 'past'
}

export function generateEmbedCode(clubId?: string, zoneId?: string, districtId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  let embedUrl = `${baseUrl}/embed`
  
  const params = new URLSearchParams()
  if (clubId) params.append('club', clubId)
  if (zoneId) params.append('zone', zoneId)
  if (districtId) params.append('district', districtId)
  
  if (params.toString()) {
    embedUrl += `?${params.toString()}`
  }
  
  return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border: 1px solid #ccc;"></iframe>`
}

