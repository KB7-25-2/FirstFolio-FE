import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getCurriculumDraftApi, saveCurriculumDraftApi, confirmCurriculumApi } = vi.hoisted(() => ({
  getCurriculumDraftApi: vi.fn(),
  saveCurriculumDraftApi: vi.fn(),
  confirmCurriculumApi: vi.fn(),
}))

vi.mock('@/api/curriculumApi.js', () => ({
  getCurriculumDraft: getCurriculumDraftApi,
  saveCurriculumDraft: saveCurriculumDraftApi,
  confirmCurriculum: confirmCurriculumApi,
}))

import {
  confirmCurriculum,
  getCurriculumDraft,
  saveCurriculumDraft,
} from '@/services/curriculumService.js'

describe('curriculumService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('서버 출처 타입을 기존 온보딩 화면의 출처 타입으로 변환한다', async () => {
    getCurriculumDraftApi.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              main_chapter_id: 10,
              title: '포트폴리오 기초',
              source_type: 'FOUNDATION',
              display_order: 1,
              removable: false,
            },
          ],
          recommendation_candidates: [{ main_chapter_id: 20, title: '채권' }],
          cart_candidates: [{ main_chapter_id: 30, title: '주식' }],
        },
      },
    })

    const { data } = await getCurriculumDraft()

    expect(data.items[0].sourceType).toBe('REQUIRED')
    expect(data.recommendationCandidates[0].title).toBe('채권')
    expect(data.cartCandidates[0].title).toBe('주식')
  })

  it('FOUNDATION을 제외한 선택 대단원 순서를 PUT 요청으로 보낸다', async () => {
    saveCurriculumDraftApi.mockResolvedValue({ data: { data: { items: [] } } })

    await saveCurriculumDraft({ main_chapter_ids: [30, 20] })

    expect(saveCurriculumDraftApi).toHaveBeenCalledWith({ main_chapter_ids: [30, 20] })
  })

  it('최종 선택 순서를 확정 API로 보낸다', async () => {
    confirmCurriculumApi.mockResolvedValue({ data: { data: { items: [] } } })

    await confirmCurriculum({ main_chapter_ids: [20] })

    expect(confirmCurriculumApi).toHaveBeenCalledWith({ main_chapter_ids: [20] })
  })
})
