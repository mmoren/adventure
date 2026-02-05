import { dmBasics, dmInstructOpenCampaign } from './prompts'
import { toJSONSchema, z } from 'zod'
import {
  locationSchema,
  type Location,
  type LocationCategory,
} from './schemas/locations'
import { characterSchema, type Character } from './schemas/characters'
import ollama, { type Message, type Tool } from 'ollama'
import chalk from 'chalk'
import { callLLMWithTools } from './llm'

const startGameSchema = z.object({
  narration: z.string(),
  nextScene: z.object({
    presentNpcIds: z.array(z.string()),
    locationId: z.string(),
  }),
})

function concatenatePrompts(...prompts: string[]): string {
  return prompts.join('\n\n')
}

const resp = await callLLMWithTools(
  concatenatePrompts(
    dmBasics(
      'Jack',
      'A rogue type human character, with a sharp dagger, and a knack for getting into trouble. High charisma, intelligence and agility. Low strength and endurance. A known outlaw with a bad reputation in the major cities.'
    ),
    dmInstructOpenCampaign()
  ),
  startGameSchema
)
