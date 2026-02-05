import { type LocationCategory } from '../schemas/locations'
import { type Character } from '../schemas/characters'

export function distanceBetweenLocations(loc1: any, loc2: any): string {
  return 'nearby'
}

export function findLocationByCategory(category: LocationCategory) {
  // Placeholder for location lookup logic
  return {
    location_id: 'loc_123',
    name: 'Mysterious Forest',
    description: 'A dark and eerie forest filled with unknown dangers.',
  }
}

let characters: Map<string, Character> = new Map()
let locations: Map<string, Location> = new Map()

export function createLocation(location: Location): string {
  const id = `loc_${locations.size + 1}`
  locations.set(id, location)
  return id
}

export function createCharacter(character: Character): string {
  const id = `char_${characters.size + 1}`
  characters.set(id, character)
  return id
}
