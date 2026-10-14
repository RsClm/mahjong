import { useState } from 'react'
import { type Meld, type MeldType } from '../engine/hand'
import { TILE_GROUPS, TILE_SHORT_LABELS, type Tile } from '../engine/tiles'
import { TileChip } from './TileChip'

interface HandEditorProps {
  onAddTile: (tile: Tile) => void
  onAddMeld: (meld: Meld) => void
  onClear: () => void
}

const MELD_LABELS: Record<MeldType, string> = {
  chi: '吃',
  pon: '碰',
  kan: '杠',
}

const MELD_TYPES: MeldType[] = ['chi', 'pon', 'kan']

function getSuitAndNumber(tile: Tile): [string, number] | null {
  const match = tile.match(/^([1-9])([mps])$/)
  if (!match) return null
  return [match[2], parseInt(match[1], 10)]
}

function validateMeld(type: MeldType, tiles: Tile[]): string | null {
  if (type === 'pon') {
    if (!tiles.every((t) => t === tiles[0])) return '碰需要 3 张相同的牌'
    return null
  }
  if (type === 'kan') {
    if (!tiles.every((t) => t === tiles[0])) return '杠需要 4 张相同的牌'
    return null
  }
  const parsed = tiles.map(getSuitAndNumber)
  if (parsed.some((item) => item === null)) return '吃只能用数牌（万/筒/条）'
  const suits = parsed.map((item) => item![0])
  if (suits[0] !== suits[1] || suits[1] !== suits[2]) return '吃需要同一花色'
  const numbers = parsed.map((item) => item![1]).sort((a, b) => a - b)
  if (numbers[1] !== numbers[0] + 1 || numbers[2] !== numbers[1] + 1) return '吃需要连续三张顺子'
  return null
}

export function HandEditor({ onAddTile, onAddMeld, onClear }: HandEditorProps) {
  const [mode, setMode] = useState<'hand' | 'meld'>('hand')
  const [activeGroup, setActiveGroup] = useState(0)
  const [meldType, setMeldType] = useState<MeldType>('chi')
  const [meldTiles, setMeldTiles] = useState<Tile[]>([])

  const group = TILE_GROUPS[activeGroup]
  const neededMeldTiles = meldType === 'kan' ? 4 : 3
  const meldError = meldTiles.length === neededMeldTiles ? validateMeld(meldType, meldTiles) : null

  function handleTilePress(tile: Tile) {
    if (mode === 'hand') {
      onAddTile(tile)
      return
    }
    if (meldTiles.length >= neededMeldTiles) return
    setMeldTiles((current) => [...current, tile])
  }

  function changeMeldType(next: MeldType) {
    setMeldType(next)
    setMeldTiles([])
  }

  function submitMeld() {
    if (meldTiles.length !== neededMeldTiles || meldError) return
    onAddMeld({ id: crypto.randomUUID(), type: meldType, tiles: [...meldTiles] })
    setMeldTiles([])
  }

  return (
    <section className="card hand-editor">
      <div className="editor-head">
        <div className="segmented">
          <button type="button" className={mode === 'hand' ? 'active' : ''} onClick={() => setMode('hand')}>
            录入手牌
          </button>
          <button type="button" className={mode === 'meld' ? 'active' : ''} onClick={() => setMode('meld')}>
            加鸣牌
          </button>
        </div>
        <button type="button" className="ghost-button" onClick={onClear}>
          清空
        </button>
      </div>

      {mode === 'meld' && (
        <div className="meld-controls">
          <div className="tabs">
            {MELD_TYPES.map((type) => (
              <button key={type} type="button" className={meldType === type ? 'active' : ''} onClick={() => changeMeldType(type)}>
                {MELD_LABELS[type]}
              </button>
            ))}
          </div>
          <div className="draft-row">
            {meldTiles.map((tile, index) => (
              <TileChip
                key={`${tile}-${index}`}
                tile={tile}
                size="md"
                title="点击移除"
                onClick={() => setMeldTiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
            <span className="muted small">
              已选 {meldTiles.length}/{neededMeldTiles}
            </span>
            {meldError && <span className="meld-error">{meldError}</span>}
          </div>
        </div>
      )}

      <div className="tabs">
        {TILE_GROUPS.map((groupItem, index) => (
          <button
            key={groupItem.title}
            type="button"
            className={activeGroup === index ? 'active' : ''}
            onClick={() => setActiveGroup(index)}
          >
            {groupItem.title.charAt(0)}
          </button>
        ))}
      </div>

      <div className="keyboard-row">
        {group.tiles.map((tile) => (
          <TileChip
            key={tile}
            tile={tile}
            size="key"
            title={`${mode === 'hand' ? '录入' : '选入'} ${TILE_SHORT_LABELS[tile]}`}
            onClick={() => handleTilePress(tile)}
          />
        ))}
      </div>

      {mode === 'meld' && (
        <button
          type="button"
          className="primary-button"
          disabled={meldTiles.length !== neededMeldTiles || !!meldError}
          onClick={submitMeld}
        >
          添加{MELD_LABELS[meldType]}
        </button>
      )}
    </section>
  )
}
