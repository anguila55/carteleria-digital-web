import { ActionResponse } from '@/Shared/Types/Action.types'

export interface ContentToPlay {
  id: number
  url: string
  type: 'video' | 'image'
  duration: number | null
}

export type ContentResponse = ActionResponse<ContentToPlay[] | null>

export interface ContentPlayer {
  id: number
  key: string
  name: string
}

export interface Playlist {
  id: number
  name: string
  start_date: Date
  end_date: Date
  start_time: string
  end_time: string
  priority: number
  media_files: MediaFile[]
}

export interface MediaFile {
  id: number
  name: string
  path: string
  orientation: string
  start_date: Date
  end_date: Date
  duration: number | null
}

export interface ContentFetchResponse {
  status: 'success' | 'error'
  data: {
    content_player: ContentPlayer
    playlists: Playlist[]
  }
}
