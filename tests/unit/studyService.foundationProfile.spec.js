import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getUserCurriculum } = vi.hoisted(() => ({
  getUserCurriculum: vi.fn(),
}))

vi.mock('@/api/user/curriculumApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getUserCurriculum,
  }
})

import {
  __getMockLearningProfile,
  __setMockLearningProfile,
  getContinuePosition,
  getCurriculum,
} from '@/services/studyService.js'
import { shouldShowFoundationGuide } from '@/utils/foundationGuide.js'

const MID_CURRICULUM_ITEMS = [
  {
    curriculum_item_id: 501,
    main_chapter_id: 1,
    title: '포트폴리오 기초',
    chapter_type: 'FOUNDATION',
    display_order: 1,
    status: 'COMPLETED',
    completed_at: '2026-06-20T12:00:00',
    progress_percent: 100,
  },
  {
    curriculum_item_id: 502,
    main_chapter_id: 2,
    title: '예·적금',
    chapter_type: 'CORE',
    display_order: 2,
    status: 'ACTIVE',
    completed_at: null,
    progress_percent: 50,
  },
  {
    curriculum_item_id: 503,
    main_chapter_id: 3,
    title: '채권',
    chapter_type: 'CORE',
    display_order: 3,
    status: 'LOCKED',
    completed_at: null,
    progress_percent: 0,
  },
]

const FOUNDATION_PENDING_ITEMS = [
  {
    curriculum_item_id: 501,
    main_chapter_id: 1,
    title: '포트폴리오 기초',
    chapter_type: 'FOUNDATION',
    display_order: 1,
    status: 'ACTIVE',
    completed_at: null,
    progress_percent: 0,
  },
  {
    curriculum_item_id: 502,
    main_chapter_id: 2,
    title: '예·적금',
    chapter_type: 'CORE',
    display_order: 2,
    status: 'LOCKED',
    completed_at: null,
    progress_percent: 0,
  },
  {
    curriculum_item_id: 503,
    main_chapter_id: 3,
    title: '채권',
    chapter_type: 'CORE',
    display_order: 3,
    status: 'LOCKED',
    completed_at: null,
    progress_percent: 0,
  },
]

const mockCurriculumResponse = (items) => {
  getUserCurriculum.mockResolvedValue({
    data: { data: { items } },
  })
}

describe('studyService mock learning profile', () => {
  beforeEach(() => {
    mockCurriculumResponse(MID_CURRICULUM_ITEMS)
  })

  afterEach(() => {
    __setMockLearningProfile('mid-curriculum')
    vi.clearAllMocks()
  })

  it('명시적으로 mid-curriculum으로 돌릴 수 있다', () => {
    __setMockLearningProfile('mid-curriculum')
    expect(__getMockLearningProfile()).toBe('mid-curriculum')
  })

  it('mid-curriculum에서는 기초 가이드가 필요 없다', async () => {
    __setMockLearningProfile('mid-curriculum')
    mockCurriculumResponse(MID_CURRICULUM_ITEMS)

    const { data } = await getCurriculum()
    expect(shouldShowFoundationGuide(data.items)).toBe(false)

    const foundation = data.items.find((item) => item.chapterType === 'FOUNDATION')
    expect(foundation?.status).toBe('COMPLETED')
  })

  it('foundation-pending에서는 FOUNDATION ACTIVE·progress 0이고 가이드가 필요하다', async () => {
    __setMockLearningProfile('foundation-pending')
    mockCurriculumResponse(FOUNDATION_PENDING_ITEMS)
    expect(__getMockLearningProfile()).toBe('foundation-pending')

    const { data } = await getCurriculum()
    const foundation = data.items.find((item) => item.chapterType === 'FOUNDATION')
    expect(foundation).toMatchObject({
      chapterType: 'FOUNDATION',
      status: 'ACTIVE',
      progressPercent: 0,
    })

    for (const item of data.items) {
      if (item.chapterType !== 'FOUNDATION') {
        expect(item.status).toBe('LOCKED')
      }
    }

    expect(shouldShowFoundationGuide(data.items)).toBe(true)
  })

  it('foundation-pending의 continue 위치는 기초 대단원을 가리킨다', async () => {
    __setMockLearningProfile('foundation-pending')
    const { data } = await getContinuePosition()
    expect(data.mainChapterId).toBe(1)
    expect(data.subChapterId).toBe(11)
    expect(data.route).toContain('/learning/sub-chapters/11')
  })

  it('알 수 없는 프로필이면 에러를 던진다', () => {
    expect(() => __setMockLearningProfile('unknown')).toThrow(/Unknown mock learning profile/)
  })
})
