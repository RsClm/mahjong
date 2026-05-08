import { TILES, TILE_SHORT_LABELS, type Tile } from '../engine/tiles'

export interface RecognitionResult {
  tiles: Tile[]
  confidence: number
  message: string
  imageUrl: string
}

const TILE_CODE_ALIASES: Record<string, Tile> = {
  dong: 'east',
  east: 'east',
  nan: 'south',
  south: 'south',
  xi: 'west',
  west: 'west',
  bei: 'north',
  north: 'north',
  zhong: 'red',
  red: 'red',
  fa: 'green',
  green: 'green',
  bai: 'white',
  white: 'white',
}

function parseTileText(text: string): Tile[] {
  const normalized = text.toLowerCase().replace(/[_.\-\s]+/g, ' ')
  const tiles: Tile[] = []
  const codePattern = /([1-9])\s*([mps])/g
  let match: RegExpExecArray | null

  while ((match = codePattern.exec(normalized)) !== null) {
    const tile = `${match[1]}${match[2]}` as Tile
    if (TILES.includes(tile)) tiles.push(tile)
  }

  for (const [alias, tile] of Object.entries(TILE_CODE_ALIASES)) {
    const hits = normalized.match(new RegExp(`\\b${alias}\\b`, 'g'))?.length ?? 0
    for (let i = 0; i < hits; i += 1) {
      tiles.push(tile)
    }
  }

  return tiles
}

export async function recognizeTilesFromImage(file: File): Promise<RecognitionResult> {
  const imageUrl = URL.createObjectURL(file)
  const tiles = parseTileText(file.name)

  return {
    tiles,
    confidence: tiles.length > 0 ? 0.55 : 0,
    imageUrl,
    message:
      tiles.length > 0
        ? `已从文件名识别到 ${tiles.map((tile) => TILE_SHORT_LABELS[tile]).join('、')}，请核对后使用。`
        : '已载入照片。当前免费静态版不会上传图片，请在照片旁手动校正手牌。',
  }
}
