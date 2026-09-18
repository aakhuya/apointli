import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from './providers/auth-provider'
import { OrganizationProvider } from './providers/organization-provider'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from './providers/theme-provider'

const inter = localFont({
  src: [
    {
      path: './fonts/Inter-Variable.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ],
})

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
    <html
      lang="en"
      className={`${inter.variable} scroll-smooth`}
      suppressHydrationWarning
    >
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
