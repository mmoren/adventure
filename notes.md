Loop:

DM opens a scene, with metadata.

```
{
  "narration": "The storm howls as you step into Blackspire Keep...",
  "scene": {
    "location": "Blackspire Keep",
    "region": "North Marches",
    "factionsPresent": ["Iron Church"],
    "tone": ["ominous"],
    "tags": ["abandoned", "forbidden"]
  }
}
```

For each character agent that gets run:

Common knowledge: We do an indexed lookup for the scene, filtered by plausability, such as which region they are from, what factions they belong to.

Provide tool for:
codex_lookup - more detailed than the common knowledge lookup. may contradict rumors. used for specifics. Should also be filtered. Village idiots don't know most things.

```
if (
  allNPCsHaveIntent("yield_turn") &&
  atLeastOneNPCHasIntent("end_scene")
) {
  endScene("conversation_concluded")
}
```

```
if (
  npcIntent === "end_scene" &&
  playerAction === "leave"
) {
  endScene("mutual_disengagement")
}
```


# Algorith

DM Campaign Open

loop {

  DM Scene Open
    - Generate narration and select character to speak first
    
  We need characters to talk to in scene.
    - Generate again to pick characters from list to add to scene?
    May make the characters persistent. If it always picks from the same list, it's a good chance.

    - Ask LLM to run tool to create characters. Inject those characters and save them in DB.
    
    - Allow LLM to make up characters first, then state track them after?
      - Step after scene open can make character tracker entries and add to prompt "NPCs present: inkeeper_1, adventurer_1, adventurer_2" etc
      - 


}