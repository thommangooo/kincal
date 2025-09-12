'use client'

import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import AnnouncementForm from '@/components/AnnouncementForm'

export default function EditAnnouncementPage() {
  const params = useParams()
  const announcementId = params.id as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <AnnouncementForm mode="edit" announcementId={announcementId} />
    </div>
  )
}
