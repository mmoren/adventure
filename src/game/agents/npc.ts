import { z } from 'zod'
import type { SceneContext } from '../scene'
import { callLLM, itemizeList } from '../utils'

const IntentSchema = z.enum(['continue_dialogue', 'yield_turn', 'end_scene'])

const NpcOutputSchema = z.object({
  dialogue: z.string(),
  intent: IntentSchema,
})

export type NpcOutput = z.infer<typeof NpcOutputSchema>

export type NpcContext = {
  npc: string
  sceneSummary: string
  commonKnowledge: string[]
  memories: string[]
  playerInput: string
  recentStatements: string[]
}

export function getNpcPersonality(npc: string): string {
  // Placeholder for retrieving NPC personality description
  return `Your name is ${npc}. You are a friendly and helpful character.`
}

export function buildNpcContext(
  npc: string,
  sceneContext: SceneContext,
  playerInput: string
): NpcContext {
  return {
    npc,
    sceneSummary: sceneContext.setting,
    commonKnowledge: [],
    memories: [],
    playerInput,
    recentStatements: sceneContext.npcOutputs // TODO: These should be summarized, not verbatim!
      .filter((output) => output.npc === npc)
      .map((output) => output.output.dialogue)
      .slice(-3),
  }
}

export async function runNpc(context: NpcContext): Promise<NpcOutput> {
  return await callNpcAgent({
    personality: getNpcPersonality(context.npc),
    npcContext: context,
  })
}

function generateNpcPrompt(
  personality: string,
  npcContext: NpcContext
): string {
  return `
You are an NPC in a fantasy adventure game. Your behavior is guided by your personality, memories, and the current context of the scene.

# Instructions
Based on the context, provide your dialogue response and intent code as per the required format.

The intent for your response must come from the following options:
- continue_dialogue: Continue the conversation with the player or other NPCs.
- yield_turn: Become inactive for this scene, you forfeit your following turns until addressed again.
- end_scene: Indicates that you think this scene is done. (The DM will have the final say)

# Scene
Now for the current game scene.

## Personality
${personality}

## Context
The following is the context for your responses:

### Scene Summary
${npcContext.sceneSummary}

### Common Knowledge
${itemizeList(npcContext.commonKnowledge)}

### Your Memories
${itemizeList(npcContext.memories)}

### Player Input
${npcContext.playerInput}

### Recent Statements
${itemizeList(npcContext.recentStatements)}

### Your Response
`
}

type NpcAgentParams = {
  personality: string
  npcContext: NpcContext
}

async function callNpcAgent({
  personality,
  npcContext,
}: NpcAgentParams): Promise<NpcOutput> {
  const prompt = generateNpcPrompt(personality, npcContext)
  return await callLLM(prompt, NpcOutputSchema)
}
