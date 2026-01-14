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
}

export const authenticatedUser = async (code: string): Promise<AuthenticatedUserResponse> => {
  const cookieStore = await cookies()
  try {
    await new Promise((resolve) => setTimeout(resolve, 3000))
    if (code === '1234') {
      cookieStore.set('auth_token', 'some-token-1234', { httpOnly: true, path: '/' })
      return {
        status: 'success',
        message: 'Authenticated successfully',
        data: { id: 1, name: 'John Doe', token: 'some-token-1234' }
      }
    } else {
      return {
        status: 'error',
        message: 'Invalid code',
        data: null
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
