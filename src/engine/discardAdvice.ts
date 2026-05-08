import { removeOneTile, sortTiles, type HandState } from './hand'
import { calculateShanten } from './shanten'
import { getImprovementTiles, getWinningTiles } from './waits'
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
  const uniqueDiscards = Array.from(new Set(sortTiles(hand.concealed)))

  return uniqueDiscards
    .map((discard) => {
      const nextHand = removeOneTile(hand, discard)
      const afterDiscardShanten = calculateShanten(nextHand).shanten
      const winningTiles = getWinningTiles(nextHand)
      const improvementTiles = getImprovementTiles(nextHand)
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
