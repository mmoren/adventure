import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { z } from 'zod'
import ollama from 'ollama'

const rl = readline.createInterface({ input: stdin, output: stdout })

export function itemizeList(list: string[] | undefined) {
  if (!list || list.length === 0) {
    return '[None]'
  }
  let s = ''
  for (const item of list) {
    if (item.trim() === '') {
      continue
    }
    s += `- ${item}\n`
  }
  return s
}

export async function getPlayerInput() {
  // Placeholder for getting player input
  return await rl.question('> ')
}

export function displayToPlayer({ text }: { text: string }) {
  console.log(text)
}

export function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x)
}

// For some reason this option is missing in Ollama's TypeScript types
declare module 'ollama' {
  export interface Options {
    min_p?: number
  }
}

export async function callLLM<TSchema extends z.ZodObject>(
  prompt: string,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  console.debug('LLM>', prompt)
  const response = await ollama.generate({
    // model: 'hf.co/mradermacher/Cydonia-24B-v4.3-heretic-i1-GGUF:i1-Q4_K_M',
    model: 'hf.co/LatitudeGames/Wayfarer-12B-GGUF:Q8_0',
    raw: true,
    prompt,
    format: schema.toJSONSchema(),
    keep_alive: '30m',
    options: {
      temperature: 0.85, // 0.8
      min_p: 0.025,
      repeat_penalty: 1.1, // 1.05
    },
  })
  if (!response.done) {
    throw new Error('NPC did not finish generating response')
  }
  console.debug('LLM<', response.response)

  return JSON.parse(response.response)
}

const getTemperatureTool = {
  type: 'function',
  function: {
    name: 'get_temperature',
    description: 'Get the current temperature for a city',
    parameters: {
      type: 'object',
      required: ['city'],
      properties: {
        city: { type: 'string', description: 'The name of the city' },
      },
    },
  },
}

export function zodToFormat<T extends z.ZodType>(
  schema: T
): Omit<z.core.ZodStandardJSONSchemaPayload<T>, '$schema'> {
  const jsonSchema = z.toJSONSchema(schema)
  delete jsonSchema['$schema']
  return jsonSchema
}
