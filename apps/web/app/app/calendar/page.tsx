'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function CalendarPage() {
  useEffect(() => {
    redirect('/app/appointments')
  }, [])
  return null
}
