import { TILE_SHORT_LABELS, tileSuit, type Tile } from '../engine/tiles'

interface TileChipProps {
  tile: Tile
  size?: 'sm' | 'md' | 'key'
  title?: string
  onClick?: () => void
}

function colorClass(tile: Tile): string {
  if (tile === 'red') return 'tile-red'
  if (tile === 'green') return 'tile-green'
  if (tile === 'white') return 'tile-white'
  if (tileSuit(tile) === 'honor') return 'tile-honor'
  return `tile-${tileSuit(tile)}`
}

export function TileChip({ tile, size = 'md', title, onClick }: TileChipProps) {
  const label = TILE_SHORT_LABELS[tile]
  const className = `tile-chip ${size} ${colorClass(tile)}`

  if (onClick) {
    return (
      <button type="button" className={`${className} tile-chip-button`} title={title ?? `移除 ${label}`} onClick={onClick}>
        {label}
      </button>
    )
  }

  return (
    <span className={className} title={title}>
      {label}
    </span>
  )
}
