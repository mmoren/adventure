import type { Message, Tool } from 'ollama'
import ollama from 'ollama'
import chalk from 'chalk'
import { toJSONSchema, z } from 'zod'
import { locationSchema } from './schemas/locations'
import { characterSchema } from './schemas/characters'
import { createCharacter, createLocation } from './tools/codex'
import { zodToFormat } from './utils'

const toolsMap: Map<
  string,
  (args?: any) => (string | object) | Promise<string | object>
> = new Map()
toolsMap.set('createCharacter', createCharacter)
toolsMap.set('createLocation', createLocation)

export const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'createLocation',
      description:
        "Introduce a new location to the game world that can be referenced later. Returns the new character's ID",
      parameters: toJSONSchema(locationSchema) as any,
    },
  },
  {
    type: 'function',
    function: {
      name: 'createCharacter',
      description:
        "Introduce a new character to the game world that can be referenced later. Returns the new locations's ID",
      parameters: toJSONSchema(characterSchema) as any,
    },
  },
]

export async function callLLMWithTools<TSchema extends z.ZodObject>(
  prompt: string,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const messages: Message[] = [{ role: 'user', content: prompt }]

  console.debug(prompt)

  console.log(chalk.red(JSON.stringify(zodToFormat(schema), null, 4)))

  for (;;) {
    const stream = await ollama.chat({
      // model: 'hf.co/mradermacher/Cydonia-24B-v4.3-heretic-i1-GGUF:i1-Q4_K_M',
      // model: 'hf.co/LatitudeGames/Wayfarer-12B-GGUF:Q8_0',
      model: 'gpt-oss:latest',
      messages,
      tools,
      stream: true,
      think: 'low',
      format: zodToFormat(schema),
      keep_alive: '30m',
      options: {
        num_ctx: 131072,
        //temperature: 0.85, // 0.8
        //min_p: 0.025,
        //repeat_penalty: 1.1, // 1.05
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
                ')'
            )
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
