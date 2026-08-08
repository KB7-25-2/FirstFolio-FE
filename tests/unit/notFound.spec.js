import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import NotFoundView from '@/views/NotFoundView.vue'

describe('NotFoundView (unit)', () => {
  it('404 안내 문구와 홈 링크를 렌더링한다', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', name: 'home', component: { template: '<div>home</div>' } },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
      ],
    })
    await router.push('/missing-page')
    await router.isReady()

    const wrapper = mount(NotFoundView, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: false,
          LearningNotePaper: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.text()).toContain('ERROR 404')
    expect(wrapper.text()).toContain('페이지를 찾을 수 없어요')
    expect(wrapper.text()).toContain('홈으로 돌아가기')
    expect(wrapper.find('a[href="/home"]').exists()).toBe(true)
  })

  it('존재하지 않는 경로는 not-found로 매칭된다', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', name: 'home', component: { template: '<div />' } },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
      ],
    })
    await router.push('/foo/bar/unknown')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('not-found')
  })
})
