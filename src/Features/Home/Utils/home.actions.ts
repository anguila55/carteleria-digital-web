import { signOutUser } from '@/Features/Authentication/Actions'
import { ContentToPlay } from '@/Features/Home/Types/Content.types'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export const useHomeActions = () => {
  const router = useRouter()

  const handleLogOut = async (clearCache: () => Promise<void>) => {
    try {
      // Limpiar cache de videos antes del logout por seguridad
      await clearCache()
      toast.success('Cache cleared for security')
    } catch (error) {
      console.error('Error clearing cache on logout:', error)
      // Continuar con logout aunque falle el clear cache
    }

    await signOutUser()
    router.push('/')
  }

  const handleCacheVideos = async (
    contentToPlay: ContentToPlay[],
    cacheVideos: (content: ContentToPlay[]) => Promise<void>
  ) => {
    if (contentToPlay.length > 0) {
      try {
        await cacheVideos(contentToPlay)
        toast.success(`${contentToPlay.length} videos cached for offline use`)
      } catch (error) {
        console.error('Error caching videos:', error)
        toast.error('Error caching videos')
      }
    }
  }

  const handleClearCache = async (clearCache: () => Promise<void>) => {
    try {
      await clearCache()
      toast.success('Cache cleared successfully')
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error('Error clearing cache')
    }
  }

  return {
    handleLogOut,
    handleCacheVideos,
    handleClearCache
  }
}
