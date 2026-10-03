import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './providers/auth-provider'
import { OrganizationProvider } from './providers/organization-provider'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from './providers/theme-provider'

export const metadata: Metadata = {
  title: 'apointli — Smart Appointment Scheduling',
  description:
    'The all-in-one appointment scheduling platform for service businesses.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0a1628',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <OrganizationProvider>{children}</OrganizationProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
