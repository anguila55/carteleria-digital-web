import { LoadingProvider } from '@/Shared/Context/LoadingContext'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClientRoot } from './client-root'
import './globals.css'
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LoadingProvider>
          <ClientRoot>{children}</ClientRoot>
        </LoadingProvider>
      </body>
    </html>
  )
}
