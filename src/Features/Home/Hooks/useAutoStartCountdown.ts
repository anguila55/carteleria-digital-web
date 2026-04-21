import { ContentToPlay } from '@/Features/Home/Types/Content.types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface UseAutoStartCountdownProps {
  contentToPlay: ContentToPlay[]
  showContents: boolean
  loading: boolean
  isOnline: boolean
  isOfflineReady: boolean
  onStart: () => void
}

export const useAutoStartCountdown = ({
  contentToPlay,
  showContents,
  loading,
  isOnline,
  isOfflineReady,
  onStart
}: UseAutoStartCountdownProps) => {
  const canAutoStart = isOnline || isOfflineReady
  const [autoStartTimer, setAutoStartTimer] = useState<number>(30)
  const [isCountdownActive, setIsCountdownActive] = useState<boolean>(false)
  const [isAutoStartCancelled, setIsAutoStartCancelled] = useState<boolean>(false)

  const startAutoStartCountdown = () => {
    if (contentToPlay.length > 0 && !showContents && !loading && !isAutoStartCancelled && canAutoStart) {
      setAutoStartTimer(30)
      setIsCountdownActive(true)
    }
  }

  const cancelAutoStart = () => {
    setIsCountdownActive(false)
    setIsAutoStartCancelled(true)
    setAutoStartTimer(30)
    toast.success('Auto-reproducción cancelada')
  }

  const resetAutoStart = () => {
    setIsCountdownActive(false)
    setIsAutoStartCancelled(false)
    setAutoStartTimer(30)
  }

  // Efecto para manejar el cronómetro de auto-inicio
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isCountdownActive && autoStartTimer > 0) {
      interval = setInterval(() => {
        setAutoStartTimer((prev) => {
          if (prev <= 1) {
            setIsCountdownActive(false)
            setTimeout(() => {
              onStart()
            }, 100)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isCountdownActive, autoStartTimer, onStart])

  // Efecto para iniciar el cronómetro automáticamente cuando hay contenido disponible
  useEffect(() => {
    if (contentToPlay.length > 0 && !loading && !showContents && !isAutoStartCancelled && canAutoStart) {
      setTimeout(() => {
        startAutoStartCountdown()
      }, 2000)
    }
  }, [contentToPlay.length, loading, showContents, isAutoStartCancelled, isOnline, isOfflineReady])

  // Reset auto-start cuando se detiene manualmente la reproducción
  useEffect(() => {
    if (!showContents) {
      resetAutoStart()
    }
  }, [showContents])

  return {
    autoStartTimer,
    isCountdownActive,
    isAutoStartCancelled,
    startAutoStartCountdown,
    cancelAutoStart,
    resetAutoStart
  }
}
