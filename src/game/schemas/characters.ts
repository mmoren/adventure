import { z } from 'zod'

export const characterSchema = z.object({
  name: z.string(),
  description: z.string(),
})

export type Character = z.infer<typeof characterSchema>
