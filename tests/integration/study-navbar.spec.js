import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

const { getUserCurriculum } = vi.hoisted(() => ({
  getUserCurriculum: vi.fn(),
}))

vi.mock('@/api/curriculumApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getUserCurriculum,
  }
})

import { useStudyStore } from '@/store/studyStore.js'
import { getCurriculum } from '@/services/studyService.js'
import AppNavbar from '@/components/AppNavbar.vue'

describe('studyService + studyStore (integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getUserCurriculum.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              curriculum_item_id: 501,
              main_chapter_id: 1,
              title: '포트폴리오 기초',
              chapter_type: 'FOUNDATION',
              display_order: 1,
              status: 'ACTIVE',
              completed_at: '2026-06-20T12:00:00',
              progress_percent: 100,
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
            },
          ],
        },
      },
    })
  })

  it('getCurriculum이 ACTIVE 대단원을 포함한다', async () => {
    const { data } = await getCurriculum()
    expect(data.items.length).toBeGreaterThan(0)
    expect(data.items.some((item) => item.status === 'ACTIVE')).toBe(true)
    expect(getUserCurriculum).toHaveBeenCalled()
  })

  it('fetchStudyNote가 스토어에 학습 현황을 채운다', async () => {
    const studyStore = useStudyStore()
    await studyStore.fetchStudyNote()

    expect(studyStore.error).toBeNull()
    expect(studyStore.chapterTitle).toBeTruthy()
    expect(studyStore.learningItems.length).toBeGreaterThan(0)
  })
})

describe('AppNavbar (integration)', () => {
  it('5개 탭 라벨을 렌더링한다', async () => {
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
        plugins: [router],
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
