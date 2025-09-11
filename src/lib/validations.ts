import { z } from 'zod'

export const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  start_time: z.string().optional(),
  end_date: z.string().min(1, 'End date is required'),
  end_time: z.string().optional(),
  location: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  tags: z.array(z.string()).optional(),
  event_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal(''))
}).refine((data) => {
  // Only validate time order if both start and end times are provided
  if (data.start_time && data.end_time) {
    const startDateTime = new Date(`${data.start_date}T${data.start_time}`)
    const endDateTime = new Date(`${data.end_date}T${data.end_time}`)
    return endDateTime > startDateTime
  }
  // If no times provided, just ensure end date is not before start date
  if (!data.start_time && !data.end_time) {
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    return endDate >= startDate
  }
  return true
}, {
  message: 'End date/time must be after start date/time',
  path: ['end_date']
})

export const announcementFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  content: z.string().min(1, 'Content is required'),
  publish_date: z.string().min(1, 'Publish date is required'),
  expiry_date: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  tags: z.array(z.string()).optional(),
  priority: z.number().min(0).max(10).default(0),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal(''))
})

export const magicLinkSchema = z.object({
  email: z.string().email('Must be a valid email address')
})

export type EventFormData = z.infer<typeof eventFormSchema>
export type AnnouncementFormData = z.infer<typeof announcementFormSchema>
export type MagicLinkData = z.infer<typeof magicLinkSchema>
