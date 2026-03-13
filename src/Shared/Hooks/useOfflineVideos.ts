'use client'
import { ContentToPlay } from '@/Features/Home/Types/Content.types'
import { cacheManager, CacheStatus } from '@/Shared/Lib/cache-manager'
import { useEffect, useState } from 'react'

interface UseOfflineVideosResult {
  // Estado del cache
  cacheStatus: CacheStatus
  isCaching: boolean
  cachingProgress: { current: number; total: number }

  // Funciones
  cacheVideos: (videos: ContentToPlay[]) => Promise<void>
  clearCache: () => Promise<void>
  refreshCacheStatus: () => Promise<void>

  // Estados útiles
  isOfflineReady: boolean
  hasVideosToCache: boolean
}

export const useOfflineVideos = (videos: ContentToPlay[] = []): UseOfflineVideosResult => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    isSupported: false,
    isRegistered: false,
    cachedCount: 0,
    totalSize: 0,
    isOnline: true
  })

  const [isCaching, setIsCaching] = useState(false)
  const [cachingProgress, setCachingProgress] = useState({ current: 0, total: 0 })

  // Refrescar estado del cache
  const refreshCacheStatus = async () => {
    try {
      const status = await cacheManager.getCacheStatus()
      setCacheStatus(status)
    } catch (error) {
      console.error('Error refreshing cache status:', error)
    }
  }

  // Cachear videos con progreso
  const cacheVideos = async (videosToCache: ContentToPlay[]) => {
    if (!videosToCache.length || isCaching) return

    setIsCaching(true)
    setCachingProgress({ current: 0, total: videosToCache.length })

    try {
      await cacheManager.cacheVideos(videosToCache, {
        onCacheProgress: (current, total) => {
          setCachingProgress({ current, total })
        },
        onCacheComplete: (cachedCount) => {
          console.log(`Successfully cached ${cachedCount} videos`)
          refreshCacheStatus()
        },
        onCacheError: (error) => {
          console.error('Cache error:', error)
        }
      })
    } catch (error) {
      console.error('Error caching videos:', error)
    } finally {
      setIsCaching(false)
      setCachingProgress({ current: 0, total: 0 })
    }
  }

  // Limpiar cache
  const clearCache = async () => {
    try {
      await cacheManager.clearCache()
      await refreshCacheStatus()
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  // Verificar si el usuario está autenticado (tiene token)
  const isAuthenticated = (): boolean => {
    try {
      // Verificar si hay cookies o localStorage con token de auth
      if (typeof document !== 'undefined') {
        const hasAuthCookie = document.cookie.includes('auth_token=')
        return hasAuthCookie
      }
      return false
    } catch (error) {
      console.error('Error checking authentication status:', error)
      return false
    }
  }

  // Limpiar cache automáticamente cuando el usuario ya no esté autenticado
  const checkAuthAndClearCache = async () => {
    if (!isAuthenticated() && cacheStatus.cachedCount > 0) {
      // console.log('User no longer authenticated, clearing video cache for security...')
      try {
        await cacheManager.clearCacheOnLogout()
        await refreshCacheStatus()
      } catch (error) {
        console.error('Error auto-clearing cache after logout:', error)
      }
    }
  }

  // Efectos
  useEffect(() => {
    refreshCacheStatus()

    // Escuchar cambios en el estado online/offline
    const handleOnline = () => refreshCacheStatus()
    const handleOffline = () => refreshCacheStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Verificar periódicamente el estado de autenticación y limpiar cache si es necesario
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuthAndClearCache()
    }, 5000) // Verificar cada 5 segundos

    // También verificar inmediatamente
    checkAuthAndClearCache()

    return () => clearInterval(interval)
  }, [cacheStatus.cachedCount])

  // Auto-cachear cuando hay nuevos videos y está online
  useEffect(() => {
    if (videos.length > 0 && cacheStatus.isOnline && cacheStatus.isSupported && !isCaching) {
      const shouldAutoCache = cacheStatus.cachedCount === 0 || videos.length > cacheStatus.cachedCount

      if (shouldAutoCache) {
        cacheVideos(videos)
      }
    }
  }, [videos.length, cacheStatus.isOnline, cacheStatus.isSupported])

  // Estados derivados
  const isOfflineReady = cacheStatus.cachedCount > 0 && videos.length > 0
  const hasVideosToCache = videos.length > 0

  return {
    cacheStatus,
    isCaching,
    cachingProgress,
    cacheVideos: (videosToCache: ContentToPlay[]) => cacheVideos(videosToCache),
    clearCache,
    refreshCacheStatus,
    isOfflineReady,
    hasVideosToCache
  }
}
