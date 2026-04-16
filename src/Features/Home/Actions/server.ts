'use server'
import { cookies } from 'next/headers'

import {
  CompareResponse,
  ContentFetchResponse,
  ContentResponse,
  ContentToPlay
} from '@/Features/Home/Types/Content.types'

const signOutUser = async (): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
  cookieStore.delete('version_token')
}

const prepareTypeContent = (url: string): 'video' | 'image' => {
  const extensionValid = ['gif', 'jpg', 'png', 'jpeg', 'mp4']
  const type = url.split('.').pop()?.toLowerCase() || ''

  if (extensionValid.includes(type)) {
    if (type === 'mp4') {
      return 'video'
    } else {
      return 'image'
    }
  } else {
    console.error('❌ [DEBUG] Invalid file type:', type, 'for URL:', url)
    throw new Error(`Invalid file type: ${type}`)
  }
}

const prepareDataContent = (data: ContentFetchResponse): ContentResponse => {
  const contentToPlay: ContentToPlay[] = []

  data.data.playlists.forEach((playlist) => {
    playlist.media_files.forEach((media) => {
      try {
        const type = prepareTypeContent(media.path)
        const contentItem = {
          id: media.id,
          url: `${process.env.S3_BUCKET_URL}/${media.path}`,
          type,
          duration: media.duration
        }

        contentToPlay.push(contentItem)
      } catch (error) {
        console.error('❌ [DEBUG] Error processing media:', {
          id: media.id,
          name: media.name,
          path: media.path,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })
  })

  return {
    status: 'success',
    message: 'Content fetched successfully',
    data: contentToPlay
  }
}

const getDataContent = async (): Promise<ContentResponse> => {
  const cookieStore = await cookies()
  try {
    const authToken = cookieStore.get('auth_token')?.value || ''

    const path = new URL(`${process.env.BACKEND_URL}/playlists`)
    path.searchParams.append('key', authToken)
    path.searchParams.append('_t', Date.now().toString()) // Cache buster

    const data = await fetch(path.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CONNECT_KEY || '',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      },
      cache: 'no-cache'
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

const getFlagToCompare = async (): Promise<CompareResponse> => {
  const cookieStore = await cookies()
  try {
    const authToken = cookieStore.get('auth_token')?.value || ''
    const versionToken = cookieStore.get('version_token')?.value || ''

    const path = new URL(`${process.env.BACKEND_URL}/check-version`)
    path.searchParams.append('key', authToken)
    const data = await fetch(path.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CONNECT_KEY || ''
      },
      cache: 'no-cache'
    })

    if (data.status !== 200) {
      if (data.status === 404) {
        await signOutUser()
        return {
          status: 'error',
          message: 'Invalid code',
          data: false
        }
      } else {
        return {
          status: 'error',
          message: 'An error occurred during authentication',
          data: false
        }
      }
    } else {
      const response: { version: string } = await data.json()
      if (versionToken === '') {
        cookieStore.set('version_token', response.version, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 * 6 })
        return {
          status: 'success',
          message: 'Version token set successfully',
          data: false
        }
      } else {
        const isDifferent = versionToken !== response.version
        if (isDifferent) {
          cookieStore.set('version_token', response.version, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 30 * 6
          })
        }
        return {
          status: 'success',
          message: 'Version compared successfully',
          data: isDifferent
        }
      }
    }
  } catch (error) {
    console.error('Error during authentication:', error)
    return {
      status: 'error',
      message: 'An error occurred during authentication',
      data: false
    }
  }
}

export { getDataContent, getFlagToCompare, signOutUser }
