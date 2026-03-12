'use server'
import { cookies } from 'next/headers'

import { ContentFetchResponse, ContentResponse, ContentToPlay } from '@/Features/Home/Types/Content.types'

export const signOutUser = async (): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}

const prepareTypeContent = (url: string): 'video' | 'image' => {
  const extensionValid = ['gif', 'jpg', 'png', 'jpeg', 'mp4']
  const type = url.split('.').pop() || ''
  if (extensionValid.includes(type)) {
    if (type === 'mp4') {
      return 'video'
    } else {
      return 'image'
    }
  } else {
    throw new Error('Invalid file type')
  }
}

const prepareDataContent = (data: ContentFetchResponse): ContentResponse => {
  const contentToPlay: ContentToPlay[] = data.data.playlists.flatMap((playlist) =>
    playlist.media_files.map((media) => ({
      id: media.id,
      url: `${process.env.S3_BUCKET_URL}/${media.path}`,
      type: prepareTypeContent(media.path),
      duration: media.duration
    }))
  )

  return {
    status: 'success',
    message: 'Content fetched successfully',
    data: contentToPlay
  }
}

export const getDataContent = async (): Promise<ContentResponse> => {
  const cookieStore = await cookies()
  try {
    const authToken = cookieStore.get('auth_token')?.value || ''

    const path = new URL(`${process.env.BACKEND_URL}/playlists`)
    path.searchParams.append('key', authToken)
    const data = await fetch(path.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CONNECT_KEY || ''
      },
      cache: 'force-cache',
      next: { revalidate: parseInt(process.env.NEXT_PUBLIC_TIMEOUT_FETCH || '7000') }
    })

    if (data.status !== 200) {
      if (data.status === 404) {
        await signOutUser()
        return {
          status: 'error',
          message: 'Invalid code',
          data: null
        }
      } else {
        return {
          status: 'error',
          message: 'An error occurred during authentication',
          data: null
        }
      }
    } else {
      const playList: ContentFetchResponse = await data.json()
      const response = prepareDataContent(playList)
      return response
    }
  } catch (error) {
    console.error('Error during authentication:', error)
    return {
      status: 'error',
      message: 'An error occurred during authentication',
      data: null
    }
  }
}
