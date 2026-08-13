import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchCurriculumDraft, updateCurriculumDraft, confirmCurriculumDraft } = vi.hoisted(() => ({
  fetchCurriculumDraft: vi.fn(),
  updateCurriculumDraft: vi.fn(),
  confirmCurriculumDraft: vi.fn(),
}))

vi.mock('@/api/curriculumApi.js', () => ({
  fetchCurriculumDraft,
  updateCurriculumDraft,
  confirmCurriculumDraft,
}))

import {
  confirmCurriculum,
  getCurriculumDraft,
  saveCurriculumDraft,
} from '@/services/curriculumService.js'

describe('curriculumService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('서버 출처 타입을 기존 온보딩 화면의 출처 타입으로 변환한다', async () => {
    fetchCurriculumDraft.mockResolvedValue({
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
    updateCurriculumDraft.mockResolvedValue({ data: { data: { items: [] } } })

    await saveCurriculumDraft({ mainChapterIds: [30, 20] })

    expect(updateCurriculumDraft).toHaveBeenCalledWith({ main_chapter_ids: [30, 20] })
  })

  it('최종 선택 순서를 확정 API로 보낸다', async () => {
    confirmCurriculumDraft.mockResolvedValue({ data: { data: { items: [] } } })

    await confirmCurriculum({ mainChapterIds: [20] })

    expect(confirmCurriculumDraft).toHaveBeenCalledWith({ main_chapter_ids: [20] })
  })
})
