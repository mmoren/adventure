import { runDMSceneRound as runDMPostSceneRound } from './agents/dm'
import { buildNpcContext, runNpc, type NpcOutput } from './agents/npc'
import { assertNever, displayToPlayer, getPlayerInput } from './utils'

export type SceneContext = {
  setting: string
  isOver: boolean
  presentNPCs: string[]
  activeNPCs: string[]

  exitTriggeredByPlayer?: boolean
  exitTriggeredByNPCIntent?: boolean
}

export function dumpSceneContext(sceneContext: SceneContext) {
  console.log('SceneContext Dump:')
  console.log('isOver:', sceneContext.isOver)
  console.log('presentNPCs:', sceneContext.presentNPCs)
  console.log('activeNPCs:', sceneContext.activeNPCs)
  // console.log(
  //   'npcOutputs:',
  //   sceneContext.npcOutputs.map((o) => ({
  //     npc: o.npc,
  //     dialogue: o.output.dialogue,
  //     intent: o.output.intent,
  //   }))
  // )
  console.log('exitTriggeredByPlayer:', sceneContext.exitTriggeredByPlayer)
  console.log(
    'exitTriggeredByNPCIntent:',
    sceneContext.exitTriggeredByNPCIntent
  )
}

export function registerNPCOutputInSceneContext(
  sceneContext: SceneContext,
  npc: any,
  output: NpcOutput
) {
  // Placeholder for registering NPC output in scene context
  console.log(`Registering NPC ${npc} output:`, output)

  // Only remember the last 5 outputs. These should also be summarized, not remembered verbatim!
  // TODO: Add summarization step here and add to scene summary

  switch (output.intent) {
    case 'yield_turn':
      // Mark NPC as inactive for this scene
      sceneContext.activeNPCs = sceneContext.presentNPCs.filter(
        (activeNpc) => activeNpc !== npc
      )
      break
    case 'end_scene':
      sceneContext.exitTriggeredByNPCIntent = true
      break
    case 'continue_dialogue':
      // No special action needed
      break
    default:
      assertNever(output.intent)
  }
}

export async function runSceneRound({
  sceneContext,
}: {
  sceneContext: SceneContext
}) {
  // 1. Get player input
  const playerInput = await getPlayerInput()

  console.info('Player says:', playerInput)

  // 2. Determine which NPCs may respond
  const responders = selectResponders(sceneContext, playerInput)

  // Outputs for this round
  const npcOutputs: NpcOutput[] = []

  console.info('Responders this round:', responders)

  // 3. Run NPC agents (sequential for now)
  for (const npc of responders) {
    const npcContext = buildNpcContext(npc, sceneContext, playerInput)
    const output = await runNpc(npcContext)
    npcOutputs.push(output)

    console.info('NPC', npc, 'responds:', output)

    registerNPCOutputInSceneContext(sceneContext, npc, output)
  }

  // 4. DM narrates the outcome of this round
  const narration = runDMPostSceneRound({
    sceneContext,
    playerInput,
    npcOutputs,
  })

  displayToPlayer(narration)

  // 5. Update scene state
  updateSceneState(sceneContext, playerInput, npcOutputs)

  // 6. Check exit conditions
  sceneContext.isOver = checkSceneEnd(sceneContext)
}

function selectResponders(
  sceneContext: SceneContext,
  playerInput: any
): string[] {
  return ['Inkeeper']
  //return sceneContext.presentNPCs.filter(
  //(npc) => npcIsAddressed(npc, playerInput)
  // || npcHasStrongReaction(npc, playerInput, sceneContext)
  //)
}

function checkSceneEnd(sceneContext: SceneContext) {
  if (sceneContext.exitTriggeredByPlayer) return true
  if (sceneContext.exitTriggeredByNPCIntent) return true

  return false
}

export function summarizeScene(sceneContext: SceneContext): Summary {
  // Placeholder for scene summarization logic
  return {
    keyEvents: [],
  }
}

export function updateSceneState(
  sceneContext: SceneContext,
  playerInput: any,
  npcOutputs: any
) {
  // Placeholder for updating scene state based on inputs and outputss
  console.log('Updating scene state')
}

export type Summary = {
  keyEvents: string[]
}
