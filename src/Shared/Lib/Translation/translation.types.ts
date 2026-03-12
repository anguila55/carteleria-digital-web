import { ButtonStructure } from './Types/Button.types'
import { InputStructure } from './Types/Input.types'
import { ViewStructure } from './Types/Page.types'

interface HomeView extends ViewStructure {
  messageToPlay: string
}

export interface TranslationStructure {
  views: {
    auth: {
      signIn: ViewStructure
    }
    home: HomeView
  }
  buttons: {
    SignIn: ButtonStructure
    play: ButtonStructure
    stop: ButtonStructure
    logOut: ButtonStructure
    downloadOffline: ButtonStructure
    clearCache: ButtonStructure
    refreshContent: ButtonStructure
  }
  inputs: {
    code: InputStructure
  }
  labels: {
    close: string
  }
  alerts: {
    auth: {
      signInSuccess: string
      signInError: string
    }
    home: {
      fetchContentEmpty: string
    }
  }
  validations: {
    code: {
      required: string
    }
  }
}

// Tipo para generar todas las rutas posibles
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>]
    }[Extract<keyof T, string>]

type Join<T extends string[]> = T extends []
  ? never
  : T extends [infer F]
    ? F
    : T extends [infer F, ...infer R]
      ? F extends string
        ? R extends string[]
          ? `${F}.${Join<R>}`
          : never
        : never
      : string

export type TranslationPaths = Join<PathsToStringProps<TranslationStructure>>
