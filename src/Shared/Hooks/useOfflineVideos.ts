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
    cachedUrls: [],
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

  // Auto-cachear cuando hay archivos que no están en caché todavía
  // Compara por URL real para detectar cambios de contenido aunque la cantidad sea la misma
  const videoUrlSignature = videos.map((v) => v.url).join('|')

  useEffect(() => {
    if (videos.length > 0 && cacheStatus.isOnline && cacheStatus.isSupported && !isCaching) {
      const cachedSet = new Set(cacheStatus.cachedUrls)
      const hasUncachedContent = videos.some((v) => !cachedSet.has(v.url))

      if (hasUncachedContent) {
        cacheVideos(videos)
      }
    }
  }, [videoUrlSignature, cacheStatus.isOnline, cacheStatus.isSupported, cacheStatus.cachedCount])

  // Estados derivados
  // isOfflineReady: todas las URLs actuales están en caché (no solo que haya algo cacheado)
  const cachedSet = new Set(cacheStatus.cachedUrls)
  const isOfflineReady = videos.length > 0 && videos.every((v) => cachedSet.has(v.url))
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
