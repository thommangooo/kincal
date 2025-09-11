'use client'

import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import EventForm from '@/components/EventForm'

export default function EditEventPage() {
  const params = useParams()
  const eventId = params.id as string

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <EventForm mode="edit" eventId={eventId} />
    </div>
  )
}