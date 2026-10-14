import { sortTiles, type HandState, type MeldType } from '../engine/hand'
import { tileSuit, type Suit, type Tile } from '../engine/tiles'
import { TileChip } from './TileChip'

interface HandBoardProps {
  hand: HandState
  phaseText?: string
  onRemoveTile: (index: number) => void
  onRemoveMeld: (id: string) => void
}

const MELD_LABELS: Record<MeldType, string> = {
  chi: '吃',
  pon: '碰',
  kan: '杠',
}

const SUIT_ORDER: Suit[] = ['man', 'pin', 'sou', 'honor']

export function HandBoard({ hand, phaseText, onRemoveTile, onRemoveMeld }: HandBoardProps) {
  const sorted = sortTiles(hand.concealed)
  const total = sorted.length
  const empty = total === 0 && hand.melds.length === 0
  const indexed = sorted.map((tile, index) => ({ tile, index }))
  const groups = SUIT_ORDER.map((suit) => indexed.filter((entry) => tileSuit(entry.tile) === suit)).filter(
    (groupEntries) => groupEntries.length > 0,
  )
  const hints = [total > 0 ? '点牌即删' : null, phaseText ?? null].filter(Boolean).join(' · ')

  function removeSortedTile(tile: Tile, sortedIndex: number) {
    const previousSameTiles = sorted.slice(0, sortedIndex).filter((item) => item === tile).length
    let seen = 0
    const originalIndex = hand.concealed.findIndex((item) => {
      if (item !== tile) return false
      if (seen === previousSameTiles) return true
      seen += 1
      return false
    })
    if (originalIndex >= 0) onRemoveTile(originalIndex)
  }

  return (
    <section className="card hand-board">
      {empty ? (
        <p className="muted small">还没有手牌：用下方键盘录入，点牌面可删除。</p>
      ) : (
        <div className="board-meta">
          <span className="row-label">暗手牌 {total} 张</span>
          {hints && <span className="muted small">{hints}</span>}
        </div>
      )}

      {total > 0 && (
        <div className="hand-row">
          {groups.map((groupEntries) => (
            <span className="tile-group-inline" key={tileSuit(groupEntries[0].tile)}>
              {groupEntries.map((entry) => (
                <TileChip
                  key={`${entry.tile}-${entry.index}`}
                  tile={entry.tile}
                  size="md"
                  onClick={() => removeSortedTile(entry.tile, entry.index)}
                />
              ))}
            </span>
          ))}
        </div>
      )}

      {hand.melds.length > 0 && (
        <div className="hand-row">
          {hand.melds.map((meld) => (
            <button
              key={meld.id}
              type="button"
              className="meld-pill"
              title="点击移除该组鸣牌"
              onClick={() => onRemoveMeld(meld.id)}
            >
              <span className="meld-type">{MELD_LABELS[meld.type]}</span>
              {meld.tiles.map((tile, index) => (
                <TileChip key={`${meld.id}-${index}`} tile={tile} size="sm" />
              ))}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
