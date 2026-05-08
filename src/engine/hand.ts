import { TILES, type Tile, countsToTiles, tileIndex, tilesToCounts } from './tiles'

export type MeldType = 'chi' | 'pon' | 'kan'

export interface Meld {
  id: string
  type: MeldType
  tiles: Tile[]
}

export interface HandState {
  concealed: Tile[]
  melds: Meld[]
}

export interface HandValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function createEmptyHand(): HandState {
  return { concealed: [], melds: [] }
}

export function countAllTiles(hand: HandState): number[] {
  const counts = tilesToCounts(hand.concealed)
  for (const meld of hand.melds) {
    for (const tile of meld.tiles) {
      counts[tileIndex(tile)] += 1
    }
  }
  return counts
}

export function countConcealedTiles(hand: HandState): number[] {
  return tilesToCounts(hand.concealed)
}

export function completedMeldCount(hand: HandState): number {
  return hand.melds.length
}

export function addTile(hand: HandState, tile: Tile): HandState {
  return { ...hand, concealed: [...hand.concealed, tile] }
}

export function removeTileAt(hand: HandState, index: number): HandState {
  return {
    ...hand,
    concealed: hand.concealed.filter((_, tileIndexValue) => tileIndexValue !== index),
  }
}

export function removeOneTile(hand: HandState, tile: Tile): HandState {
  const index = hand.concealed.indexOf(tile)
  if (index < 0) return hand
  return removeTileAt(hand, index)
}

export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => tileIndex(a) - tileIndex(b))
}

export function concealedCountsToTiles(hand: HandState): Tile[] {
  return countsToTiles(countConcealedTiles(hand))
}

export function validateHand(hand: HandState): HandValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const counts = countAllTiles(hand)

  counts.forEach((count, index) => {
    if (count > 4) {
      errors.push(`${TILES[index]} 超过 4 张`)
    }
  })

  if (hand.melds.length > 4) {
    errors.push('鸣牌组数不能超过 4 组')
  }

  for (const meld of hand.melds) {
    if ((meld.type === 'chi' || meld.type === 'pon') && meld.tiles.length !== 3) {
      errors.push('吃/碰必须是 3 张')
    }
    if (meld.type === 'kan' && meld.tiles.length !== 4) {
      errors.push('杠必须是 4 张')
    }
  }

  const totalTileCount =
    hand.concealed.length + hand.melds.reduce((total, meld) => total + meld.tiles.length, 0)
  if (totalTileCount > 18) {
    warnings.push('当前张数较多，请确认是否把补杠/暗杠重复录入')
  }

  return { isValid: errors.length === 0, errors, warnings }
}
