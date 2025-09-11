'use client'

import Header from '@/components/Header'
import EventForm from '@/components/EventForm'

export default function CreateEventPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <EventForm mode="create" />
    </div>
  )
}