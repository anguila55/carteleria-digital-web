import { ContentToPlay } from '@/Features/Home/Types/Content.types'

interface MediaPlayerProps {
  contentToPlay: ContentToPlay[]
  currentVideoIndex: number
  isOnline: boolean
  onVideoEnded: () => void
  onUserAction: () => void
}

export const MediaPlayer = ({
  contentToPlay,
  currentVideoIndex,
  isOnline,
  onVideoEnded,
  onUserAction
}: MediaPlayerProps) => {
  const currentContent = contentToPlay[currentVideoIndex]

  if (!currentContent) return null

  return (
    <div onClick={onUserAction} className="w-full h-full">
      {currentContent.type === 'video' ? (
        <video
          key={`video-${currentContent.id}-${currentVideoIndex}`} // Force remount on index change
          src={currentContent.url}
          className="w-full h-full object-cover"
          onEnded={onVideoEnded}
          onError={(e) => {
            console.error('[DEBUG] Video error:', {
              url: currentContent.url,
              offline: !isOnline,
              error: e.currentTarget.error
            })
          }}
          muted
          autoPlay
          controls={false}
          playsInline // Important for mobile/PWA
        />
      ) : (
        <img
          key={`image-${currentContent.id}-${currentVideoIndex}`} // Force remount on index change
          src={currentContent.url}
          className="w-full h-full object-cover"
          alt="content image"
          onError={() => {
            console.error('[DEBUG] Image error:', {
              url: currentContent.url,
              offline: !isOnline
            })
          }}
        />
      )}
    </div>
  )
}
