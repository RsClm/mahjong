import { useMemo, useState } from 'react'
import './App.css'
import { CameraImport } from './components/CameraImport'
import { HandEditor } from './components/HandEditor'
import {
  addTile,
  createEmptyHand,
  removeTileAt,
  sortTiles,
  validateHand,
  type HandState,
  type Meld,
} from './engine/hand'
import { getDiscardAdvice } from './engine/discardAdvice'
import { calculateShanten } from './engine/shanten'
import { analyzeWaits } from './engine/waits'
import { formatTiles, TILE_SHORT_LABELS, type Tile } from './engine/tiles'

function App() {
  const [hand, setHand] = useState<HandState>(() => createEmptyHand())
  const validation = useMemo(() => validateHand(hand), [hand])
  const shanten = useMemo(() => calculateShanten(hand), [hand])
  const waits = useMemo(() => analyzeWaits(hand), [hand])
  const advice = useMemo(() => getDiscardAdvice(hand), [hand])

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
      <header className="hero-panel">
        <p className="eyebrow">手机可用 · 本地分析 · 免费部署</p>
        <h1>麻将助手</h1>
        <p>
          录入暗手牌和鸣牌后，自动计算普通麻将的向听数、听哪些牌，并给出切牌建议。拍照导入会保留照片预览，方便边看边校正。
        </p>
      </header>

      <CameraImport onRecognized={appendTiles} />

      <div className="workspace">
        <HandEditor
          hand={hand}
          onAddTile={appendTile}
          onRemoveTile={removeConcealed}
          onAddMeld={addMeld}
          onRemoveMeld={removeMeld}
          onClear={() => setHand(createEmptyHand())}
        />

        <section className="card result-panel">
          <div>
            <p className="eyebrow">分析结果</p>
            <h2>{shanten.isWinning ? '已和牌' : `${shanten.shanten} 向听`}</h2>
            <p className="muted">
              暗手牌 {shanten.concealedTileCount} 张，鸣牌 {shanten.fixedMelds} 组。
            </p>
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

          <div className="result-block">
            <h3>听牌提示</h3>
            {waits.winningTiles.length > 0 ? (
              <p className="tile-line">{formatTiles(waits.winningTiles)}</p>
            ) : (
              <p className="muted">
                当前未听牌。有效进张：{waits.improvementTiles.length > 0 ? formatTiles(waits.improvementTiles) : '暂无'}
              </p>
            )}
          </div>

          <div className="result-block">
            <h3>切牌建议</h3>
            {advice.length === 0 ? (
              <p className="muted">请先录入暗手牌。</p>
            ) : (
              <ol className="advice-list">
                {advice.slice(0, 8).map((item) => (
                  <li key={item.discard}>
                    <div className="advice-main">
                      <span className="discard-tile">切 {TILE_SHORT_LABELS[item.discard]}</span>
                      <span>{item.reason}</span>
                    </div>
                    <p>
                      {item.winningTiles.length > 0
                        ? `听牌：${formatTiles(item.winningTiles)}`
                        : `进张：${formatTiles(item.improvementTiles)}`}
                      {item.effectiveTileCount > 0 ? `，剩余约 ${item.effectiveTileCount} 张` : ''}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="result-block">
            <h3>当前手牌</h3>
            <p className="tile-line">{formatTiles(sortTiles(hand.concealed))}</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
