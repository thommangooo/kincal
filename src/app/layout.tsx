import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kin Canada Calendar',
  description: 'Simple test build',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}