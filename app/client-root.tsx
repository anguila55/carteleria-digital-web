'use client'
import { ReactNode, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

// Components

export function ClientRoot({ children }: { children: ReactNode }) {
  const TIMEOUT_FETCH = process.env.NEXT_PUBLIC_TIMEOUT_FETCH ? parseInt(process.env.NEXT_PUBLIC_TIMEOUT_FETCH) : 7000

  // Registrar Service Worker para cache offline
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return (
    <main className="grow flex flex-col">
      <div className="flex-1">{children}</div>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: TIMEOUT_FETCH }} />
    </main>
  )
}
