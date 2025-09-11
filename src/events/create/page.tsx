'use client'

import Header from '@/components/Header'
import EventForm from '@/components/EventForm'

export default function CreateEventPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <EventForm mode="create" />
    </div>
  )
}