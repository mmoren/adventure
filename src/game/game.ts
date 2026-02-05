import {
  runDMCampaignEnd,
  runDMCampaignStart,
  runDMSceneOpen,
  runDMSceneTransition,
} from './agents/dm'
import {
  dumpSceneContext,
  runSceneRound,
  summarizeScene,
  type SceneContext,
  type Summary,
} from './scene'
import { displayToPlayer } from './utils'

async function startGame() {
  // loadWorldData()
  // loadStoryArcs()
  // loadPlayerCharacter()

  // DM opens the campaign
  const opening = await runDMCampaignStart({
    // worldState,
    // storyArcs,
  })

  displayToPlayer(opening.narration)

  await gameLoop(opening.nextScene)
}

async function gameLoop(initialScene: SceneContext) {
  let currentScene = initialScene

  while (!gameIsOver()) {
    currentScene = await runScene({
      sceneContext: currentScene,
      firstScene: currentScene === initialScene,
    })
  }

  runDMCampaignEnd()
}

function initializeScene(scene: SceneContext) {
  // Placeholder for scene initialization logic
  scene.isOver = false
}

async function runScene({
  firstScene,
  sceneContext,
}: {
  sceneContext: SceneContext
  firstScene: boolean
}): Promise<SceneContext> {
  // Scene setup
  initializeScene(sceneContext)

  if (!firstScene) {
    // Scene opening narration (DM)
    const opening = runDMSceneOpen({
      sceneContext,
    })
    displayToPlayer(opening.narration)
  }

  // Main scene loop
  while (!sceneContext.isOver) {
    await runSceneRound({ sceneContext })
    dumpSceneContext(sceneContext)
  }

  // Scene teardown
  const summary = summarizeScene(sceneContext)
  commitSceneResults(summary)

  // Ask DM what comes next
  const next = runDMSceneTransition({
    sceneSummary: summary,
  })

  displayToPlayer(next.narration)

  return next.nextScene
}

function commitSceneResults(summary: Summary) {
  // Placeholder for committing scene results to game state
  console.log('Committing scene results:', summary)
}

let once = false
function gameIsOver() {
  if (!once) {
    once = true
    return false
  }
  return true
}

startGame()
