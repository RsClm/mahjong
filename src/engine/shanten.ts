import { completedMeldCount, type HandState } from './hand'
import { TILES, isSameSuitRunStart, tilesToCounts } from './tiles'

export interface ShantenResult {
  shanten: number
  isWinning: boolean
  fixedMelds: number
  concealedTileCount: number
}

interface ShapeResult {
  melds: number
  pairs: number
  taatsu: number
}

function firstNonZero(counts: number[]): number {
  return counts.findIndex((count) => count > 0)
}

function canRemoveRun(counts: number[], index: number): boolean {
  return isSameSuitRunStart(index) && counts[index + 1] > 0 && counts[index + 2] > 0
}

function searchShapes(counts: number[], result: ShapeResult, best: ShapeResult[]): void {
  const index = firstNonZero(counts)
  if (index < 0) {
    best.push({ ...result })
    return
  }

  if (counts[index] >= 3) {
    counts[index] -= 3
    searchShapes(counts, { ...result, melds: result.melds + 1 }, best)
    counts[index] += 3
  }

  if (canRemoveRun(counts, index)) {
    counts[index] -= 1
    counts[index + 1] -= 1
    counts[index + 2] -= 1
    searchShapes(counts, { ...result, melds: result.melds + 1 }, best)
    counts[index] += 1
    counts[index + 1] += 1
    counts[index + 2] += 1
  }

  if (counts[index] >= 2) {
    counts[index] -= 2
    searchShapes(counts, { ...result, pairs: result.pairs + 1 }, best)
    counts[index] += 2
  }

  if (index < 27 && index % 9 <= 7 && counts[index + 1] > 0) {
    counts[index] -= 1
    counts[index + 1] -= 1
    searchShapes(counts, { ...result, taatsu: result.taatsu + 1 }, best)
    counts[index] += 1
    counts[index + 1] += 1
  }

  if (index < 27 && index % 9 <= 6 && counts[index + 2] > 0) {
    counts[index] -= 1
    counts[index + 2] -= 1
    searchShapes(counts, { ...result, taatsu: result.taatsu + 1 }, best)
    counts[index] += 1
    counts[index + 2] += 1
  }

  counts[index] -= 1
  searchShapes(counts, result, best)
  counts[index] += 1
}

function normalShantenFromCounts(counts: number[], fixedMelds: number): number {
  const neededMelds = Math.max(0, 4 - fixedMelds)
  const shapes: ShapeResult[] = []
  searchShapes([...counts], { melds: 0, pairs: 0, taatsu: 0 }, shapes)

  let min = 8
  for (const shape of shapes) {
    const melds = Math.min(neededMelds, shape.melds)
    const pairUsed = shape.pairs > 0 ? 1 : 0
    let taatsu = shape.taatsu + Math.max(0, shape.pairs - pairUsed)
    taatsu = Math.min(taatsu, Math.max(0, neededMelds - melds))
    const shanten = 8 - fixedMelds * 2 - melds * 2 - taatsu - pairUsed
    min = Math.min(min, shanten)
  }

  return Math.max(-1, min)
}

function isWinningCounts(counts: number[], neededMelds: number, needsPair: boolean): boolean {
  if (neededMelds === 0) {
    return counts.every((count) => count === 0) || (needsPair && counts.some((count) => count === 2))
  }

  const index = firstNonZero(counts)
  if (index < 0) return neededMelds === 0 && !needsPair

  if (needsPair && counts[index] >= 2) {
    counts[index] -= 2
    if (isWinningCounts(counts, neededMelds, false)) {
      counts[index] += 2
      return true
    }
    counts[index] += 2
  }

  if (counts[index] >= 3) {
    counts[index] -= 3
    if (isWinningCounts(counts, neededMelds - 1, needsPair)) {
      counts[index] += 3
      return true
    }
    counts[index] += 3
  }

  if (canRemoveRun(counts, index)) {
    counts[index] -= 1
    counts[index + 1] -= 1
    counts[index + 2] -= 1
    if (isWinningCounts(counts, neededMelds - 1, needsPair)) {
      counts[index] += 1
      counts[index + 1] += 1
      counts[index + 2] += 1
      return true
    }
    counts[index] += 1
    counts[index + 1] += 1
    counts[index + 2] += 1
  }

  return false
}

export function canWin(hand: HandState): boolean {
  const fixedMelds = completedMeldCount(hand)
  if (fixedMelds > 4) return false

  const counts = tilesToCounts(hand.concealed)
  const concealedCount = hand.concealed.length
  const neededMelds = 4 - fixedMelds
  if (concealedCount !== neededMelds * 3 + 2) return false

  return isWinningCounts(counts, neededMelds, true)
}

export function calculateShanten(hand: HandState): ShantenResult {
  const fixedMelds = Math.min(4, completedMeldCount(hand))
  const shanten = canWin(hand)
    ? -1
    : normalShantenFromCounts(tilesToCounts(hand.concealed), fixedMelds)

  return {
    shanten,
    isWinning: shanten < 0,
    fixedMelds,
    concealedTileCount: hand.concealed.length,
  }
}

export function effectiveDrawsForShanten(hand: HandState): Array<{ tile: (typeof TILES)[number]; count: number }> {
  const current = calculateShanten(hand).shanten
  const counts = tilesToCounts(hand.concealed)

  return TILES.flatMap((tile, index) => {
    if (counts[index] >= 4) return []
    const next = calculateShanten({ ...hand, concealed: [...hand.concealed, tile] }).shanten
    return next < current ? [{ tile, count: 4 - counts[index] }] : []
  })
}
