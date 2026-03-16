import { getTranslation } from '@/Shared/Lib/Translation/'
import { Button } from '@/Shared/UI'
import { Download, LogOut, Play, RefreshCw, Square } from 'lucide-react'

interface HomeControlsProps {
  loading: boolean
  isRevalidating: boolean
  isOnline: boolean
  hasVideosToCache: boolean
  isCaching: boolean
  cachedCount: number
  cacheIsSupported: boolean
  onPlayStart: () => void
  onPlayStop: () => void
  onCacheVideos: () => void
  onClearCache: () => void
  onRevalidateContent: () => void
  onLogOut: () => void
}

const CLASS_BTN = 'h-12 w-48 mb-4'

export const HomeControls = ({
  loading,
  isRevalidating,
  isOnline,
  hasVideosToCache,
  isCaching,
  cachedCount,
  cacheIsSupported,
  onPlayStart,
  onPlayStop,
  onCacheVideos,
  onClearCache,
  onRevalidateContent,
  onLogOut
}: HomeControlsProps) => {
  return (
    <>
      <p className="mb-8">{getTranslation('views.home.messageToPlay')}</p>

      <Button className={CLASS_BTN} icon={Play} disabled={loading} onClick={onPlayStart}>
        {getTranslation('buttons.play.text')}
      </Button>

      <Button className={CLASS_BTN} icon={Square} disabled={loading} onClick={onPlayStop}>
        {getTranslation('buttons.stop.text')}
      </Button>

      {/* Botones de cache */}
      {hasVideosToCache && cacheIsSupported && (
        <>
          <Button
            className={CLASS_BTN}
            icon={Download}
            variant="outline"
            disabled={loading || isCaching || !isOnline}
            onClick={onCacheVideos}
          >
            {getTranslation('buttons.downloadOffline.text')}
          </Button>

          {cachedCount > 0 && (
            <Button className={CLASS_BTN} variant="outline" disabled={loading || isCaching} onClick={onClearCache}>
              {getTranslation('buttons.clearCache.text')}
            </Button>
          )}
        </>
      )}

      {/* Botón de revalidación manual */}
      <Button
        className={CLASS_BTN}
        icon={RefreshCw}
        variant="outline"
        disabled={loading || isRevalidating || !isOnline}
        onClick={onRevalidateContent}
      >
        {getTranslation('buttons.refreshContent.text')}
      </Button>

      <Button
        variant="secondary"
        className={CLASS_BTN}
        icon={LogOut}
        onClick={onLogOut}
        disabled={loading || !isOnline}
      >
        {getTranslation('buttons.logOut.text')}
      </Button>
    </>
  )
}
