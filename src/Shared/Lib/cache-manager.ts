import { ContentToPlay } from '@/Features/Home/Types/Content.types'

export interface CacheStatus {
  isSupported: boolean
  isRegistered: boolean
  cachedCount: number
  totalSize: number
  isOnline: boolean
}

export interface CacheManagerEvents {
  onCacheProgress?: (current: number, total: number) => void
  onCacheComplete?: (cachedCount: number) => void
  onCacheError?: (error: string) => void
}

class CacheManager {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null
  private messageChannel: MessageChannel | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered successfully')

        // Esperar a que el SW esté activo
        await navigator.serviceWorker.ready
      } catch (error) {
        console.error('Error registering Service Worker:', error)
      }
    }
  }

  // Verificar si el cache está disponible
  public async isSupported(): Promise<boolean> {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window
  }

  // Obtener estado del cache
  public async getCacheStatus(): Promise<CacheStatus> {
    const isSupported = await this.isSupported()
    const isOnline = navigator.onLine

    if (!isSupported || !this.serviceWorkerRegistration) {
      return {
        isSupported,
        isRegistered: false,
        cachedCount: 0,
        totalSize: 0,
        isOnline
      }
    }

    try {
      const response = await this.sendMessageToSW({ type: 'CHECK_CACHE_STATUS' })
      return {
        isSupported,
        isRegistered: true,
        cachedCount: response.cachedCount || 0,
        totalSize: response.totalSize || 0,
        isOnline
      }
    } catch (error) {
      console.error('Error getting cache status:', error)
      return {
        isSupported,
        isRegistered: true,
        cachedCount: 0,
        totalSize: 0,
        isOnline
      }
    }
  }

  // Cachear videos en background
  public async cacheVideos(videos: ContentToPlay[], events?: CacheManagerEvents): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      events?.onCacheError?.('Service Worker not available')
      return false
    }

    try {
      const response = await this.sendMessageToSW({
        type: 'CACHE_VIDEOS',
        videos: videos
      })

      if (response.type === 'CACHE_COMPLETE') {
        events?.onCacheComplete?.(response.cached)
        return true
      }

      return false
    } catch (error) {
      console.error('Error caching videos:', error)
      events?.onCacheError?.(error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Limpiar cache
  public async clearCache(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false
    }

    try {
      const response = await this.sendMessageToSW({ type: 'CLEAR_CACHE' })
      console.log('Video cache cleared successfully')
      return response.type === 'CACHE_CLEARED'
    } catch (error) {
      console.error('Error clearing cache:', error)
      return false
    }
  }

  // Limpiar cache específicamente por logout (con logging adicional)
  public async clearCacheOnLogout(): Promise<boolean> {
    console.log('Clearing video cache due to user logout...')
    const success = await this.clearCache()
    if (success) {
      console.log('Video cache successfully cleared on logout for security')
    } else {
      console.error('Failed to clear video cache on logout')
    }
    return success
  }

  // Enviar mensaje al Service Worker
  private async sendMessageToSW(message: any): Promise<any> {
    if (!this.serviceWorkerRegistration?.active) {
      throw new Error('Service Worker not active')
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }

      messageChannel.port1.onmessageerror = (error) => {
        reject(error)
      }

      // Timeout para evitar esperas infinitas
      setTimeout(() => {
        reject(new Error('Service Worker response timeout'))
      }, 10000)

      this.serviceWorkerRegistration?.active?.postMessage(message, [messageChannel.port2])
    })
  }

  // Verificar si un video específico está cacheado
  public async isVideoCached(url: string): Promise<boolean> {
    if (!('caches' in window)) return false

    try {
      const cache = await caches.open('carteleria-videos-v1')
      const response = await cache.match(url)
      return !!response
    } catch (error) {
      console.error('Error checking if video is cached:', error)
      return false
    }
  }

  // Obtener lista de videos cacheados
  public async getCachedVideoUrls(): Promise<string[]> {
    if (!('caches' in window)) return []

    try {
      const cache = await caches.open('carteleria-videos-v1')
      const requests = await cache.keys()
      return requests.map((request) => request.url)
    } catch (error) {
      console.error('Error getting cached video URLs:', error)
      return []
    }
  }
}

// Crear instancia singleton
export const cacheManager = new CacheManager()

// Hook para usar en componentes React
export const useCacheManager = () => {
  return cacheManager
}
