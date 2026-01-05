import { ViewStructure } from './Types/Page.types'
import { ButtonStructure } from './Types/Button.types'
import { InputStructure } from './Types/Input.types'

export interface TranslationStructure {
  views: {
    auth: {
      signIn: ViewStructure
    }
  }
  buttons: {
    SignIn: ButtonStructure
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
