import { ContentToPlay } from '@/Features/Home/Types/Content.types'

interface MediaPlayerProps {
  contentToPlay: ContentToPlay[]
  currentVideoIndex: number
  playCount: number
  isOnline: boolean
  onVideoEnded: () => void
  onVideoError: () => void
  onUserAction: () => void
}

export const MediaPlayer = ({
  contentToPlay,
  currentVideoIndex,
  playCount,
  isOnline,
  onVideoEnded,
  onVideoError,
  onUserAction
}: MediaPlayerProps) => {
  const currentContent = contentToPlay[currentVideoIndex]

  if (!currentContent) return null

  return (
    <div onClick={onUserAction} className="w-full h-full">
      {currentContent.type === 'video' ? (
        <video
          key={`video-${playCount}`}
          src={currentContent.url}
          className="w-full h-full object-cover"
          onEnded={onVideoEnded}
          onError={() => {
            console.error('[DEBUG] Video error offline:', currentContent.url, !isOnline)
            onVideoError()
          }}
          muted
          autoPlay
          controls={false}
          playsInline
        />
      ) : (
        <img
          key={`image-${playCount}`}
          src={currentContent.url}
          className="w-full h-full object-cover"
          alt="content image"
          onError={() => {
            console.error('[DEBUG] Image error offline:', currentContent.url, !isOnline)
            onVideoError()
          }}
        />
      )}
    </div>
  )
}
