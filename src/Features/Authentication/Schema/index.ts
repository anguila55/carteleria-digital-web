import { z } from 'zod'
import { getTranslation } from '@/Shared/Lib/Translation'

// Login Schema
export const loginSchema = z.object({
  code: z.string().min(1, getTranslation('validations.code.required'))
})

export type LoginFormData = z.infer<typeof loginSchema>
