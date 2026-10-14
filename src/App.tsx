import { useMemo, useState } from 'react'
import './App.css'
import { CameraImport } from './components/CameraImport'
import { HandBoard } from './components/HandBoard'
import { HandEditor } from './components/HandEditor'
import { TileChip } from './components/TileChip'
import {
  addTile,
  createEmptyHand,
  removeTileAt,
  validateHand,
  type HandState,
  type Meld,
} from './engine/hand'
import { getDiscardAdvice } from './engine/discardAdvice'
import { calculateShanten } from './engine/shanten'
import { analyzeWaits } from './engine/waits'
import { TILE_SHORT_LABELS, type Tile } from './engine/tiles'

const ADVICE_PREVIEW_COUNT = 4

function App() {
  const [hand, setHand] = useState<HandState>(() => createEmptyHand())
  const [showAllAdvice, setShowAllAdvice] = useState(false)
  const validation = useMemo(() => validateHand(hand), [hand])
  const shanten = useMemo(() => calculateShanten(hand), [hand])
  const waits = useMemo(() => analyzeWaits(hand), [hand])
  const advice = useMemo(() => getDiscardAdvice(hand), [hand])

  const concealedCount = hand.concealed.length
  const isPostDraw = shanten.isPostDraw
  const bestAdvice = advice.length > 0 ? advice[0] : null
  const postDrawTenpai =
    isPostDraw && bestAdvice && bestAdvice.afterDiscardShanten === 0 && bestAdvice.winningTiles.length > 0
      ? bestAdvice
      : null
  const preDrawTenpai = !isPostDraw && shanten.shanten === 0 && waits.winningTiles.length > 0
  const visibleAdvice = showAllAdvice ? advice : advice.slice(0, ADVICE_PREVIEW_COUNT)

  function appendTiles(tiles: Tile[]) {
    setHand((current) => ({ ...current, concealed: [...current.concealed, ...tiles] }))
  }

  function appendTile(tile: Tile) {
    setHand((current) => addTile(current, tile))
  }

  function removeConcealed(index: number) {
    setHand((current) => removeTileAt(current, index))
  }

  function addMeld(meld: Meld) {
    setHand((current) => ({ ...current, melds: [...current.melds, meld] }))
  }

  function removeMeld(id: string) {
    setHand((current) => ({ ...current, melds: current.melds.filter((meld) => meld.id !== id) }))
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <h1>麻将助手</h1>
        <span className="muted small">本地分析 · 照片不外传</span>
      </header>

      <HandBoard
        hand={hand}
        phaseText={concealedCount > 0 ? (isPostDraw ? '摸牌后' : '摸牌前') : undefined}
        onRemoveTile={removeConcealed}
        onRemoveMeld={removeMeld}
      />

      <section className="card analysis-card">
        <div className="analysis-head">
          <h2>{shanten.isWinning ? '已和牌' : `${shanten.shanten} 向听`}</h2>
          <span className="muted small">
            暗手牌 {shanten.concealedTileCount} 张
            {shanten.fixedMelds > 0 ? ` · 鸣牌 ${shanten.fixedMelds} 组` : ''}
          </span>
        </div>

        {!validation.isValid && (
          <div className="alert danger">
            {validation.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="alert">
            {validation.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        {concealedCount === 0 ? (
          <p className="muted small">录入后自动计算向听、听牌与切牌建议。</p>
        ) : shanten.isWinning ? (
          <p className="muted small">手牌已成和，可核对录入。</p>
        ) : postDrawTenpai ? (
          <div className="analysis-row">
            <span className="row-label">切 {TILE_SHORT_LABELS[postDrawTenpai.discard]} 后听牌</span>
            <span className="chip-row">
              {postDrawTenpai.winningTiles.map((tile) => (
                <TileChip key={tile} tile={tile} size="sm" />
              ))}
            </span>
            {postDrawTenpai.effectiveTileCount > 0 && (
              <span className="muted small">约 {postDrawTenpai.effectiveTileCount} 张</span>
            )}
          </div>
        ) : preDrawTenpai ? (
          <div className="analysis-row">
            <span className="row-label">听牌</span>
            <span className="chip-row">
              {waits.winningTiles.map((tile) => (
                <TileChip key={tile} tile={tile} size="sm" />
              ))}
            </span>
          </div>
        ) : (
          <div className="analysis-row">
            <span className="row-label">进张</span>
            {waits.improvementTiles.length > 0 ? (
              <span className="chip-row">
                {waits.improvementTiles.map((tile) => (
                  <TileChip key={tile} tile={tile} size="sm" />
                ))}
              </span>
            ) : (
              <span className="muted small">暂无</span>
            )}
          </div>
        )}

        {isPostDraw && !shanten.isWinning && advice.length > 0 && (
          <div className="advice-compact">
            {visibleAdvice.map((item) => (
              <div className="advice-item" key={item.discard}>
                <span className="row-label">切</span>
                <TileChip tile={item.discard} size="sm" />
                {item.winningTiles.length > 0 ? (
                  <>
                    <span className="muted small">听</span>
                    <span className="chip-row">
                      {item.winningTiles.map((tile) => (
                        <TileChip key={tile} tile={tile} size="sm" />
                      ))}
                    </span>
                  </>
                ) : item.improvementTiles.length > 0 ? (
                  <>
                    <span className="muted small">进张</span>
                    <span className="chip-row">
                      {item.improvementTiles.map((tile) => (
                        <TileChip key={tile} tile={tile} size="sm" />
                      ))}
                    </span>
                  </>
                ) : (
                  <span className="muted small">{item.reason}</span>
                )}
                {item.effectiveTileCount > 0 && <span className="muted small">约 {item.effectiveTileCount} 张</span>}
              </div>
            ))}
            {advice.length > ADVICE_PREVIEW_COUNT && (
              <button type="button" className="link-button" onClick={() => setShowAllAdvice((current) => !current)}>
                {showAllAdvice ? '收起' : `展开其余 ${advice.length - ADVICE_PREVIEW_COUNT} 条`}
              </button>
            )}
          </div>
        )}
      </section>

      <HandEditor onAddTile={appendTile} onAddMeld={addMeld} onClear={() => setHand(createEmptyHand())} />

      <details className="collapse-card">
        <summary>拍照导入（实验功能，点击展开）</summary>
        <CameraImport onRecognized={appendTiles} />
      </details>
    </main>
  )
}

export default App
