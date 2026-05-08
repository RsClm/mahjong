import { useMemo, useState } from 'react'
import { sortTiles, type HandState, type Meld, type MeldType } from '../engine/hand'
import { TILE_GROUPS, TILE_SHORT_LABELS, type Tile } from '../engine/tiles'

interface HandEditorProps {
  hand: HandState
  onAddTile: (tile: Tile) => void
  onRemoveTile: (index: number) => void
  onAddMeld: (meld: Meld) => void
  onRemoveMeld: (id: string) => void
  onClear: () => void
}

const MELD_LABELS: Record<MeldType, string> = {
  chi: '吃',
  pon: '碰',
  kan: '杠',
}

export function HandEditor({
  hand,
  onAddTile,
  onRemoveTile,
  onAddMeld,
  onRemoveMeld,
  onClear,
}: HandEditorProps) {
  const [meldType, setMeldType] = useState<MeldType>('chi')
  const [meldTiles, setMeldTiles] = useState<Tile[]>([])
  const sortedConcealed = useMemo(() => sortTiles(hand.concealed), [hand.concealed])
  const neededMeldTiles = meldType === 'kan' ? 4 : 3

  function removeSortedTile(tile: Tile, sortedIndex: number) {
    const previousSameTiles = sortedConcealed.slice(0, sortedIndex).filter((item) => item === tile).length
    let seen = 0
    const originalIndex = hand.concealed.findIndex((item) => {
      if (item !== tile) return false
      if (seen === previousSameTiles) return true
      seen += 1
      return false
    })
    if (originalIndex >= 0) onRemoveTile(originalIndex)
  }

  function addMeldTile(tile: Tile) {
    if (meldTiles.length >= neededMeldTiles) return
    setMeldTiles((current) => [...current, tile])
  }

  function submitMeld() {
    if (meldTiles.length !== neededMeldTiles) return
    onAddMeld({
      id: crypto.randomUUID(),
      type: meldType,
      tiles: [...meldTiles],
    })
    setMeldTiles([])
  }

  return (
    <section className="card hand-editor">
      <div className="section-title">
        <div>
          <p className="eyebrow">手牌录入</p>
          <h2>点选牌面</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onClear}>
          清空
        </button>
      </div>

      <div className="tile-groups">
        {TILE_GROUPS.map((group) => (
          <div className="tile-group" key={group.title}>
            <h3>{group.title}</h3>
            <div className="tile-grid">
              {group.tiles.map((tile) => (
                <button type="button" className="tile-button" key={tile} onClick={() => onAddTile(tile)}>
                  {TILE_SHORT_LABELS[tile]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="current-hand">
        <div className="section-title compact">
          <h3>暗手牌 {hand.concealed.length} 张</h3>
        </div>
        {sortedConcealed.length === 0 ? (
          <p className="empty">还没有录入手牌。</p>
        ) : (
          <div className="selected-tiles">
            {sortedConcealed.map((tile, index) => (
              <button type="button" className="selected-tile" key={`${tile}-${index}`} onClick={() => removeSortedTile(tile, index)}>
                {TILE_SHORT_LABELS[tile]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="meld-editor">
        <div className="section-title compact">
          <h3>鸣牌</h3>
          <select value={meldType} onChange={(event) => setMeldType(event.target.value as MeldType)}>
            <option value="chi">吃</option>
            <option value="pon">碰</option>
            <option value="kan">杠</option>
          </select>
        </div>
        <p className="muted">先选择鸣牌类型，再点 {neededMeldTiles} 张组成一组。</p>
        <div className="selected-tiles">
          {meldTiles.map((tile, index) => (
            <button
              type="button"
              className="selected-tile draft"
              key={`${tile}-${index}`}
              onClick={() => setMeldTiles((current) => current.filter((_, tileIndex) => tileIndex !== index))}
            >
              {TILE_SHORT_LABELS[tile]}
            </button>
          ))}
        </div>
        <div className="tile-grid small">
          {TILE_GROUPS.flatMap((group) => group.tiles).map((tile) => (
            <button type="button" className="tile-button" key={`meld-${tile}`} onClick={() => addMeldTile(tile)}>
              {TILE_SHORT_LABELS[tile]}
            </button>
          ))}
        </div>
        <button type="button" disabled={meldTiles.length !== neededMeldTiles} onClick={submitMeld}>
          添加{MELD_LABELS[meldType]}
        </button>

        {hand.melds.length > 0 && (
          <div className="meld-list">
            {hand.melds.map((meld) => (
              <button type="button" className="meld-pill" key={meld.id} onClick={() => onRemoveMeld(meld.id)}>
                {MELD_LABELS[meld.type]} {meld.tiles.map((tile) => TILE_SHORT_LABELS[tile]).join(' ')}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
