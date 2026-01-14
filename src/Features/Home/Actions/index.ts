'use server'
import { cookies } from 'next/headers'

import { ContentResponse } from '@/Features/Home/Types/Content.types'

export const signOutUser = async (): Promise<void> => {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}

export const getDataContent = async (): Promise<ContentResponse> => {
  const cookieStore = await cookies()
  try {
    await new Promise((resolve) => setTimeout(resolve, 3000))
    const authToken = cookieStore.get('auth_token')?.value || ''

    return {
      status: 'success',
      message: `Content fetched successfully ${authToken}`,
      data: [
        {
          id: 1,
          url: 'https://btbox-2023.s3.amazonaws.com/236711_small.mp4',
          type: 'video'
        },
        {
          id: 2,
          url: 'https://btbox-2023.s3.amazonaws.com/293788_small.mp4',
          type: 'video'
        },
        {
          id: 3,
          url: 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_656/b_white/f_auto/q_auto/store/software/switch/70070000030771/348449056f8d3665c946218d0fd76d80431afaa272a9984fc05bed46e895379c',
          type: 'image'
        },
        {
          id: 5,
          url: 'https://btbox-2023.s3.amazonaws.com/WhatsApp%20Video%202025-11-13%20at%2014.55.09.mp4',
          type: 'video'
        }
      ]
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
