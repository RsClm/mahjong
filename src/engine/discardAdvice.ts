import { removeOneTile, sortTiles, type HandState } from './hand'
import { calculateShanten, canWin } from './shanten'
import { TILES, type Tile, tileIndex, tilesToCounts } from './tiles'

export interface DiscardAdvice {
  discard: Tile
  afterDiscardShanten: number
  winningTiles: Tile[]
  improvementTiles: Tile[]
  effectiveTileCount: number
  reason: string
}

function remainingCountAfterDiscard(hand: HandState, tile: Tile, discard: Tile): number {
  const allTiles = [...hand.concealed, ...hand.melds.flatMap((meld) => meld.tiles)]
  const counts = tilesToCounts(allTiles)
  counts[tileIndex(discard)] -= 1
  return Math.max(0, 4 - counts[tileIndex(tile)])
}

/**
 * Single-pass scan over all 34 tile types to get both winning tiles and
 * improvement tiles after a discard, avoiding two separate full enumerations.
 */
function getWaitsAfterDiscard(
  nextHand: HandState,
  currentShanten: number,
): { winningTiles: Tile[]; improvementTiles: Tile[] } {
  const winningTiles: Tile[] = []
  const improvementTiles: Tile[] = []
  const handAllCounts = tilesToCounts([
    ...nextHand.concealed,
    ...nextHand.melds.flatMap((meld) => meld.tiles),
  ])

  for (const tile of TILES) {
    const idx = tileIndex(tile)
    if (handAllCounts[idx] >= 4) continue
    const drawn = { ...nextHand, concealed: [...nextHand.concealed, tile] }
    if (canWin(drawn)) {
      winningTiles.push(tile)
    } else {
      const next = calculateShanten(drawn).shanten
      if (next < currentShanten) improvementTiles.push(tile)
    }
  }

  return { winningTiles, improvementTiles }
}

function reasonForAdvice(advice: Omit<DiscardAdvice, 'reason'>): string {
  if (advice.winningTiles.length > 0) {
    return `切后听 ${advice.winningTiles.length} 种牌`
  }
  if (advice.improvementTiles.length > 0) {
    return `切后 ${advice.afterDiscardShanten} 向听，有 ${advice.improvementTiles.length} 种进张`
  }
  return `切后 ${advice.afterDiscardShanten} 向听`
}

export function getDiscardAdvice(hand: HandState): DiscardAdvice[] {
  // Only meaningful for 3k+2 (post-draw) hands
  const n = hand.concealed.length
  const rem = n - 2
  if (n < 2 || rem < 0 || rem % 3 !== 0) return []

  const uniqueDiscards = Array.from(new Set(sortTiles(hand.concealed)))

  return uniqueDiscards
    .map((discard) => {
      const nextHand = removeOneTile(hand, discard)
      const afterDiscardShanten = calculateShanten(nextHand).shanten
      const { winningTiles, improvementTiles } = getWaitsAfterDiscard(
        nextHand,
        afterDiscardShanten,
      )
      const effectiveTiles = winningTiles.length > 0 ? winningTiles : improvementTiles
      const effectiveTileCount = effectiveTiles.reduce(
        (total, tile) => total + remainingCountAfterDiscard(hand, tile, discard),
        0,
      )
      const adviceWithoutReason = {
        discard,
        afterDiscardShanten,
        winningTiles,
        improvementTiles,
        effectiveTileCount,
      }

      return {
        ...adviceWithoutReason,
        reason: reasonForAdvice(adviceWithoutReason),
      }
    })
    .sort((a, b) => {
      if (a.afterDiscardShanten !== b.afterDiscardShanten) {
        return a.afterDiscardShanten - b.afterDiscardShanten
      }
      if (a.winningTiles.length !== b.winningTiles.length) {
        return b.winningTiles.length - a.winningTiles.length
      }
      if (a.effectiveTileCount !== b.effectiveTileCount) {
        return b.effectiveTileCount - a.effectiveTileCount
      }
      return TILES.indexOf(a.discard) - TILES.indexOf(b.discard)
    })
}
