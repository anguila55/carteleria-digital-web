import { getDataContent, getFlagToCompare } from '@/Features/Home/Actions'
import { ContentResponse, ContentToPlay } from '@/Features/Home/Types/Content.types'
import { getTranslation } from '@/Shared/Lib/Translation/'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const CACHED_CONTENT_KEY = 'cached_content_playlist'

interface UseContentManagerProps {
  initialContent: ContentResponse
}

// const TIMER = process.env.NEXT_PUBLIC_TIMEOUT_COMPARE ? parseInt(process.env.NEXT_PUBLIC_TIMEOUT_COMPARE) * 1000 : 7000

export const useContentManager = ({ initialContent }: UseContentManagerProps) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [contentToPlay, setContentToPlay] = useState<ContentToPlay[]>([])
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false)

  const saveContentToStorage = (content: ContentToPlay[]) => {
    try {
      localStorage.setItem(CACHED_CONTENT_KEY, JSON.stringify(content))
    } catch {
      console.error('[DEBUG] Failed to save content to localStorage')
    }
  }

  const loadContentFromStorage = (): ContentToPlay[] | null => {
    try {
      const stored = localStorage.getItem(CACHED_CONTENT_KEY)
      return stored ? (JSON.parse(stored) as ContentToPlay[]) : null
    } catch {
      return null
    }
  }

  const showMessageError = (data: ContentResponse) => {
    if (data.status === 'error') {
      toast.error(data.message)
    }
  }

  const showMessageEmpty = (data: ContentResponse) => {
    if (data.status === 'success' && data.data && data.data.length === 0) {
      toast.error(getTranslation('alerts.home.fetchContentEmpty'))
    }
  }

  const prepareContent = (response: ContentResponse, persist = true) => {
    if (response.status === 'success' && response.data && response.data.length > 0) {
      setContentToPlay(response.data)
      if (persist) saveContentToStorage(response.data)
    }
  }

  const handleRevalidateContent = async (isOnline: boolean) => {
    if (!isOnline) {
      toast.error('Revalidation requires internet connection')
      return
    }

    setIsRevalidating(true)
    try {
      const response = await getDataContent()

      if (response.status === 'success' && response.data) {
        prepareContent(response)
      } else {
        toast.error('Error revalidating content: ' + response.message)
      }
    } catch (error) {
      console.error('[DEBUG] Error revalidating content:', error)
      toast.error('Error checking for new content')
    } finally {
      setIsRevalidating(false)
    }
  }

  const prepareDataToCompare = async (isOnline: boolean) => {
    if (!isOnline) return

    const response = await getFlagToCompare()

    if (response.status === 'success' && response.data === true) {
      handleRevalidateContent(isOnline)
    }
  }

  // Inicializar contenido
  useEffect(() => {
    if (initialContent) {
      if (initialContent.status === 'error') {
        const stored = loadContentFromStorage()
        if (stored && stored.length > 0) {
          setContentToPlay(stored)
        } else {
          showMessageError(initialContent)
        }
      } else {
        showMessageEmpty(initialContent)
        prepareContent(initialContent)
      }
      setLoading(false)
    }
  }, [initialContent])

  // Verificar actualizaciones periódicamente - lo movimos a HomeView
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (isOnline) {
  //       prepareDataToCompare()
  //     }
  //   }, TIMER)

  //   return () => clearInterval(interval)
  // }, [isOnline])

  return {
    loading,
    contentToPlay,
    isRevalidating,
    handleRevalidateContent,
    prepareDataToCompare
  }
}
