import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  fetchCurriculumDraft,
  updateCurriculumDraft,
  confirmCurriculumDraft,
  getUserCurriculum,
  updateUserCurriculum,
} = vi.hoisted(() => ({
  fetchCurriculumDraft: vi.fn(),
  updateCurriculumDraft: vi.fn(),
  confirmCurriculumDraft: vi.fn(),
  getUserCurriculum: vi.fn(),
  updateUserCurriculum: vi.fn(),
}))

vi.mock('@/api/user/curriculumApi.js', () => ({
  fetchCurriculumDraft,
  updateCurriculumDraft,
  confirmCurriculumDraft,
  getUserCurriculum,
  updateUserCurriculum,
}))

import {
  confirmCurriculum,
  getConfirmedCurriculum,
  getCurriculumDraft,
  saveCurriculumDraft,
  updateConfirmedCurriculum,
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

  it('camelCase 초안 응답도 동일하게 매핑한다', async () => {
    fetchCurriculumDraft.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              mainChapterId: 10,
              title: '포트폴리오 기초',
              sourceType: 'FOUNDATION',
              displayOrder: 1,
              removable: false,
            },
          ],
          recommendationCandidates: [{ mainChapterId: 20, title: '채권' }],
          cartCandidates: [{ mainChapterId: 30, title: '주식' }],
        },
      },
    })

    const { data } = await getCurriculumDraft()
    expect(data.items[0].mainChapterId).toBe(10)
    expect(data.items[0].sourceType).toBe('REQUIRED')
  })

  it('FOUNDATION을 제외한 선택 대단원 순서를 PUT 요청으로 보낸다', async () => {
    updateCurriculumDraft.mockResolvedValue({ data: { data: { items: [] } } })

    await saveCurriculumDraft({ mainChapterIds: [30, 20] })

    expect(updateCurriculumDraft).toHaveBeenCalledWith({ main_chapter_ids: [30, 20] })
  })

  it('최종 선택 순서를 확정 API로 보낸다', async () => {
    confirmCurriculumDraft.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              mainChapterId: 1,
              title: '포트폴리오 기초',
              sourceType: 'FOUNDATION',
              displayOrder: 1,
            },
            {
              mainChapterId: 20,
              title: '채권',
              sourceType: 'LEVEL_TEST_WRONG',
              displayOrder: 2,
            },
          ],
        },
      },
    })

    const { data } = await confirmCurriculum({ mainChapterIds: [20] })

    expect(confirmCurriculumDraft).toHaveBeenCalledWith({ main_chapter_ids: [20] })
    expect(data.items).toHaveLength(2)
    expect(data.items[0].sourceType).toBe('REQUIRED')
    expect(data.items[1].mainChapterId).toBe(20)
  })

  it('확정 커리큘럼을 조회한다', async () => {
    getUserCurriculum.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              mainChapterId: 1,
              title: '포트폴리오 기초',
              chapterType: 'FOUNDATION',
              displayOrder: 1,
            },
          ],
        },
      },
    })

    const { data } = await getConfirmedCurriculum()
    expect(getUserCurriculum).toHaveBeenCalled()
    expect(data.items[0].sourceType).toBe('REQUIRED')
  })

  it('확정 커리큘럼을 PUT으로 수정한다', async () => {
    updateUserCurriculum.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              mainChapterId: 1,
              title: '포트폴리오 기초',
              sourceType: 'FOUNDATION',
              displayOrder: 1,
            },
            {
              mainChapterId: 3,
              title: '주식',
              sourceType: 'USER_ADDED',
              displayOrder: 2,
            },
          ],
        },
      },
    })

    const { data } = await updateConfirmedCurriculum({ mainChapterIds: [3, 2, 4] })

    expect(updateUserCurriculum).toHaveBeenCalledWith({ main_chapter_ids: [3, 2, 4] })
    expect(data.items[1].sourceType).toBe('CART')
  })
})
