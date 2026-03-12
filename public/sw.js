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
  // Temporalmente más permisivo para debug - verificar solo la extensión
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

// Verificar si la URL viene del S3 bucket esperado
function isFromS3Bucket(url) {
  // Lista de dominios de S3 comunes
  const s3Patterns = [
    '.s3.amazonaws.com',
    '.s3.',
    'amazonaws.com',
    's3-'
    // Agregar otros patrones si es necesario
  ]

  return (
    s3Patterns.some((pattern) => url.includes(pattern)) ||
    url.includes('storage') || // Para otros servicios de storage
    url.includes('cdn') || // Para CDNs
    url.includes('media')
  ) // Para servidores de media
}

// Manejar requests de archivos multimedia
async function handleMediaRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)

    // Determinar el tipo de archivo para logging
    const fileType = request.url.match(/\.(mp4|jpg|jpeg|png|gif)$/i)?.[1] || 'unknown'

    if (cachedResponse) {
      console.log(`Serving ${fileType} from cache:`, request.url)
      return cachedResponse
    }

    // Si no está en cache, descargar y cachear
    console.log(`Downloading and caching ${fileType}:`, request.url)

    const networkResponse = await fetch(request, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache'
    })

    if (networkResponse.ok) {
      // Verificar que la respuesta sea válida para el tipo de archivo
      const contentType = networkResponse.headers.get('content-type') || ''
      const isValidContent =
        (fileType === 'mp4' && contentType.includes('video')) ||
        (['jpg', 'jpeg', 'png', 'gif'].includes(fileType) && contentType.includes('image'))

      if (isValidContent || contentType.includes('application/octet-stream')) {
        const responseClone = networkResponse.clone()
        await cache.put(request, responseClone)
        console.log(`Successfully cached ${fileType}:`, request.url)
      } else {
        console.warn(`Invalid content-type ${contentType} for ${fileType}:`, request.url)
      }
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
    await cacheVideosInBackground(videos)

    // Notificar al cliente que el cache está listo
    event.ports[0].postMessage({
      type: 'CACHE_COMPLETE',
      cached: videos.length
    })
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
      totalSize: status.totalSize
    })
  }
})

// Cachear videos en background
async function cacheVideosInBackground(videos) {
  const cache = await caches.open(CACHE_NAME)

  for (const video of videos) {
    try {
      const cachedResponse = await cache.match(video.url)
      if (!cachedResponse) {
        const fileType = video.url.match(/\.(mp4|jpg|jpeg|png|gif)$/i)?.[1] || 'unknown'
        console.log(`Pre-caching ${fileType}:`, video.url)

        const response = await fetch(video.url, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-cache'
        })

        if (response.ok) {
          const contentType = response.headers.get('content-type') || ''
          const isValidContent =
            (fileType === 'mp4' && contentType.includes('video')) ||
            (['jpg', 'jpeg', 'png', 'gif'].includes(fileType) && contentType.includes('image'))

          if (isValidContent || contentType.includes('application/octet-stream')) {
            await cache.put(video.url, response)
            console.log(`Successfully pre-cached ${fileType}:`, video.url)
          } else {
            console.warn(`Invalid content-type ${contentType} for ${fileType}:`, video.url)
          }
        } else {
          console.error(`Failed to pre-cache ${fileType} (${response.status}):`, video.url)
        }
      }
    } catch (error) {
      console.error('Error pre-caching media:', video.url, error)
    }
  }
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

// Obtener estado del cache
async function getCacheStatus() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const keys = await cache.keys()
    return {
      cachedCount: keys.length,
      totalSize: 0 // El API no permite calcular fácilmente el tamaño
    }
  } catch (error) {
    console.error('Error getting cache status:', error)
    return { cachedCount: 0, totalSize: 0 }
  }
}
