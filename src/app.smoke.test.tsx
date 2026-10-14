import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from './App'

describe('app smoke', () => {
  it('renders the new layout', () => {
    const html = renderToString(<App />)
    expect(html).toContain('麻将助手')
    expect(html).toContain('还没有手牌')
    expect(html).toContain('录入手牌')
    expect(html).toContain('拍照导入')
  })
})
