import { type HandState } from './hand'
import { canWin, calculateShanten } from './shanten'
import { TILES, type Tile, tileIndex, tilesToCounts } from './tiles'

export interface WaitResult {
  winningTiles: Tile[]
  improvementTiles: Tile[]
  currentShanten: number
}

export function getWinningTiles(hand: HandState): Tile[] {
  const allCounts = tilesToCounts([
    ...hand.concealed,
    ...hand.melds.flatMap((meld) => meld.tiles),
  ])

  return TILES.filter((tile) => {
    const index = tileIndex(tile)
    if (allCounts[index] >= 4) return false
    return canWin({ ...hand, concealed: [...hand.concealed, tile] })
  })
}

export function getImprovementTiles(hand: HandState): Tile[] {
  const currentShanten = calculateShanten(hand).shanten
  const allCounts = tilesToCounts([
    ...hand.concealed,
    ...hand.melds.flatMap((meld) => meld.tiles),
  ])

  return TILES.filter((tile) => {
    const index = tileIndex(tile)
    if (allCounts[index] >= 4) return false
    const next = calculateShanten({ ...hand, concealed: [...hand.concealed, tile] }).shanten
    return next < currentShanten
  })
}

export function analyzeWaits(hand: HandState): WaitResult {
  return {
    winningTiles: getWinningTiles(hand),
    improvementTiles: getImprovementTiles(hand),
    currentShanten: calculateShanten(hand).shanten,
  }
}
