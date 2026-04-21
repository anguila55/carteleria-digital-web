'use server'
import { cookies } from 'next/headers'

import { ActionResponse } from '@/Shared/Types/Action.types'

export interface AuthenticateUser {
  id: number
  name: string
  token: string
}

type AuthenticatedUserResponse = ActionResponse<AuthenticateUser | null>

export const signOutUser = async (): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
  cookieStore.delete('version_token')
}

export const authenticatedUser = async (key: string): Promise<AuthenticatedUserResponse> => {
  const cookieStore = await cookies()
  try {
    const path = new URL(`${process.env.BACKEND_URL}/playlists`)
    path.searchParams.append('key', key)
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
      const playList = await data.json()
      cookieStore.set('auth_token', key, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30 * 6,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      return {
        status: 'success',
        message: 'Authenticated successfully',
        data: playList
      }
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
