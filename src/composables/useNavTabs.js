import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export const NAV_TABS = [
  {
    name: 'home',
    path: '/home',
    label: '홈',
    icon: 'fa-solid fa-house',
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

  const activeTab = computed(() => route.name)
  const isActive = (name) => activeTab.value === name
  const navigate = (path) => router.push(path)

  return { tabs: NAV_TABS, activeTab, isActive, navigate }
}
