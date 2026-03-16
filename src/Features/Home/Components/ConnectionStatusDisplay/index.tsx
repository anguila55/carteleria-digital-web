import { CheckCircle, Wifi, WifiOff } from 'lucide-react'

interface ConnectionStatusDisplayProps {
  isOnline: boolean
  cachedCount: number
  isCaching: boolean
  cachingProgress: {
    current: number
    total: number
  }
  isOfflineReady: boolean
}

export const ConnectionStatusDisplay = ({
  isOnline,
  cachedCount,
  isCaching,
  cachingProgress,
  isOfflineReady
}: ConnectionStatusDisplayProps) => {
  return (
    <div className="mb-1 p-4 rounded-lg text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
        <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {cachedCount > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>{cachedCount} videos cached for offline</span>
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

      {/* Offline status indicator */}
      {!isOnline && isOfflineReady && (
        <div className="mt-4 p-2 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">📱 Offline Mode Active - Playing from cache ({cachedCount} videos)</p>
        </div>
      )}
    </div>
  )
}
