/**
 * @typedef {import('@/types/news.js').FinancialNewsItem} FinancialNewsItem
 * @typedef {import('@/types/news.js').FinancialNewsListResponse} FinancialNewsListResponse
 */

import scrap1 from '@/assets/news/scrap-1.png'
import scrap2 from '@/assets/news/scrap-2.png'

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export class NewsApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'NewsApiError'
    this.code = code
    this.status = status
    this.requestId = `req-mock-${Date.now()}`
  }
}

/** @type {FinancialNewsItem[]} */
const MOCK_NEWS = [
  {
    financial_news_id: 1,
    title: '예·적금 금리 비교 수요 증가…은행권 경쟁 격화',
    summary: '기준금리 동결 결정의 배경과 예·적금, 대출 금리에 미칠 수 있는 영향을 요약합니다.',
    image_url: scrap1,
    source_name: '경제일보',
    source_url: 'https://example.com/source-news',
    source_published_at: '2026-07-24T09:00:00',
    published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    financial_news_id: 2,
    title: '코스피, 외국인 매수에 2,720선 회복',
    summary:
      '청년층을 위한 저축·투자 지원 제도 개편 내용을 정리하고, 포트폴리오에 반영할 포인트를 안내합니다.',
    image_url: scrap2,
    source_name: '한국경제',
    source_url: 'https://example.com/source-news-2',
    source_published_at: '2026-07-23T14:30:00',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    financial_news_id: 3,
    title: '국내 증시 변동성 확대…초보 투자자가 봐야 할 지표',
    summary: '최근 증시 변동성의 원인과 함께 초보 투자자가 참고할 수 있는 기초 지표를 요약합니다.',
    image_url: scrap1,
    source_name: '금융감독원',
    source_url: 'https://example.com/source-news-3',
    source_published_at: '2026-07-22T08:00:00',
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
]

/**
 * limit 쿼리 파라미터 검증
 * @param {unknown} limit
 * @returns {number}
 */
const normalizeLimit = (limit) => {
  const value = limit === undefined || limit === null ? 3 : Number(limit)

  if (!Number.isInteger(value) || value < 1 || value > 10) {
    throw new NewsApiError('INVALID_LIMIT', 'limit은 1~10 사이의 정수여야 합니다.', 400)
  }

  return value
}

/**
 * 금융 뉴스 요약 목록 조회
 * GET /financial-news?limit=
 *
 * TODO: API 연동 시 apiClient.get('/financial-news', { params: { limit } }) 로 교체
 *
 * @param {{ limit?: number }} [params]
 * @returns {Promise<FinancialNewsListResponse>}
 */
export const getFinancialNews = async (params = {}) => {
  const limit = normalizeLimit(params.limit)

  await delay()

  // published_at DESC (mock 데이터는 이미 정렬됨)
  const items = [...MOCK_NEWS]
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, limit)

  return { data: { items } }
}
