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
    const state = hand(['1m', '2m', '3m', '4m', '5m', '6m', 'red'])

    expect(calculateShanten(state).shanten).toBeGreaterThanOrEqual(0)
    expect(getDiscardAdvice(state).length).toBeGreaterThan(0)
  })
})
