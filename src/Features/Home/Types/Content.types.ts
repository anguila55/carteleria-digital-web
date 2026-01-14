import { ActionResponse } from '@/Shared/Types/Action.types'

export interface ContentToPlay {
  id: number
  url: string
  type: 'video' | 'image'
}

export type ContentResponse = ActionResponse<ContentToPlay[] | null>
