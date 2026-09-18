import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './providers/auth-provider'
import { OrganizationProvider } from './providers/organization-provider'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from './providers/theme-provider'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'apointli — Smart Appointment Scheduling',
  description:
    'The all-in-one appointment scheduling platform for service businesses.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={inter.className}>
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
