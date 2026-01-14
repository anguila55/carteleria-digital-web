import { TranslationStructure, TranslationPaths } from './translation.types'
import translationsData from './translation.json'

// Asegura que el JSON coincide con el tipo
const typedTranslations: TranslationStructure = translationsData as unknown as TranslationStructure

/**
 * Función genérica para acceder a objetos con notación de puntos
 */
// Ejemplo: getValueByPath(obj, 'a.b.c', defaultValue)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValueByPath<T extends object, P extends string>(obj: T, path: P, defaultValue?: any): any {
  if (!obj || typeof obj !== 'object' || !path || typeof path !== 'string') {
    return defaultValue
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split('.').reduce((acc: any, key: string) => {
    return acc && acc[key] !== undefined ? acc[key] : defaultValue
  }, obj)
}

/**
 * Función específica para traducciones con autocompletado
 */
export function getTranslation<P extends TranslationPaths>(path: P, defaultValue?: string): string {
  return getValueByPath(typedTranslations, path, defaultValue)
}

// Uso opcional: exportar todas las traducciones tipadas
export const allTranslations: TranslationStructure = typedTranslations
