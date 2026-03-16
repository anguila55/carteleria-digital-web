'use client'

// UI

// Translation

// hooks
import { useAutoStartCountdown, useContentManager, useVideoPlayback } from '@/Features/Home/Hooks'
import { useOfflineVideos } from '@/Shared/Hooks/useOfflineVideos'

// Components
import { AutoStartCountdown, ConnectionStatusDisplay, HomeControls, MediaPlayer } from '@/Features/Home/Components'

// Utils
import { useHomeActions } from '@/Features/Home/Utils/home.actions'

// Types
import { ContentResponse } from '@/Features/Home/Types/Content.types'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export interface HomeViewProps {
  content: ContentResponse
}

const HomeView = (props: HomeViewProps) => {
  /*********** props **********/
  const { content } = props

  /*********** hooks **********/
  // Custom hooks primero para obtener contentToPlay
  const { loading, contentToPlay, isRevalidating, handleRevalidateContent, prepareDataToCompare } = useContentManager({
    initialContent: content
  })

  const { cacheStatus, isCaching, cachingProgress, cacheVideos, clearCache, isOfflineReady, hasVideosToCache } =
    useOfflineVideos(contentToPlay)

  const {
    showContents,
    hideCursor,
    currentVideoIndex,
    startVideoPlayback,
    stopVideoPlayback,
    handleVideoEnded,
    handleActionUser
  } = useVideoPlayback({
    contentToPlay,
    isOfflineReady,
    isOnline: cacheStatus.isOnline
  })

  const { autoStartTimer, isCountdownActive, cancelAutoStart } = useAutoStartCountdown({
    contentToPlay,
    showContents,
    loading,
    isOnline: cacheStatus.isOnline,
    onStart: startVideoPlayback
  })

  const { handleLogOut, handleCacheVideos, handleClearCache } = useHomeActions()

  // Notificar cuando la app esté lista para offline
  useEffect(() => {
    if (isOfflineReady && contentToPlay.length > 0) {
      toast.success('🎥 Videos ready for offline playback!')
    }
  }, [isOfflineReady, contentToPlay.length])

  // Verificar actualizaciones periódicamente
  useEffect(() => {
    const TIMER = process.env.NEXT_PUBLIC_TIMEOUT_COMPARE
      ? parseInt(process.env.NEXT_PUBLIC_TIMEOUT_COMPARE) * 1000
      : 7000

    const interval = setInterval(() => {
      if (cacheStatus.isOnline) {
        prepareDataToCompare(cacheStatus.isOnline)
      }
    }, TIMER)

    return () => clearInterval(interval)
  }, [cacheStatus.isOnline, prepareDataToCompare])

  /*********** render **********/

  return (
    <div className={`h-dvh relative flex items-center justify-center ${hideCursor ? 'cursor-none' : ''}`}>
      {showContents && contentToPlay.length > 0 ? (
        <MediaPlayer
          contentToPlay={contentToPlay}
          currentVideoIndex={currentVideoIndex}
          isOnline={cacheStatus.isOnline}
          onVideoEnded={handleVideoEnded}
          onUserAction={handleActionUser}
        />
      ) : (
        <div className="flex flex-col items-center">
          <ConnectionStatusDisplay
            isOnline={cacheStatus.isOnline}
            cachedCount={cacheStatus.cachedCount}
            isCaching={isCaching}
            cachingProgress={cachingProgress}
            isOfflineReady={isOfflineReady}
          />

          <AutoStartCountdown
            isActive={isCountdownActive && cacheStatus.isOnline}
            timer={autoStartTimer}
            onCancel={cancelAutoStart}
          />

          <HomeControls
            loading={loading}
            isRevalidating={isRevalidating}
            isOnline={cacheStatus.isOnline}
            hasVideosToCache={hasVideosToCache}
            isCaching={isCaching}
            cachedCount={cacheStatus.cachedCount}
            cacheIsSupported={cacheStatus.isSupported}
            onPlayStart={startVideoPlayback}
            onPlayStop={stopVideoPlayback}
            onCacheVideos={() => handleCacheVideos(contentToPlay, cacheVideos)}
            onClearCache={() => handleClearCache(clearCache)}
            onRevalidateContent={() => handleRevalidateContent(cacheStatus.isOnline)}
            onLogOut={() => handleLogOut(clearCache)}
          />
        </div>
      )}
    </div>
  )
}

export default HomeView
