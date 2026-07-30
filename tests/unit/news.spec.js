import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatRelativeTime } from '@/utils/date.js'
import { getFinancialNews, NewsApiError } from '@/services/newsService.js'

describe('formatRelativeTime (unit)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('1시간 미만이면 N분 전을 반환한다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-30T12:00:00Z'))

    expect(formatRelativeTime('2026-07-30T11:30:00Z')).toBe('30분 전')
  })

  it('24시간 미만이면 N시간 전을 반환한다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-30T12:00:00Z'))

    expect(formatRelativeTime('2026-07-30T10:00:00Z')).toBe('2시간 전')
  })

  it('24시간 이상이면 N일 전을 반환한다', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-30T12:00:00Z'))

    expect(formatRelativeTime('2026-07-28T12:00:00Z')).toBe('2일 전')
  })

  it('잘못된 날짜면 빈 문자열을 반환한다', () => {
    expect(formatRelativeTime('not-a-date')).toBe('')
  })
})

describe('getFinancialNews (unit)', () => {
  it('기본 limit 3건을 반환한다', async () => {
    const { data } = await getFinancialNews()
    expect(data.items).toHaveLength(3)
  })

  it('limit만큼 최신순으로 자른다', async () => {
    const { data } = await getFinancialNews({ limit: 1 })
    expect(data.items).toHaveLength(1)
    expect(data.items[0].financial_news_id).toBe(1)
  })

  it('limit이 범위를 벗어나면 NewsApiError를 던진다', async () => {
    await expect(getFinancialNews({ limit: 0 })).rejects.toBeInstanceOf(NewsApiError)
    await expect(getFinancialNews({ limit: 11 })).rejects.toMatchObject({
      code: 'INVALID_LIMIT',
      status: 400,
    })
  })

  it('뉴스 아이템에 title·image_url·summary가 있다', async () => {
    const { data } = await getFinancialNews({ limit: 1 })
    const item = data.items[0]

    expect(item.title).toBeTruthy()
    expect(item.image_url).toBeTruthy()
    expect(item.summary).toBeTruthy()
    expect(item.source_name).toBeTruthy()
  })
})
