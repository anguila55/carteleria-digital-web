import { ContentToPlay } from '@/Features/Home/Types/Content.types'
import { useCallback, useEffect, useState } from 'react'

interface UseVideoPlaybackProps {
  contentToPlay: ContentToPlay[]
  isOfflineReady: boolean
  isOnline: boolean
}

export const useVideoPlayback = ({ contentToPlay, isOfflineReady, isOnline }: UseVideoPlaybackProps) => {
  const [showContents, setShowContents] = useState<boolean>(false)
  const [hideCursor, setHideCursor] = useState<boolean>(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0)
  const [playCount, setPlayCount] = useState<number>(0)

  const startVideoPlayback = () => {
    if (contentToPlay.length > 0) {
      setShowContents(true)
      setHideCursor(true)
    }
  }

  const stopVideoPlayback = () => {
    setShowContents(false)
    setHideCursor(false)
    setCurrentVideoIndex(0)
    setPlayCount(0)
  }

  const playNextVideo = useCallback(() => {
    setCurrentVideoIndex((prev) => (contentToPlay.length === 0 ? prev : (prev + 1) % contentToPlay.length))
    setPlayCount((c) => c + 1)
  }, [contentToPlay.length])

  const handleVideoEnded = useCallback(() => {
    playNextVideo()
  }, [playNextVideo])

  const handleVideoError = useCallback(() => {
    playNextVideo()
  }, [playNextVideo])

  const handleActionUser = () => {
    setShowContents(false)
    setHideCursor(false)
  }

  // Manejo de teclas
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !showContents) {
      startVideoPlayback()
    }
  }

  // Auto-advance para imágenes
  useEffect(() => {
    if (contentToPlay.length > 0 && contentToPlay[currentVideoIndex]?.type === 'image') {
      const duration = contentToPlay[currentVideoIndex].duration
        ? contentToPlay[currentVideoIndex].duration * 1000
        : 5000

      const timeout = setTimeout(playNextVideo, duration)
      return () => clearTimeout(timeout)
    }
  }, [currentVideoIndex, contentToPlay.length, playNextVideo])

  // Event listener para teclas
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showContents])

  // Auto-start offline playback when ready (sin cronómetro)
  useEffect(() => {
    const shouldAutoStartOffline =
      !isOnline && // Offline
      isOfflineReady && // Has cached videos
      contentToPlay.length > 0 && // Has content
      !showContents // Not currently playing

    if (shouldAutoStartOffline) {
      setTimeout(() => {
        startVideoPlayback() // Iniciar directamente sin cronómetro cuando está offline
      }, 2000) // Small delay to ensure UI is ready
    }
  }, [isOnline, isOfflineReady, contentToPlay.length, showContents])

  return {
    showContents,
    hideCursor,
    currentVideoIndex,
    playCount,
    startVideoPlayback,
    stopVideoPlayback,
    playNextVideo,
    handleVideoEnded,
    handleVideoError,
    handleActionUser
  }
}
