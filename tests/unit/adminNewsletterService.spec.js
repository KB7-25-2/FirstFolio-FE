import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/admin/newsletterApi.js', () => ({
  getAdminNewsletters: vi.fn(),
  getAdminNewsletterDetail: vi.fn(),
  publishAdminNewsletter: vi.fn(),
  retireAdminNewsletter: vi.fn(),
}))

import {
  getAdminNewsletters,
  getAdminNewsletterDetail,
  publishAdminNewsletter,
  retireAdminNewsletter,
} from '@/api/admin/newsletterApi.js'
import {
  fetchAdminNewsletterDetail,
  fetchAdminNewsletters,
  formatAdminNewsletterError,
  mapAdminNewsletter,
  publishAdminNewsletterService,
  retireAdminNewsletterService,
} from '@/services/adminNewsletterService.js'

describe('adminNewsletterService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /admin/newsletters 목록을 매핑한다', async () => {
    getAdminNewsletters.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              newsletter_id: 501,
              week_start_date: '2026-07-28',
              headline: '이번 주 금융 브리프',
              status: 'REVIEW',
              financial_words_json: [{ term: '금리', definition: '이자의 비율' }],
              issuesJson: [
                {
                  title: '기준금리',
                  summary: '동결',
                  related_term: '금리',
                  sources: [{ source_url: 'https://example.com', evidence_text: '근거' }],
                },
              ],
              stats_json: [{ label: '조회', value: '12' }],
              generation_type: 'AI',
              published_at: null,
              created_at: '2026-07-29T04:20:00Z',
            },
          ],
        },
      },
    })

    const items = await fetchAdminNewsletters({ status: 'REVIEW' })

    expect(getAdminNewsletters).toHaveBeenCalledWith({ status: 'REVIEW' })
    expect(items[0]).toMatchObject({
      newsletterId: 501,
      headline: '이번 주 금융 브리프',
      status: 'REVIEW',
      financialWords: [{ term: '금리', definition: '이자의 비율' }],
      issues: [
        {
          title: '기준금리',
          summary: '동결',
          relatedTerm: '금리',
        },
      ],
      stats: [{ label: '조회', value: '12' }],
    })
    expect(items[0].issues[0].sources[0].sourceUrl).toBe('https://example.com')
  })

  it('status 미지정 시 REVIEW로 조회한다', async () => {
    getAdminNewsletters.mockResolvedValue({
      data: { data: { items: [] } },
    })

    await fetchAdminNewsletters()

    expect(getAdminNewsletters).toHaveBeenCalledWith({ status: 'REVIEW' })
  })

  it('잘못된 status면 INVALID_REQUEST를 던진다', async () => {
    await expect(fetchAdminNewsletters({ status: 'ALL' })).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    })
    expect(getAdminNewsletters).not.toHaveBeenCalled()
  })

  it('snake/camel issues·stats 필드를 모두 처리한다', () => {
    expect(
      mapAdminNewsletter({
        newsletterId: 1,
        headline: 'A',
        status: 'PUBLISHED',
        issues_json: [{ title: 'T', summary: 'S' }],
        statsJson: [{ label: 'L', value: 'V' }],
      }),
    ).toMatchObject({
      newsletterId: 1,
      issues: [{ title: 'T', summary: 'S' }],
      stats: [{ label: 'L', value: 'V' }],
    })
  })

  it('GET 상세를 매핑한다', async () => {
    getAdminNewsletterDetail.mockResolvedValue({
      data: {
        data: {
          newsletter_id: 501,
          headline: '상세',
          status: 'REVIEW',
          financial_words_json: [],
          issuesJson: [],
          stats_json: [],
        },
      },
    })

    const detail = await fetchAdminNewsletterDetail(501)
    expect(getAdminNewsletterDetail).toHaveBeenCalledWith(501)
    expect(detail.headline).toBe('상세')
  })

  it('POST publish / retire 상태 응답을 매핑한다', async () => {
    publishAdminNewsletter.mockResolvedValue({
      data: {
        data: {
          newsletter_id: 501,
          week_start_date: '2026-07-28',
          status: 'PUBLISHED',
          published_at: '2026-07-29T10:00:00Z',
        },
      },
    })
    retireAdminNewsletter.mockResolvedValue({
      data: {
        data: {
          newsletter_id: 501,
          status: 'RETIRED',
          published_at: '2026-07-29T10:00:00Z',
        },
      },
    })

    const published = await publishAdminNewsletterService(501)
    expect(publishAdminNewsletter).toHaveBeenCalledWith(501)
    expect(published).toMatchObject({ newsletterId: 501, status: 'PUBLISHED' })

    const retired = await retireAdminNewsletterService(501)
    expect(retireAdminNewsletter).toHaveBeenCalledWith(501)
    expect(retired.status).toBe('RETIRED')
  })

  it('오류 코드를 한글로 매핑한다', () => {
    expect(
      formatAdminNewsletterError({ code: 'NEWSLETTER_NOT_PUBLISHABLE', message: 'raw' }),
    ).toContain('게시')
  })
})
