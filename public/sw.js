// Service Worker para cache de videos offline
const CACHE_NAME = 'carteleria-videos-v1'
const CACHE_URLS_NAME = 'carteleria-urls-v1'

// Eventos del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== CACHE_URLS_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  clients.claim()
})

// Interceptar requests de videos/imágenes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Solo interceptar archivos multimedia
  if (isMediaFile(url.pathname)) {
    console.log('Intercepting media file:', event.request.url)
    event.respondWith(handleMediaRequest(event.request))
  }
})

// Verificar si es un archivo multimedia
function isMediaFile(pathname) {
  const mediaExtensions = ['.mp4', '.jpg', '.jpeg', '.png', '.gif']
  return mediaExtensions.some((ext) => pathname.toLowerCase().endsWith(ext))
}

// Manejar requests de archivos multimedia
async function handleMediaRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)

    const fileType = request.url.match(/\.(mp4|jpg|jpeg|png|gif)$/i)?.[1] || 'unknown'

    if (cachedResponse) {
      console.log(`Serving ${fileType} from cache:`, request.url)
      return cachedResponse
    }

    // Si no está en cache, descargar y cachear
    console.log(`Downloading and caching ${fileType}:`, request.url)

    const networkResponse = await fetch(request, {
      mode: 'no-cors',
      credentials: 'omit',
      cache: 'no-cache'
    })

    // Las opaque responses (no-cors) tienen status 0 y ok: false, pero son válidas para cachear
    if (networkResponse.ok || networkResponse.type === 'opaque') {
      const responseClone = networkResponse.clone()
      await cache.put(request, responseClone)
      console.log(`Successfully cached ${fileType}:`, request.url)
    } else {
      console.error(`Failed to fetch ${fileType} (${networkResponse.status}):`, request.url)
    }

    return networkResponse
  } catch (error) {
    console.error('Error handling media request:', error, 'URL:', request.url)

    // Intentar desde la red sin cache como fallback
    try {
      return await fetch(request, {
        mode: 'no-cors',
        credentials: 'omit',
        cache: 'no-cache'
      })
    } catch (fallbackError) {
      console.error('Fallback fetch also failed:', fallbackError)
      return new Response('Network error', { status: 503 })
    }
  }
}

// Escuchar mensajes del cliente para cachear videos
self.addEventListener('message', async (event) => {
  if (event.data.type === 'CACHE_VIDEOS') {
    const { videos } = event.data
    // Cachear en background enviando progreso por archivo via el port
    await cacheVideosInBackground(videos, event.ports[0])
  }

  if (event.data.type === 'CLEAR_CACHE') {
    await clearVideoCache()
    event.ports[0].postMessage({
      type: 'CACHE_CLEARED'
    })
  }

  if (event.data.type === 'CHECK_CACHE_STATUS') {
    const status = await getCacheStatus()
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      cachedCount: status.cachedCount,
      cachedUrls: status.cachedUrls,
      totalSize: status.totalSize
    })
  }
})

// Cachear archivos en background enviando CACHE_PROGRESS por cada archivo
async function cacheVideosInBackground(videos, port) {
  const cache = await caches.open(CACHE_NAME)
  let successCount = 0

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]
    try {
      const cachedResponse = await cache.match(video.url)
      if (!cachedResponse) {
        const fileType = video.url.match(/\.(mp4|jpg|jpeg|png|gif)$/i)?.[1] || 'unknown'
        console.log(`Pre-caching ${fileType}:`, video.url)

        const response = await fetch(video.url, {
          mode: 'no-cors',
          credentials: 'omit',
          cache: 'no-cache'
        })

        // Las opaque responses (no-cors) tienen status 0 y ok: false, pero son válidas para cachear
        if (response.ok || response.type === 'opaque') {
          await cache.put(video.url, response)
          console.log(`Successfully pre-cached ${fileType}:`, video.url)
          successCount++
        } else {
          console.error(`Failed to pre-cache ${fileType} (${response.status}):`, video.url)
        }
      } else {
        // Ya estaba cacheado, cuenta como éxito
        successCount++
      }
    } catch (error) {
      console.error('Error pre-caching media:', video.url, error)
    }

    // Notificar progreso al cliente después de cada archivo
    port.postMessage({
      type: 'CACHE_PROGRESS',
      current: i + 1,
      total: videos.length
    })
  }

  // Notificar que terminó
  port.postMessage({
    type: 'CACHE_COMPLETE',
    cached: successCount
  })
}

// Limpiar cache de videos
async function clearVideoCache() {
  try {
    await caches.delete(CACHE_NAME)
    console.log('Video cache cleared')
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}

// Obtener estado del cache incluyendo URLs cacheadas
async function getCacheStatus() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()
    return {
      cachedCount: keys.length,
      cachedUrls: keys.map((req) => req.url),
      totalSize: 0
    }
  } catch (error) {
    console.error('Error getting cache status:', error)
    return { cachedCount: 0, cachedUrls: [], totalSize: 0 }
  }
}
