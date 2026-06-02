import { useEffect, useRef, useState } from 'react'
import { recognizeTilesFromImage, type RecognitionResult } from '../vision/recognizeTiles'
import { type Tile } from '../engine/tiles'

interface CameraImportProps {
  onRecognized: (tiles: Tile[]) => void
}

export function CameraImport({ onRecognized }: CameraImportProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [result, setResult] = useState<RecognitionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setIsLoading(true)
    const recognition = await recognizeTilesFromImage(file)
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    blobUrlRef.current = recognition.imageUrl
    setResult(recognition)
    setIsLoading(false)
    if (recognition.tiles.length > 0) {
      onRecognized(recognition.tiles)
    }
  }

  return (
    <section className="card camera-card">
      <div>
        <p className="eyebrow">拍照导入</p>
        <h2>上传手牌照片</h2>
        <p className="muted">
          免费 GitHub Pages 版本在手机本地处理照片，不上传服务器。识别结果会进入手牌区，建议核对后分析。
        </p>
      </div>

      <div className="camera-actions">
        <button type="button" onClick={() => inputRef.current?.click()}>
          {isLoading ? '识别中...' : '拍照 / 上传'}
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            void handleFile(event.target.files?.[0])
            event.currentTarget.value = ''
          }}
        />
      </div>

      {result && (
        <div className="photo-review">
          <img src={result.imageUrl} alt="上传的手牌照片预览" />
          <p>{result.message}</p>
        </div>
      )}
    </section>
  )
}
