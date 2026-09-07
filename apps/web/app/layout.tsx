import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './styles/globals.css'
import { QueryProvider } from './providers/query-provider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Apointli - Smart Appointment Scheduling Platform',
  description: 'The all-in-one appointment scheduling platform for service businesses. Manage bookings, staff, and customers effortlessly.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
