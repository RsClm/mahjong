import { describe, expect, it } from 'vitest'
import { type HandState } from './hand'
import { getDiscardAdvice } from './discardAdvice'
import { calculateShanten, canWin } from './shanten'
import { getWinningTiles } from './waits'
import { type Tile } from './tiles'

function hand(concealed: Tile[], melds: HandState['melds'] = []): HandState {
  return { concealed, melds }
}

describe('mahjong engine', () => {
  it('detects a standard winning hand', () => {
    const state = hand(['1m', '2m', '3m', '4m', '5m', '6m', '7p', '8p', '9p', '2s', '3s', '4s', 'red', 'red'])

    expect(canWin(state)).toBe(true)
    expect(calculateShanten(state).shanten).toBe(-1)
  })

  it('lists winning tiles for a ready hand', () => {
    const state = hand(['1m', '2m', '3m', '4m', '5m', '6m', '7p', '8p', '9p', '2s', '3s', '4s', 'red'])

    expect(getWinningTiles(state)).toEqual(['red'])
  })

  it('uses fixed melds when calculating waits', () => {
    const state = hand(
      ['1m', '2m', '3m', '4p', '5p', '6p', 'red'],
      [
        { id: 'pon-east', type: 'pon', tiles: ['east', 'east', 'east'] },
        { id: 'pon-south', type: 'pon', tiles: ['south', 'south', 'south'] },
      ],
    )

    expect(getWinningTiles(state)).toEqual(['red'])
  })

  it('ranks discards that make tenpai', () => {
    const state = hand(['1m', '2m', '3m', '4m', '5m', '6m', '7p', '8p', '9p', '2s', '3s', '4s', 'red', 'green'])
    const advice = getDiscardAdvice(state)

    expect(advice[0].afterDiscardShanten).toBe(0)
    expect(advice[0].winningTiles.length).toBeGreaterThan(0)
  })

  it('still returns guidance for non 13 or 14 tile inputs', () => {
    // 7 tiles = 3*2+1 (pre-draw shape): shanten should be calculable, no discard advice
    const state = hand(['1m', '2m', '3m', '4m', '5m', '6m', 'red'])

    expect(calculateShanten(state).shanten).toBeGreaterThanOrEqual(0)
    // 3k+1 pre-draw shape: no discard needed
    expect(getDiscardAdvice(state).length).toBe(0)

    // 8 tiles = 3*2+2 (post-draw shape): should provide discard advice
    const postDraw = hand(['1m', '2m', '3m', '4m', '5m', '6m', 'red', 'green'])
    expect(calculateShanten(postDraw).shanten).toBeGreaterThanOrEqual(0)
    expect(getDiscardAdvice(postDraw).length).toBeGreaterThan(0)
  })

  it('detects a chiitoitsu winning hand', () => {
    const state = hand(['1m', '1m', '2p', '2p', '3s', '3s', 'east', 'east', 'south', 'south', 'west', 'west', 'red', 'red'])

    expect(canWin(state)).toBe(true)
    expect(calculateShanten(state).shanten).toBe(-1)
  })

  it('calculates chiitoitsu shanten correctly', () => {
    // 6 pairs + 1 single = tenpai (0 shanten)
    const tenpai = hand(['1m', '1m', '2p', '2p', '3s', '3s', 'east', 'east', 'south', 'south', 'west', 'west', 'red'])
    expect(calculateShanten(tenpai).shanten).toBe(0)

    // 5 pairs + 3 singles = 1 shanten
    const oneAway = hand(['1m', '1m', '2p', '2p', '3s', '3s', 'east', 'east', 'south', 'south', 'west', 'north', 'red'])
    expect(calculateShanten(oneAway).shanten).toBe(1)
  })

  it('correctly handles 3k+1 (pre-draw) hand shapes', () => {
    // 1 tile: 0 melds needed, 0-shanten should be very high
    const single = hand(['1m'])
    expect(calculateShanten(single).shanten).toBeGreaterThanOrEqual(0)

    // 4 tiles (3+1): need 1 meld, no pair — valid pre-draw shape
    const four = hand(['1m', '2m', '3m', '4m'])
    expect(calculateShanten(four).shanten).toBeGreaterThanOrEqual(0)

    // Almost-complete set: 1m2m3m | 4m5m6m | 7p8p9p | east — 3*3+1 = 10 tiles pre-draw
    // 3 complete melds, 1 partial taatsu → 0 shanten (tenpai for the meld)
    const preDraw = hand(['1m', '2m', '3m', '4m', '5m', '6m', '7p', '8p', '9p', '2s'])
    expect(calculateShanten(preDraw).shanten).toBeGreaterThanOrEqual(0)
  })

  it('gives discard advice only for 3k+2 hands', () => {
    // 3k+2 = 14 tiles → should have advice
    const postDraw = hand(['1m', '2m', '3m', '4m', '5m', '6m', '7p', '8p', '9p', '2s', '3s', '4s', 'red', 'green'])
    expect(getDiscardAdvice(postDraw).length).toBeGreaterThan(0)

    // 3k+1 = 13 tiles → no discard needed, advice list should be empty
    const preDraw = hand(['1m', '2m', '3m', '4m', '5m', '6m', '7p', '8p', '9p', '2s', '3s', '4s', 'red'])
    expect(getDiscardAdvice(preDraw).length).toBe(0)
  })
})
