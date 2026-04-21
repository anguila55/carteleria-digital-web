'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OfflineAuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('is_authenticated') === 'true'

    if (!navigator.onLine && isAuthenticated) {
      router.replace('/home')
    } else if (navigator.onLine) {
      localStorage.removeItem('is_authenticated')
    }
  }, [router])

  return null
}
