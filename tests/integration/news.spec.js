import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { useNewsStore } from '@/store/newsStore.js'
import { getFinancialNews } from '@/services/newsService.js'
import NewsClipping from '@/components/NewsClipping.vue'
import NewsScrap from '@/components/NewsScrap.vue'
import NewsDetailModal from '@/components/NewsDetailModal.vue'

const sampleItem = {
  financial_news_id: 1,
  title: '예·적금 금리 비교 수요 증가…은행권 경쟁 격화',
  summary: '요약 텍스트입니다.',
  image_url: 'https://cdn.example.com/news-1.jpg',
  source_name: '경제일보',
  source_url: 'https://example.com/source-news',
  source_published_at: '2026-07-24T09:00:00',
  published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
}

describe('newsStore (integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('fetchNews가 items와 featuredNews를 채운다', async () => {
    const newsStore = useNewsStore()
    await newsStore.fetchNews({ limit: 3 })

    expect(newsStore.error).toBeNull()
    expect(newsStore.items.length).toBe(3)
    expect(newsStore.featuredNews).toEqual(newsStore.items[0])
  })

  it('selectNews / clearSelection으로 선택 상태를 관리한다', async () => {
    const newsStore = useNewsStore()
    await newsStore.fetchNews({ limit: 2 })

    newsStore.selectNews(2)
    expect(newsStore.selectedId).toBe(2)
    expect(newsStore.selectedNews?.financial_news_id).toBe(2)

    newsStore.clearSelection()
    expect(newsStore.selectedId).toBeNull()
    expect(newsStore.selectedNews).toBeNull()
  })

  it('잘못된 limit이면 error를 설정한다', async () => {
    const newsStore = useNewsStore()
    await newsStore.fetchNews({ limit: 99 })

    expect(newsStore.items).toHaveLength(0)
    expect(newsStore.error).toContain('limit')
  })
})

describe('NewsClipping (integration)', () => {
  it('제목·출처·이미지를 렌더링한다', () => {
    const wrapper = mount(NewsClipping, {
      props: { item: sampleItem, tapeSide: 'left' },
    })

    expect(wrapper.text()).toContain(sampleItem.title)
    expect(wrapper.text()).toContain(sampleItem.source_name)
    expect(wrapper.find('img').attributes('src')).toBe(sampleItem.image_url)
  })

  it('클릭 시 select 이벤트로 id를 보낸다', async () => {
    const wrapper = mount(NewsClipping, {
      props: { item: sampleItem },
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([1])
  })
})

describe('NewsScrap (integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountAndWait = async () => {
    const wrapper = mount(NewsScrap)
    await flushPromises()
    // newsService mock delay(150ms) 대기
    await new Promise((resolve) => setTimeout(resolve, 200))
    await flushPromises()
    return wrapper
  }

  it('마운트 후 뉴스 목록을 불러와 카드를 렌더링한다', async () => {
    const wrapper = await mountAndWait()

    expect(wrapper.text()).toContain('오늘의 금융 뉴스 스크랩')
    expect(wrapper.findAllComponents(NewsClipping).length).toBeGreaterThan(0)
  })

  it('카드 선택 시 store.selectedId가 설정된다', async () => {
    const newsStore = useNewsStore()
    const wrapper = await mountAndWait()

    const first = wrapper.findComponent(NewsClipping)
    await first.trigger('click')

    expect(newsStore.selectedId).toBeTruthy()
  })

  it('서비스 응답과 스토어 items 개수가 일치한다', async () => {
    const { data } = await getFinancialNews({ limit: 3 })
    const newsStore = useNewsStore()
    await newsStore.fetchNews({ limit: 3 })

    expect(newsStore.items).toHaveLength(data.items.length)
  })
})

describe('NewsDetailModal (integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountModal = () =>
    mount(NewsDetailModal, {
      global: {
        stubs: {
          Teleport: {
            template: '<div><slot /></div>',
          },
        },
      },
    })

  it('뉴스 선택 시 제목·요약·원문 버튼이 보인다', async () => {
    const newsStore = useNewsStore()
    await newsStore.fetchNews({ limit: 1 })
    newsStore.selectNews(newsStore.items[0].financial_news_id)

    const wrapper = mountModal()
    await flushPromises()

    expect(wrapper.text()).toContain(newsStore.selectedNews.title)
    expect(wrapper.text()).toContain('AI 요약')
    expect(wrapper.text()).toContain(newsStore.selectedNews.summary)
    expect(wrapper.text()).toContain('원문 보러가기')

    wrapper.unmount()
  })

  it('닫기 클릭 시 선택이 해제된다', async () => {
    const newsStore = useNewsStore()
    await newsStore.fetchNews({ limit: 1 })
    newsStore.selectNews(newsStore.items[0].financial_news_id)

    const wrapper = mountModal()
    await flushPromises()

    await wrapper.get('[data-testid="news-modal-close"]').trigger('click')
    await flushPromises()

    expect(newsStore.selectedId).toBeNull()
    wrapper.unmount()
  })
})
