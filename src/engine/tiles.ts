export type Suit = 'man' | 'pin' | 'sou' | 'honor'

export type Tile =
  | '1m'
  | '2m'
  | '3m'
  | '4m'
  | '5m'
  | '6m'
  | '7m'
  | '8m'
  | '9m'
  | '1p'
  | '2p'
  | '3p'
  | '4p'
  | '5p'
  | '6p'
  | '7p'
  | '8p'
  | '9p'
  | '1s'
  | '2s'
  | '3s'
  | '4s'
  | '5s'
  | '6s'
  | '7s'
  | '8s'
  | '9s'
  | 'east'
  | 'south'
  | 'west'
  | 'north'
  | 'red'
  | 'green'
  | 'white'

export const TILES: Tile[] = [
  '1m',
  '2m',
  '3m',
  '4m',
  '5m',
  '6m',
  '7m',
  '8m',
  '9m',
  '1p',
  '2p',
  '3p',
  '4p',
  '5p',
  '6p',
  '7p',
  '8p',
  '9p',
  '1s',
  '2s',
  '3s',
  '4s',
  '5s',
  '6s',
  '7s',
  '8s',
  '9s',
  'east',
  'south',
  'west',
  'north',
  'red',
  'green',
  'white',
]

export const TILE_LABELS: Record<Tile, string> = {
  '1m': '一万',
  '2m': '二万',
  '3m': '三万',
  '4m': '四万',
  '5m': '五万',
  '6m': '六万',
  '7m': '七万',
  '8m': '八万',
  '9m': '九万',
  '1p': '一筒',
  '2p': '二筒',
  '3p': '三筒',
  '4p': '四筒',
  '5p': '五筒',
  '6p': '六筒',
  '7p': '七筒',
  '8p': '八筒',
  '9p': '九筒',
  '1s': '一条',
  '2s': '二条',
  '3s': '三条',
  '4s': '四条',
  '5s': '五条',
  '6s': '六条',
  '7s': '七条',
  '8s': '八条',
  '9s': '九条',
  east: '东',
  south: '南',
  west: '西',
  north: '北',
  red: '中',
  green: '发',
  white: '白',
}

export const TILE_SHORT_LABELS: Record<Tile, string> = {
  '1m': '1万',
  '2m': '2万',
  '3m': '3万',
  '4m': '4万',
  '5m': '5万',
  '6m': '6万',
  '7m': '7万',
  '8m': '8万',
  '9m': '9万',
  '1p': '1筒',
  '2p': '2筒',
  '3p': '3筒',
  '4p': '4筒',
  '5p': '5筒',
  '6p': '6筒',
  '7p': '7筒',
  '8p': '8筒',
  '9p': '9筒',
  '1s': '1条',
  '2s': '2条',
  '3s': '3条',
  '4s': '4条',
  '5s': '5条',
  '6s': '6条',
  '7s': '7条',
  '8s': '8条',
  '9s': '9条',
  east: '东',
  south: '南',
  west: '西',
  north: '北',
  red: '中',
  green: '发',
  white: '白',
}

export const TILE_GROUPS: Array<{ title: string; tiles: Tile[] }> = [
  { title: '万子', tiles: TILES.slice(0, 9) },
  { title: '筒子', tiles: TILES.slice(9, 18) },
  { title: '条子', tiles: TILES.slice(18, 27) },
  { title: '字牌', tiles: TILES.slice(27) },
]

export function tileIndex(tile: Tile): number {
  return TILES.indexOf(tile)
}

export function tileFromIndex(index: number): Tile {
  return TILES[index]
}

export function tileSuit(tile: Tile): Suit {
  const index = tileIndex(tile)
  if (index < 9) return 'man'
  if (index < 18) return 'pin'
  if (index < 27) return 'sou'
  return 'honor'
}

export function isSuitedIndex(index: number): boolean {
  return index >= 0 && index < 27
}

export function isSameSuitRunStart(index: number): boolean {
  return isSuitedIndex(index) && index % 9 <= 6
}

export function emptyCounts(): number[] {
  return Array.from({ length: TILES.length }, () => 0)
}

export function tilesToCounts(tiles: Tile[]): number[] {
  const counts = emptyCounts()
  for (const tile of tiles) {
    counts[tileIndex(tile)] += 1
  }
  return counts
}

export function countsToTiles(counts: number[]): Tile[] {
  const tiles: Tile[] = []
  counts.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) {
      tiles.push(tileFromIndex(index))
    }
  })
  return tiles
}

export function formatTiles(tiles: Tile[]): string {
  if (tiles.length === 0) return '无'
  return tiles.map((tile) => TILE_SHORT_LABELS[tile]).join('、')
}
