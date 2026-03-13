'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// actions
import { getDataContent, getFlagToCompare } from '@/Features/Home/Actions'

// UI
import { Button } from '@/Shared/UI'
import { CheckCircle, Download, LogOut, Play, RefreshCw, Square, Wifi, WifiOff } from 'lucide-react'

// Translation
import { getTranslation } from '@/Shared/Lib/Translation/'

// actions
import { signOutUser } from '@/Features/Authentication/Actions'
// hooks
import { useOfflineVideos } from '@/Shared/Hooks/useOfflineVideos'

// classes
const CLASS_BTN = 'h-12 w-48 mb-4'

// interface
import { ContentResponse, ContentToPlay } from '@/Features/Home/Types/Content.types'
export interface HomeViewProps {
  content: ContentResponse
}
// constantes
const TIMER = process.env.NEXT_PUBLIC_TIMEOUT_COMPARE ? parseInt(process.env.NEXT_PUBLIC_TIMEOUT_COMPARE) * 1000 : 7000

const HomeView = (props: HomeViewProps) => {
  /*********** props **********/
  const { content } = props

  /*********** states **********/
  const [loading, setLoading] = useState<boolean>(true)
  const [contentToPlay, setContentToPlay] = useState<ContentToPlay[]>([])
  const [hideCursor, setHideCursor] = useState<boolean>(false)
  const [showContents, setShowContents] = useState<boolean>(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0)
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false)
  /*********** hooks **********/
  const router = useRouter()
  const { cacheStatus, isCaching, cachingProgress, cacheVideos, clearCache, isOfflineReady, hasVideosToCache } =
    useOfflineVideos(contentToPlay)

  /*********** functions **********/
  const handleLogOut = async () => {
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

  const prepareContent = (response: ContentResponse) => {
    // lógica para preparar el contenido si es necesario
    if (response.status === 'success' && response.data) {
      setContentToPlay(response.data)
    }
  }

  const startVideoPlayback = () => {
    if (contentToPlay.length > 0) {
      setShowContents(true)
      setHideCursor(true)
    }
  }

  const playNextVideo = () => {
    if (contentToPlay.length === 0) {
      return
    }

    const nextIndex = (currentVideoIndex + 1) % contentToPlay.length

    setCurrentVideoIndex(nextIndex)
  }

  const handleVideoEnded = () => {
    playNextVideo()
  }

  const stopVideoPlayback = () => {
    setShowContents(false)
    setHideCursor(false)
    setCurrentVideoIndex(0) // Reset to first video
  }

  const handleActionUser = () => {
    setShowContents(false)
    setHideCursor(false)
  }
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !showContents && !loading) {
      startVideoPlayback()
    }
  }
  const handleCacheVideos = async () => {
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

  const handleClearCache = async () => {
    try {
      await clearCache()
      toast.success('Cache cleared successfully')
    } catch (error) {
      console.error('Error clearing cache:', error)
      toast.error('Error clearing cache')
    }
  }

  const handleRevalidateContent = async () => {
    if (!cacheStatus.isOnline) {
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
      setIsRevalidating(false)
    } catch (error) {
      console.error('[DEBUG] Error revalidating content:', error)
      toast.error('Error checking for new content')
      setIsRevalidating(false)
    }
  }

  const prepareDataToCompare = async () => {
    const response = await getFlagToCompare()

    if (response.status === 'success' && response.data === true) {
      handleRevalidateContent()
    }
  }

  /*********** life cycle **********/

  useEffect(() => {
    if (content) {
      // mostrar error si existe
      showMessageError(content)
      // mostrar mensaje si no hay contenido
      showMessageEmpty(content)
      // preparar contenido
      prepareContent(content)
      // finalizar loading
      setLoading(false)
    }
  }, [content])

  useEffect(() => {
    if (contentToPlay.length > 0) {
      if (contentToPlay[currentVideoIndex].type === 'image') {
        setTimeout(
          () => {
            playNextVideo()
          },
          contentToPlay[currentVideoIndex].duration ? contentToPlay[currentVideoIndex].duration * 1000 : 5000
        ) // Mostrar la imagen por la duracion que venga o por 5 segundos si no viene duración
      }
    }
  }, [currentVideoIndex])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showContents, loading])

  // Notificar cuando la app esté lista para offline
  useEffect(() => {
    if (isOfflineReady && contentToPlay.length > 0) {
      toast.success('🎥 Videos ready for offline playback!')
    }
  }, [isOfflineReady, contentToPlay.length])

  useEffect(() => {
    setInterval(() => {
      if (cacheStatus.isOnline) {
        prepareDataToCompare()
      }
    }, TIMER)
  }, [])

  // Auto-start offline playback when ready
  useEffect(() => {
    const shouldAutoStartOffline =
      !cacheStatus.isOnline && // Offline
      isOfflineReady && // Has cached videos
      contentToPlay.length > 0 && // Has content
      !showContents && // Not currently playing
      !loading // Not loading

    if (shouldAutoStartOffline) {
      setTimeout(() => {
        startVideoPlayback()
      }, 2000) // Small delay to ensure UI is ready
    }
  }, [cacheStatus.isOnline, isOfflineReady, contentToPlay.length, showContents, loading])

  /*********** render **********/

  return (
    <div className={`h-dvh relative flex items-center justify-center ${hideCursor ? 'cursor-none' : ''}`}>
      {showContents && contentToPlay.length > 0 ? (
        <div onClick={handleActionUser} className="w-full h-full">
          {contentToPlay[currentVideoIndex]?.type === 'video' ? (
            <video
              key={`video-${contentToPlay[currentVideoIndex]?.id}-${currentVideoIndex}`} // Force remount on index change
              src={contentToPlay[currentVideoIndex]?.url}
              className="w-full h-full object-cover"
              onEnded={handleVideoEnded}
              onError={(e) => {
                console.error('[DEBUG] Video error:', {
                  url: contentToPlay[currentVideoIndex]?.url,
                  offline: !cacheStatus.isOnline,
                  error: e.currentTarget.error
                })
              }}
              muted
              autoPlay
              controls={false}
              playsInline // Important for mobile/PWA
            />
          ) : (
            <img
              key={`image-${contentToPlay[currentVideoIndex]?.id}-${currentVideoIndex}`} // Force remount on index change
              src={contentToPlay[currentVideoIndex]?.url}
              className="w-full h-full object-cover"
              alt="content image"
              onError={() => {
                console.error('[DEBUG] Image error:', {
                  url: contentToPlay[currentVideoIndex]?.url,
                  offline: !cacheStatus.isOnline
                })
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Estado de cache y offline */}
          <div className="mb-1 p-4 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {cacheStatus.isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">{cacheStatus.isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {cacheStatus.cachedCount > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{cacheStatus.cachedCount} videos cached for offline</span>
              </div>
            )}

            {isCaching && (
              <div className="mt-2">
                <div className="text-sm text-blue-600 mb-1">
                  Caching videos... {cachingProgress.current}/{cachingProgress.total}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${cachingProgress.total > 0 ? (cachingProgress.current / cachingProgress.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <p className="mb-8">{getTranslation('views.home.messageToPlay')}</p>

          <Button className={CLASS_BTN} icon={Play} disabled={loading} onClick={startVideoPlayback}>
            {getTranslation('buttons.play.text')}
          </Button>

          {/* Show different stop button text for offline */}
          <Button className={CLASS_BTN} icon={Square} disabled={loading} onClick={stopVideoPlayback}>
            {getTranslation('buttons.stop.text')}
          </Button>

          {/* Offline status indicator */}
          {!cacheStatus.isOnline && isOfflineReady && (
            <div className="mb-4 p-2 bg-blue-100 rounded-lg text-center">
              <p className="text-sm text-blue-800">
                📱 Offline Mode Active - Playing from cache ({cacheStatus.cachedCount} videos)
              </p>
            </div>
          )}

          {/* Botones de cache */}
          {hasVideosToCache && cacheStatus.isSupported && (
            <>
              <Button
                className={CLASS_BTN}
                icon={Download}
                variant="outline"
                disabled={loading || isCaching || !cacheStatus.isOnline}
                onClick={handleCacheVideos}
              >
                {getTranslation('buttons.downloadOffline.text')}
              </Button>

              {cacheStatus.cachedCount > 0 && (
                <Button
                  className={CLASS_BTN}
                  variant="outline"
                  disabled={loading || isCaching}
                  onClick={handleClearCache}
                >
                  {getTranslation('buttons.clearCache.text')}
                </Button>
              )}
            </>
          )}
          {/* Botón de revalidación manual */}
          <Button
            className={CLASS_BTN}
            icon={RefreshCw}
            variant="outline"
            disabled={loading || isRevalidating || !cacheStatus.isOnline}
            onClick={handleRevalidateContent}
          >
            {getTranslation('buttons.refreshContent.text')}
          </Button>

          <Button
            variant="secondary"
            className={CLASS_BTN}
            icon={LogOut}
            onClick={handleLogOut}
            disabled={loading || !cacheStatus.isOnline}
          >
            {getTranslation('buttons.logOut.text')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default HomeView
