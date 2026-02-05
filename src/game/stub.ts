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

const startGameSchema = z.object({
  narration: z.object({
    text: z.string(),
  }),
  nextScene: z.object({
    presentNpcs: z.array(z.string()),
    setting: z.object({
      location_id: z.string(),
    }),
  }),
})

const toolsMap: Map<
  string,
  (args?: any) => (string | object) | Promise<string | object>
> = new Map()
toolsMap.set('createCharacter', createCharacter)
toolsMap.set('createLocation', createLocation)
// toolsMap.set('updateCharacterDescription', updateCharacterDescription)
// toolsMap.set('findLocationByCategory', findLocationByCategory)
// toolsMap.set('distanceBetweenLocations', distanceBetweenLocations)

function distanceBetweenLocations(loc1: any, loc2: any): string {
  return 'nearby'
}

function findLocationByCategory(category: LocationCategory) {
  // Placeholder for location lookup logic
  return {
    location_id: 'loc_123',
    name: 'Mysterious Forest',
    description: 'A dark and eerie forest filled with unknown dangers.',
  }
}

let characters: Map<string, Character> = new Map()
let locations: Map<string, Location> = new Map()

const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'createLocation',
      description:
        'Introduce a new location to the game world that can be referenced later',
      parameters: toJSONSchema(locationSchema) as any,
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCharacter',
      description:
        'Introduce a new character to the game world that can be referenced later',
      parameters: toJSONSchema(characterSchema) as any,
    },
  },
]

function createLocation(location: Location): string {
  const id = `loc_${locations.size + 1}`
  locations.set(id, location)
  return `Location ${id} added to codex`
}

function createCharacter(character: Character): string {
  const id = `char_${characters.size + 1}`
  characters.set(id, character)
  return `Character ${id} added to codex`
}

function updateCharacterDescription({
  id,
  name,
  description,
}: {
  id: string
  name: string
  description: string
}): void {
  const character = characters.get(id)
  if (character) {
    character.name = name
    character.description = description
  }
}

function concatenatePrompts(...prompts: string[]): string {
  return prompts.join('\n\n')
}

const resp = await callLLMWithTools(
  concatenatePrompts(
    dmBasics(
      'Jack',
      'A rogue type human character, with a sharp dagger, and a knack for getting into trouble. High charisma, intelligence and agility. Low strength and endurance. A known outlaw with a bad reputation in the major cities.',
    ),
    dmInstructOpenCampaign(),
  ),
  startGameSchema,
)

export async function callLLMWithTools<TSchema extends z.ZodObject>(
  prompt: string,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const messages: Message[] = [{ role: 'user', content: prompt }]

  console.debug('LLM>', prompt)

  for (;;) {
    const stream = await ollama.chat({
      // model: 'hf.co/mradermacher/Cydonia-24B-v4.3-heretic-i1-GGUF:i1-Q4_K_M',
      // model: 'hf.co/LatitudeGames/Wayfarer-12B-GGUF:Q8_0',
      model: 'gpt-oss:latest',
      messages,
      tools,
      stream: true,
      think: true,
      // format: schema.toJSONSchema(),
      keep_alive: '30m',
      options: {
        num_ctx: 131072,
        temperature: 0.85, // 0.8
        min_p: 0.025,
        repeat_penalty: 1.1, // 1.05
      },
    })

    let thinking = ''
    let content = ''
    const toolCalls: any[] = []
    let doneThinking = false

    for await (const chunk of stream) {
      if (chunk.message.thinking) {
        thinking += chunk.message.thinking
        process.stdout.write(chalk.blue(chunk.message.thinking))
      }
      if (chunk.message.content) {
        if (!doneThinking) {
          doneThinking = true
          process.stdout.write('\n')
        }
        content += chunk.message.content
        process.stdout.write(chalk.green(chunk.message.content))
      }
      if (chunk.message.tool_calls?.length) {
        toolCalls.push(...chunk.message.tool_calls)
        for (const tc of chunk.message.tool_calls)
          console.log(
            chalk.yellow(
              tc.function.name +
                '(' +
                JSON.stringify(tc.function.arguments) +
                ')',
            ),
          )
      }
    }

    if (thinking || content || toolCalls.length) {
      messages.push({
        role: 'assistant',
        thinking,
        content,
        tool_calls: toolCalls,
      } as any)
    }

    if (!toolCalls.length) {
      return content as z.infer<TSchema>
    }

    for (const call of toolCalls) {
      const toolFn = toolsMap.get(call.function.name)
      if (toolFn) {
        const result = await toolFn(call.function.arguments)
        messages.push({
          role: 'tool',
          tool_name: call.function.name,
          content: typeof result === 'string' ? result : JSON.stringify(result),
        })
      } else {
        messages.push({
          role: 'tool',
          tool_name: call.function.name,
          content: 'Unknown tool',
        })
      }
    }
  }
}
