export interface MetaData {
  title: string
  description: string
}

export interface ViewStructure {
  title: string
  subtitle?: string
  description?: string
  metaData: MetaData
}

export interface NotFound extends ViewStructure {
  goHome: string
}
