'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// UI
import { Button } from '@/Shared/UI'
import { LogOut, Play, Square } from 'lucide-react'

// Translation
import { getTranslation } from '@/Shared/Lib/Translation/'

// actions
import { signOutUser } from '@/Features/Authentication/Actions'

// classes
const CLASS_BTN = 'h-12 w-48 mb-4'

// interface
import { ContentResponse, ContentToPlay } from '@/Features/Home/Types/Content.types'
export interface HomeViewProps {
  content: ContentResponse
}
const HomeView = (props: HomeViewProps) => {
  /*********** props **********/
  const { content } = props

  /*********** hooks **********/
  const router = useRouter()

  /*********** states **********/
  const [loading, setLoading] = useState<boolean>(true)
  const [contentToPlay, setContentToPlay] = useState<ContentToPlay[]>([])
  const [hideCursor, setHideCursor] = useState<boolean>(false)
  const [showContents, setShowContents] = useState<boolean>(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0)

  /*********** functions **********/
  const handleLogOut = async () => {
    await signOutUser()
    router.push('/')
  }

  const showMessageError = (data: ContentResponse) => {
    if (data.status === 'error') {
      toast.error(data.message)
    }
  }

  const showMessageEmpty = (data: ContentResponse) => {
    if (data.status === 'success' && data.data && data.data.length === 0) {
      toast.error(getTranslation('alerts.home.fetchContentEmpty'))
    }
  }

  const prepareContent = (response: ContentResponse) => {
    // lógica para preparar el contenido si es necesario
    if (response.status === 'success' && response.data) {
      setContentToPlay(response.data)
    }
  }

  const startVideoPlayback = () => {
    setShowContents(true)
    setHideCursor(true)
  }

  const playNextVideo = () => {
    if (contentToPlay.length === 0) return

    const nextIndex = (currentVideoIndex + 1) % contentToPlay.length
    setCurrentVideoIndex(nextIndex)
    // No cambiar isPlaying para que continue la reproducción automática
  }

  const handleVideoEnded = () => {
    playNextVideo()
  }

  const stopVideoPlayback = () => {}

  const handleActionUser = () => {
    setShowContents(false)
    setHideCursor(false)
  }

  /*********** life cycle **********/
  useEffect(() => {
    if (content) {
      // mostrar error si existe
      showMessageError(content)
      // mostrar mensaje si no hay contenido
      showMessageEmpty(content)
      // preparar contenido
      prepareContent(content)
      // finalizar loading
      setLoading(false)
    }
  }, [content])

  useEffect(() => {
    if (contentToPlay.length > 0) {
      if (contentToPlay[currentVideoIndex].type === 'image') {
        setTimeout(() => {
          playNextVideo()
        }, 5000) // Mostrar la imagen por 5 segundos
      }
    }
  }, [currentVideoIndex])

  /*********** render **********/

  return (
    <div className={`h-dvh relative flex items-center justify-center ${hideCursor ? 'cursor-none' : ''}`}>
      {showContents && contentToPlay.length > 0 ? (
        <div onMouseMove={handleActionUser} onClick={handleActionUser} className="w-full h-full">
          {contentToPlay[currentVideoIndex]?.type === 'video' ? (
            <video
              // ref={setVideoElement}
              src={contentToPlay[currentVideoIndex]?.url}
              className="w-full h-full object-cover"
              onEnded={handleVideoEnded}
              muted
              autoPlay
              controls={false}
            />
          ) : (
            <img
              src={contentToPlay[currentVideoIndex]?.url}
              className="w-full h-full object-cover"
              alt="content image"
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Button className={CLASS_BTN} icon={Play} disabled={loading} onClick={startVideoPlayback}>
            {getTranslation('buttons.play.text')}
          </Button>
          <Button className={CLASS_BTN} icon={Square} disabled={loading} onClick={stopVideoPlayback}>
            {getTranslation('buttons.stop.text')}
          </Button>
          <Button variant="secondary" className={CLASS_BTN} icon={LogOut} onClick={handleLogOut} disabled={loading}>
            {getTranslation('buttons.logOut.text')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default HomeView
