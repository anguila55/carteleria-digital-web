import type { Metadata } from 'next'

// Translation
import { getTranslation } from '@/Shared/Lib/Translation/'

export const metadata: Metadata = {
  title: getTranslation('views.home.metaData.title'),
  description: getTranslation('views.home.metaData.description')
}

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
