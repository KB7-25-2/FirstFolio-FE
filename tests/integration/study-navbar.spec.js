import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

const { getUserCurriculum, getRoadmap, getContinuePositionApi } = vi.hoisted(() => ({
  getUserCurriculum: vi.fn(),
  getRoadmap: vi.fn(),
  getContinuePositionApi: vi.fn(),
}))

vi.mock('@/api/user/curriculumApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getUserCurriculum,
  }
})

vi.mock('@/api/user/studyApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getRoadmap,
    getContinuePosition: getContinuePositionApi,
  }
})

import { useStudyStore } from '@/store/studyStore.js'
import { __setMockLearningProfile, getCurriculum } from '@/services/studyService.js'
import AppNavbar from '@/components/AppNavbar.vue'

const roadmapFixture = {
  items: [
    {
      curriculum_item_id: 501,
      main_chapter_id: 1,
      title: '포트폴리오 기초',
      chapter_type: 'FOUNDATION',
      display_order: 1,
      status: 'COMPLETED',
      completed_at: '2026-06-20T12:00:00',
      progress_percent: 100,
      sub_chapters: [],
    },
    {
      curriculum_item_id: 502,
      main_chapter_id: 2,
      title: '예·적금',
      chapter_type: 'ASSET',
      display_order: 2,
      status: 'ACTIVE',
      completed_at: null,
      progress_percent: 50,
      sub_chapters: [
        {
          sub_chapter_id: 101,
          title: '예금이란?',
          display_order: 1,
          description: '1교시',
          progress_status: 'COMPLETED',
          schedule_status: 'COMPLETED',
          content_available: true,
        },
        {
          sub_chapter_id: 103,
          title: '금리의 이해',
          display_order: 3,
          description: '3교시',
          progress_status: 'IN_PROGRESS',
          schedule_status: 'IN_PROGRESS',
          last_page_id: 'page-2',
          content_available: true,
        },
      ],
      main_chapter_quiz: { available: false, status: 'NOT_STARTED' },
    },
  ],
}

describe('studyService + studyStore (integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getUserCurriculum.mockResolvedValue({
      data: {
        data: {
          items: roadmapFixture.items.map(({ ...item }) => item),
        },
      },
    })
    getRoadmap.mockResolvedValue({
      data: { data: roadmapFixture },
    })
    getContinuePositionApi.mockRejectedValue(new Error('network'))
  })

  it('getCurriculum이 ACTIVE 대단원을 포함한다', async () => {
    const { data } = await getCurriculum()
    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items.some((item) => item.status === 'ACTIVE')).toBe(true)
    expect(getUserCurriculum).toHaveBeenCalled()
  })

  it('fetchStudyNote가 로드맵 기반으로 학습 현황을 채운다', async () => {
    const studyStore = useStudyStore()
    await studyStore.fetchStudyNote()

    expect(studyStore.error).toBeNull()
    expect(studyStore.chapterTitle).toBeTruthy()
    expect(studyStore.learningItems.length).toBeGreaterThan(0)
    expect(getRoadmap).toHaveBeenCalled()
    expect(studyStore.learningItems.some((item) => item.status === 'IN_PROGRESS')).toBe(true)
  })
})

describe('AppNavbar (integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __setMockLearningProfile('mid-curriculum')
  })

  it('5개 탭 라벨을 렌더링한다', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/daily', name: 'daily', component: { template: '<div />' } },
        { path: '/home', name: 'home', component: { template: '<div />' } },
        { path: '/learning', name: 'learning', component: { template: '<div />' } },
        { path: '/portfolios', name: 'portfolios', component: { template: '<div />' } },
        { path: '/point-market', name: 'point-market', component: { template: '<div />' } },
      ],
    })
    await router.push('/home')
    await router.isReady()

    const wrapper = mount(AppNavbar, {
      global: {
        plugins: [pinia, router],
        stubs: { FontAwesomeIcon: true },
      },
    })

    expect(wrapper.text()).toContain('데일리')
    expect(wrapper.text()).toContain('학습')
    expect(wrapper.text()).toContain('홈')
    expect(wrapper.text()).toContain('포트폴리오')
    expect(wrapper.text()).toContain('상점')
  })
})
