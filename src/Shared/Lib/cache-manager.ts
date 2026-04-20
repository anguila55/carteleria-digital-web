import { ContentToPlay } from '@/Features/Home/Types/Content.types'

export interface CacheStatus {
  isSupported: boolean
  isRegistered: boolean
  cachedCount: number
  cachedUrls: string[]
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
  private readyPromise: Promise<void>

  constructor() {
    if (typeof window !== 'undefined') {
      this.readyPromise = this.initialize()
    } else {
      this.readyPromise = Promise.resolve()
    }
  }

  private async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered successfully')

        // Esperar a que el SW esté activo antes de declararse listo
        await navigator.serviceWorker.ready
        // Actualizar referencia con el registro activo
        this.serviceWorkerRegistration =
          (await navigator.serviceWorker.getRegistration('/sw.js')) ?? this.serviceWorkerRegistration

        // Cachear los assets estáticos ya cargados en el DOM (se cargan antes de que el SW esté activo)
        this.cacheAlreadyLoadedAssets()
      } catch (error) {
        console.error('Error registering Service Worker:', error)
      }
    }
  }

  private cacheAlreadyLoadedAssets() {
    if (!('caches' in window)) return

    const urls: string[] = []

    document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((el) => {
      if (el.src.includes('/_next/static/')) urls.push(el.src)
    })
    document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]').forEach((el) => {
      if (el.href.includes('/_next/static/')) urls.push(el.href)
    })

    if (urls.length === 0) return

    caches.open('carteleria-app-shell-v1').then((cache) => {
      urls.forEach((url) => {
        cache.match(url).then((hit) => {
          if (!hit) {
            fetch(url)
              .then((res) => {
                if (res.ok) cache.put(url, res)
              })
              .catch(() => {})
          }
        })
      })
    })
  }

  // Verificar si el cache está disponible
  public async isSupported(): Promise<boolean> {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window
  }

  // Obtener estado del cache
  public async getCacheStatus(): Promise<CacheStatus> {
    const isSupported = await this.isSupported()
    const isOnline = navigator.onLine

    if (!isSupported) {
      return {
        isSupported,
        isRegistered: false,
        cachedCount: 0,
        cachedUrls: [],
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
        cachedUrls: response.cachedUrls || [],
        totalSize: response.totalSize || 0,
        isOnline
      }
    } catch (error) {
      console.error('Error getting cache status:', error)
      return {
        isSupported,
        isRegistered: false,
        cachedCount: 0,
        cachedUrls: [],
        totalSize: 0,
        isOnline
      }
    }
  }

  // Cachear videos en background
  public async cacheVideos(videos: ContentToPlay[], events?: CacheManagerEvents): Promise<boolean> {
    try {
      const response = await this.sendMessageToSW({ type: 'CACHE_VIDEOS', videos }, (current, total) =>
        events?.onCacheProgress?.(current, total)
      )

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

  // Enviar mensaje al Service Worker.
  // onProgress se llama por cada mensaje CACHE_PROGRESS, reseteando el timeout por archivo.
  private async sendMessageToSW(message: any, onProgress?: (current: number, total: number) => void): Promise<any> {
    // Esperar a que la inicialización termine antes de intentar enviar mensajes
    await this.readyPromise

    if (!this.serviceWorkerRegistration?.active) {
      throw new Error('Service Worker not active')
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()
      // 60 segundos por archivo: se resetea con cada CACHE_PROGRESS
      const TIMEOUT_PER_FILE_MS = 60_000
      let timeoutId: ReturnType<typeof setTimeout>

      const resetTimeout = () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          reject(new Error('Service Worker response timeout'))
        }, TIMEOUT_PER_FILE_MS)
      }

      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_PROGRESS') {
          resetTimeout()
          onProgress?.(event.data.current, event.data.total)
        } else {
          clearTimeout(timeoutId)
          resolve(event.data)
        }
      }

      messageChannel.port1.onmessageerror = (error) => {
        clearTimeout(timeoutId)
        reject(error)
      }

      resetTimeout()
      this.serviceWorkerRegistration!.active!.postMessage(message, [messageChannel.port2])
    })
  }

  // Verificar si un archivo específico está cacheado
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

  // Obtener lista de URLs cacheadas
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
