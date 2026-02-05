import { z } from 'zod'

export const locationCategorySchema = z.enum([
  'forest',
  'mountain',
  'village',
  'tavern',
  'castle',
  'cave',
  'swamp',
  'wastelands',
])

export type LocationCategory = z.infer<typeof locationCategorySchema>

export const locationSchema = z.object({
  name: z.string(),
  category: locationCategorySchema,
  description: z.string(),
})

export type Location = z.infer<typeof locationSchema>
