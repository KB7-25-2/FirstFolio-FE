import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import { PORTFOLIO_LOCKED_MESSAGE } from '@/utils/foundationGuide.js'

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
  const studyStore = useStudyStore()
  const { isPortfolioLocked } = storeToRefs(studyStore)

  onMounted(() => {
    if (!studyStore.curriculumItems.length) {
      studyStore.fetchCurriculum().catch(() => {})
    }
  })

  const activeTab = computed(() => {
    const tabMeta = [...route.matched].reverse().find((record) => record.meta.navTab)?.meta.navTab
    return tabMeta ?? route.name
  })
  const isActive = (name) => activeTab.value === name

  const isTabLocked = (name) => name === 'portfolios' && isPortfolioLocked.value

  const navigate = async (path) => {
    if (path.startsWith('/portfolios')) {
      if (!studyStore.curriculumItems.length) {
        try {
          await studyStore.fetchCurriculum()
        } catch {
          /* ignore */
        }
      }
      if (studyStore.isPortfolioLocked) {
        await router.push({ name: 'home', query: { portfolioLocked: '1' } })
        return false
      }
    }
    await router.push(path)
    return true
  }

  const leftTabs = computed(() => NAV_TABS.filter((tab) => !tab.isCenter).slice(0, 2))
  const rightTabs = computed(() => NAV_TABS.filter((tab) => !tab.isCenter).slice(2))
  const centerTab = computed(() => NAV_TABS.find((tab) => tab.isCenter) ?? null)

  return {
    tabs: NAV_TABS,
    leftTabs,
    rightTabs,
    centerTab,
    activeTab,
    isActive,
    isTabLocked,
    isPortfolioLocked,
    portfolioLockedMessage: PORTFOLIO_LOCKED_MESSAGE,
    navigate,
  }
}
