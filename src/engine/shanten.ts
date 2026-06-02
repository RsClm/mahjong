import { completedMeldCount, type HandState } from './hand'
import { isSameSuitRunStart, tilesToCounts } from './tiles'

export interface ShantenResult {
  shanten: number
  isWinning: boolean
  isPostDraw: boolean
  fixedMelds: number
  concealedTileCount: number
}

function firstNonZero(counts: number[]): number {
  return counts.findIndex((count) => count > 0)
}

function canRemoveRun(counts: number[], index: number): boolean {
  return isSameSuitRunStart(index) && counts[index + 1] > 0 && counts[index + 2] > 0
}

function computeShantenScore(melds: number, pairs: number, taatsu: number, neededMelds: number): number {
  const m = Math.min(neededMelds, melds)
  const pairUsed = pairs > 0 ? 1 : 0
  let t = taatsu + Math.max(0, pairs - pairUsed)
  t = Math.min(t, Math.max(0, neededMelds - m))
  return neededMelds * 2 - m * 2 - t - pairUsed
}

function maxImprovementBound(remaining: number): number {
  // Upper bound: fill as many melds (3 tiles → -2) as possible, remainder forms taatsu (2 tiles → -1)
  return Math.floor(remaining / 3) * 2 + (remaining % 3 >= 2 ? 1 : 0)
}

function searchBest(
  counts: number[],
  melds: number,
  pairs: number,
  taatsu: number,
  neededMelds: number,
  best: { shanten: number },
): void {
  const index = firstNonZero(counts)
  if (index < 0) {
    const s = computeShantenScore(melds, pairs, taatsu, neededMelds)
    if (s < best.shanten) best.shanten = s
    return
  }

  // Pruning: even with perfect use of remaining tiles, can we beat current best?
  let remaining = 0
  for (const c of counts) remaining += c
  if (computeShantenScore(melds, pairs, taatsu, neededMelds) - maxImprovementBound(remaining) >= best.shanten) return

  if (counts[index] >= 3) {
    counts[index] -= 3
    searchBest(counts, melds + 1, pairs, taatsu, neededMelds, best)
    counts[index] += 3
  }

  if (canRemoveRun(counts, index)) {
    counts[index] -= 1
    counts[index + 1] -= 1
    counts[index + 2] -= 1
    searchBest(counts, melds + 1, pairs, taatsu, neededMelds, best)
    counts[index] += 1
    counts[index + 1] += 1
    counts[index + 2] += 1
  }

  if (counts[index] >= 2) {
    counts[index] -= 2
    searchBest(counts, melds, pairs + 1, taatsu, neededMelds, best)
    counts[index] += 2
  }

  if (index < 27 && index % 9 <= 7 && counts[index + 1] > 0) {
    counts[index] -= 1
    counts[index + 1] -= 1
    searchBest(counts, melds, pairs, taatsu + 1, neededMelds, best)
    counts[index] += 1
    counts[index + 1] += 1
  }

  if (index < 27 && index % 9 <= 6 && counts[index + 2] > 0) {
    counts[index] -= 1
    counts[index + 2] -= 1
    searchBest(counts, melds, pairs, taatsu + 1, neededMelds, best)
    counts[index] += 1
    counts[index + 2] += 1
  }

  counts[index] -= 1
  searchBest(counts, melds, pairs, taatsu, neededMelds, best)
  counts[index] += 1
}

/**
 * Infer (neededMelds, needsPair) from concealed tile count and fixed meld count.
 * Handles any 3k+1 or 3k+2 sized hand.
 *
 * 3k+2 tiles → aiming for k melds + 1 pair (摸牌后形)
 * 3k+1 tiles → aiming for k melds, no pair (未摸牌/打牌后形)
 *
 * k is capped at (4 - fixedMelds) since fixed melds already count.
 */
function inferShape(concealedCount: number, fixedMelds: number): { neededMelds: number; needsPair: boolean } {
  const maxMelds = Math.max(0, 4 - fixedMelds)
  const rem2 = (concealedCount - 2)
  if (rem2 >= 0 && rem2 % 3 === 0) {
    const k = Math.min(maxMelds, rem2 / 3)
    return { neededMelds: k, needsPair: true }
  }
  const rem1 = (concealedCount - 1)
  if (rem1 >= 0 && rem1 % 3 === 0) {
    const k = Math.min(maxMelds, rem1 / 3)
    return { neededMelds: k, needsPair: false }
  }
  // Fallback: treat as 3k+2 rounding down
  const k = Math.min(maxMelds, Math.floor(Math.max(0, concealedCount - 2) / 3))
  return { neededMelds: k, needsPair: true }
}

function normalShantenFromCounts(counts: number[], fixedMelds: number, concealedCount: number): number {
  const { neededMelds, needsPair } = inferShape(concealedCount, fixedMelds)
  const best = { shanten: neededMelds * 2 }
  if (needsPair) {
    searchBest([...counts], 0, 0, 0, neededMelds, best)
  } else {
    searchBestNoPair([...counts], 0, 0, neededMelds, best)
  }
  return Math.max(-1, best.shanten)
}

/**
 * Variant of searchBest for 3k+1 hands: no pair needed, only melds and taatsu.
 * Shanten = neededMelds*2 - melds*2 - taatsu
 */
function searchBestNoPair(
  counts: number[],
  melds: number,
  taatsu: number,
  neededMelds: number,
  best: { shanten: number },
): void {
  const index = firstNonZero(counts)
  if (index < 0) {
    const s = neededMelds * 2 - melds * 2 - taatsu
    if (s < best.shanten) best.shanten = s
    return
  }

  let remaining = 0
  for (const c of counts) remaining += c
  if (neededMelds * 2 - melds * 2 - taatsu - maxImprovementBound(remaining) >= best.shanten) return

  if (counts[index] >= 3) {
    counts[index] -= 3
    searchBestNoPair(counts, melds + 1, taatsu, neededMelds, best)
    counts[index] += 3
  }

  if (canRemoveRun(counts, index)) {
    counts[index] -= 1
    counts[index + 1] -= 1
    counts[index + 2] -= 1
    searchBestNoPair(counts, melds + 1, taatsu, neededMelds, best)
    counts[index] += 1
    counts[index + 1] += 1
    counts[index + 2] += 1
  }

  if (index < 27 && index % 9 <= 7 && counts[index + 1] > 0) {
    counts[index] -= 1
    counts[index + 1] -= 1
    searchBestNoPair(counts, melds, taatsu + 1, neededMelds, best)
    counts[index] += 1
    counts[index + 1] += 1
  }

  if (index < 27 && index % 9 <= 6 && counts[index + 2] > 0) {
    counts[index] -= 1
    counts[index + 2] -= 1
    searchBestNoPair(counts, melds, taatsu + 1, neededMelds, best)
    counts[index] += 1
    counts[index + 2] += 1
  }

  counts[index] -= 1
  searchBestNoPair(counts, melds, taatsu, neededMelds, best)
  counts[index] += 1
}

function chiitoitsuShanten(counts: number[], fixedMelds: number, concealedCount: number): number {
  // Chiitoitsu only applies when there are no fixed melds and at least 7 concealed tiles
  if (fixedMelds > 0 || concealedCount < 7) return Infinity
  const pairs = counts.reduce((acc, c) => acc + (c >= 2 ? 1 : 0), 0)
  return 6 - pairs
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
  const { neededMelds, needsPair } = inferShape(concealedCount, fixedMelds)

  // Standard winning hand: must be 3k+2 shape
  if (needsPair && isWinningCounts(counts, neededMelds, true)) {
    return true
  }

  // Chiitoitsu: 7 different pairs, no fixed melds, exactly 14 concealed tiles
  if (fixedMelds === 0 && concealedCount === 14) {
    const pairs = counts.reduce((acc, c) => acc + (c >= 2 ? 1 : 0), 0)
    if (pairs >= 7) return true
  }

  return false
}

export function calculateShanten(hand: HandState): ShantenResult {
  const fixedMelds = Math.min(4, completedMeldCount(hand))
  const counts = tilesToCounts(hand.concealed)
  const concealedCount = hand.concealed.length
  const { needsPair } = inferShape(concealedCount, fixedMelds)

  const normalS = canWin(hand) ? -1 : normalShantenFromCounts(counts, fixedMelds, concealedCount)
  const chiitoi = chiitoitsuShanten(counts, fixedMelds, concealedCount)
  const shanten = Math.min(normalS, chiitoi)

  return {
    shanten,
    isWinning: shanten < 0,
    isPostDraw: needsPair,
    fixedMelds,
    concealedTileCount: concealedCount,
  }
}

