'use client'
import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

// Components

export function ClientRoot({ children }: { children: ReactNode }) {
  const TIMEOUT_FETCH = process.env.NEXT_PUBLIC_TIMEOUT_FETCH ? parseInt(process.env.NEXT_PUBLIC_TIMEOUT_FETCH) : 7000

  // El Service Worker es registrado por CacheManager (singleton en cache-manager.ts)

  return (
    <main className="grow flex flex-col">
      <div className="flex-1">{children}</div>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: TIMEOUT_FETCH }} />
    </main>
  )
}
