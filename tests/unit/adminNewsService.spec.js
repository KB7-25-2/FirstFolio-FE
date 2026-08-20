import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/user/newsApi.js', () => ({
  getFinancialNews: vi.fn(),
}))

vi.mock('@/api/admin/newsApi.js', () => ({
  patchAdminFinancialNews: vi.fn(),
  deleteAdminFinancialNews: vi.fn(),
}))

import { getFinancialNews } from '@/api/user/newsApi.js'
import { deleteAdminFinancialNews, patchAdminFinancialNews } from '@/api/admin/newsApi.js'
import {
  buildNewsPatchBody,
  fetchAdminNews,
  formatAdminNewsError,
  mapAdminNewsItem,
  mapDeleteResult,
  removeAdminNews,
  updateAdminNewsContent,
} from '@/services/adminNewsService.js'

describe('adminNewsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /financial-news snake_case 목록을 매핑한다', async () => {
    getFinancialNews.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              financial_news_id: 1,
              title: '기준금리 뉴스',
              summary: '요약',
              image_url: 'https://cdn.example/news.png',
              source_name: '경제일보',
              source_url: 'https://publisher.example/article',
              source_published_at: '2026-07-28T10:00:00Z',
              collected_at: '2026-07-28T10:05:00Z',
              published_at: '2026-07-28T11:00:00Z',
            },
          ],
        },
      },
    })

    const items = await fetchAdminNews()

    expect(getFinancialNews).toHaveBeenCalledWith({ limit: 10 })
    expect(items[0]).toMatchObject({
      financialNewsId: 1,
      title: '기준금리 뉴스',
      summary: '요약',
      imageUrl: 'https://cdn.example/news.png',
      sourceName: '경제일보',
      sourceUrl: 'https://publisher.example/article',
    })
  })

  it('camelCase 단건과 image_url null을 매핑한다', () => {
    expect(
      mapAdminNewsItem({
        financialNewsId: 9,
        title: 'A',
        imageUrl: null,
        sourceUrl: 'https://example.com/a',
      }),
    ).toMatchObject({
      financialNewsId: 9,
      title: 'A',
      imageUrl: null,
      sourceUrl: 'https://example.com/a',
    })
  })

  it('PATCH는 전달한 필드만 보내고 source_url은 넣지 않는다', async () => {
    patchAdminFinancialNews.mockResolvedValue({
      data: {
        data: {
          financial_news_id: 1,
          title: '예·적금 금리 비교 수요 증가…은행권 경쟁 격화',
          summary: '기준금리 동결 결정의 배경과 예·적금, 대출 금리에 미칠 영향을 요약합니다.',
          image_url: null,
          source_name: '경제일보',
          source_url: 'https://example.com/source-news',
          source_published_at: '2026-08-16T09:00:00',
          published_at: '2026-08-17T09:00:00',
        },
      },
    })

    const updated = await updateAdminNewsContent(1, {
      title: '예·적금 금리 비교 수요 증가…은행권 경쟁 격화',
      summary: '기준금리 동결 결정의 배경과 예·적금, 대출 금리에 미칠 영향을 요약합니다.',
      imageUrl: null,
    })

    expect(patchAdminFinancialNews).toHaveBeenCalledWith(1, {
      title: '예·적금 금리 비교 수요 증가…은행권 경쟁 격화',
      summary: '기준금리 동결 결정의 배경과 예·적금, 대출 금리에 미칠 영향을 요약합니다.',
      image_url: null,
    })
    expect(patchAdminFinancialNews.mock.calls[0][1]).not.toHaveProperty('source_url')
    expect(patchAdminFinancialNews.mock.calls[0][1]).not.toHaveProperty('source_name')
    expect(updated.imageUrl).toBeNull()
  })

  it('수정 필드가 없으면 INVALID_REQUEST를 던진다', () => {
    expect(() => buildNewsPatchBody({})).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST', status: 400 }),
    )
  })

  it('공백 title은 INVALID_REQUEST를 던진다', () => {
    expect(() => buildNewsPatchBody({ title: '   ' })).toThrow(
      expect.objectContaining({ code: 'INVALID_REQUEST' }),
    )
  })

  it('DELETE 200 응답의 financial_news_id를 매핑한다', async () => {
    deleteAdminFinancialNews.mockResolvedValue({
      data: { data: { financial_news_id: 1 } },
    })
    const result = await removeAdminNews(1)
    expect(deleteAdminFinancialNews).toHaveBeenCalledWith(1)
    expect(result).toEqual({ financialNewsId: 1 })
    expect(mapDeleteResult({ financial_news_id: 1 })).toEqual({ financialNewsId: 1 })
  })

  it('FINANCIAL_NEWS_NOT_FOUND를 안내 문구로 바꾼다', () => {
    expect(formatAdminNewsError({ code: 'FINANCIAL_NEWS_NOT_FOUND' })).toBe(
      '금융 뉴스를 찾을 수 없습니다.',
    )
    expect(formatAdminNewsError({ code: 'ADMIN_REQUIRED' })).toBe('관리자 권한이 필요합니다.')
  })
})
