export interface ActionResponse<T> {
  status: 'success' | 'error'
  message: string
  data: T
}
