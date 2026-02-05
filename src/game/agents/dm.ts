import { z } from 'zod'
import type { SceneContext, Summary } from '../scene'
import type { NpcOutput } from './npc'
import { callLLM } from '../utils'
import { dmBasics, dmInstructOpenCampaign } from '../prompts'

const DmResponseSchema = z.object({
  narration: z.object({
    text: z.string(),
  }),
})

const DmSceneResponseSchema = DmResponseSchema.extend({
  nextScene: z.object({
    presentNpcs: z.array(z.string()),
    setting: z.string(),
  }),
})

export type NextScene = {
  narration: { text: string }
  nextScene: SceneContext
}

export async function runDMCampaignStart({}: {}): Promise<NextScene> {
  const response = await callLLM(
    [
      dmBasics(
        'John',
        'A brave adventurer seeking glory. A rogue type human character, with a sharp dagger, and a knack for getting into trouble.'
      ),
      dmInstructOpenCampaign(),
    ].join('\n'),
    DmSceneResponseSchema
  )

  return {
    narration: response.narration,
    nextScene: {
      setting: response.nextScene.setting,
      isOver: false,
      presentNPCs: [],
      npcOutputs: [],
      activeNPCs: [],
    },
  }
}

export function runDMSceneRound({
  sceneContext,
  playerInput,
  npcOutputs,
}: {
  sceneContext: SceneContext
  playerInput: string
  npcOutputs: NpcOutput[]
}) {
  return {
    text: 'The scene continues...',
  }
}

export type Narration = {
  narration: { text: string }
}

export function runDMSceneOpen({
  sceneContext,
}: {
  sceneContext: SceneContext
}): Narration {
  return {
    narration: { text: 'A new scene begins.' },
  }
}

export function runDMSceneTransition({
  sceneSummary,
}: {
  sceneSummary: Summary
}): NextScene {
  // TODO: Call DM agent to determine next scene based on summary

  // Placeholder for DM scene transition logic
  return {
    narration: { text: 'Our party leaves for the woods...' },
    nextScene: {
      setting: 'The dark and mysterious woods outside of town.',
      isOver: false,
      presentNPCs: [],
      npcOutputs: [],
      activeNPCs: [],
    },
  }
}

export function runDMCampaignEnd(): Narration {
  return {
    narration: { text: 'The adventure concludes. Well done!' },
  }
}
