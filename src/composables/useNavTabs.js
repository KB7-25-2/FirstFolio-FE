import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getLearningNavLocation } from '@/utils/learningRoadmapFocus.js'

export const NAV_TABS = [
  {
    name: 'daily',
    path: '/daily',
    label: '데일리',
    icon: 'fa-solid fa-calendar-day',
    activeClass: 'text-[var(--nav-active-primary)]',
    activeDotClass: 'bg-[var(--nav-active-primary)]',
  },
  {
    name: 'learning',
    path: '/learning',
    label: '학습',
    icon: 'fa-solid fa-book-open',
    activeClass: 'text-[var(--nav-active-primary)]',
    activeDotClass: 'bg-[var(--nav-active-primary)]',
  },
  {
    name: 'home',
    path: '/home',
    label: '홈',
    icon: 'fa-solid fa-house',
    activeClass: 'text-[var(--nav-active-primary)]',
    activeDotClass: 'bg-[var(--nav-active-primary)]',
    isCenter: true,
  },
  {
    name: 'portfolios',
    path: '/portfolios',
    label: '포트폴리오',
    icon: 'fa-solid fa-chart-pie',
    activeClass: 'text-[var(--nav-active-secondary)]',
    activeDotClass: 'bg-[var(--nav-active-secondary)]',
  },
  {
    name: 'point-market',
    path: '/point-market',
    label: '상점',
    icon: 'fa-solid fa-shop',
    activeClass: 'text-[var(--nav-active-secondary)]',
    activeDotClass: 'bg-[var(--nav-active-secondary)]',
  },
]

export const useNavTabs = () => {
  const route = useRoute()
  const router = useRouter()

  const activeTab = computed(() => {
    const tabMeta = [...route.matched].reverse().find((record) => record.meta.navTab)?.meta.navTab
    return tabMeta ?? route.name
  })
  const isActive = (name) => activeTab.value === name
  const navigate = (path) => {
    if (path === '/learning') {
      router.push(getLearningNavLocation())
      return
    }
    router.push(path)
  }

  const leftTabs = computed(() => NAV_TABS.filter((tab) => !tab.isCenter).slice(0, 2))
  const rightTabs = computed(() => NAV_TABS.filter((tab) => !tab.isCenter).slice(2))
  const centerTab = computed(() => NAV_TABS.find((tab) => tab.isCenter) ?? null)

  return { tabs: NAV_TABS, leftTabs, rightTabs, centerTab, activeTab, isActive, navigate }
}
