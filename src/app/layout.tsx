import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { FilterProvider } from "@/contexts/FilterContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kin Canada Events Calendar",
  description: "Discover and share events across Kin clubs, zones, and districts. Stay connected with your Kin community.",
  keywords: ["Kin Canada", "events", "calendar", "clubs", "Kinsmen", "Kinette", "community"],
  authors: [{ name: "KinCal" }],
  creator: "KinCal",
  publisher: "KinCal",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon_16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/faviccon_48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon_16.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KinCal',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <FilterProvider>
            {children}
          </FilterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
