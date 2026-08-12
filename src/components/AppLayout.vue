<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import AppTopBar from '@/components/AppTopBar.vue'
import AppDrawer from '@/components/AppDrawer.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import { NAV_TABS, useNavTabs } from '@/composables/useNavTabs.js'
import { useUserStore } from '@/store/userStore.js'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import { useGifticonStore } from '@/store/gifticonStore.js'

/** 상단 앱바를 쓰는 아이보리 대시보드 탭 */
const TOP_BAR_TABS = ['home', 'daily', 'learning', 'portfolios', 'point-market']
const TAB_ORDER = NAV_TABS.map((tab) => tab.name)

/** KeepAlive에 유지할 메인 탭 루트 (defineOptions name과 일치) */
const KEEP_ALIVE_TABS = [
  'HomeView',
  'DailyView',
  'LearningShellView',
  'PortfoliosView',
  'PointMarketView',
]

const route = useRoute()
const hideNavbar = computed(() => route.matched.some((record) => record.meta.hideNavbar === true))

const { activeTab } = useNavTabs()
const showTopBar = computed(() => !hideNavbar.value && TOP_BAR_TABS.includes(activeTab.value))

/**
 * 메인 탭 루트는 tab 단위로만 캐시.
 * hideNavbar 상세(레슨 등)에서 fullPath로 키를 바꾸면 LearningShellView가
 * 리마운트되며 로드맵 KeepAlive/스크롤이 날아간다.
 */
const tabCacheKey = computed(() => String(activeTab.value))

const userStore = useUserStore()
const portfolioStore = usePortfolioStore()
const gifticonStore = useGifticonStore()

onMounted(() => {
  if (!userStore.profile) userStore.fetchProfile()
  if (!portfolioStore.summary) portfolioStore.fetchSummary()
  if (!gifticonStore.gifticons.length) gifticonStore.fetchGifticons()

  // 탭 하위 청크를 미리 받아 첫 진입 지연을 줄인다
  void Promise.all([
    import('@/views/learning/LearningRoadmapView.vue'),
    import('@/views/portfolio/CurrentAssetsView.vue'),
    import('@/views/portfolio/ProductPurchaseView.vue'),
    import('@/views/portfolio/TimeCompressionView.vue'),
  ])
})

const isDrawerOpen = ref(false)
const isProfileOpen = ref(false)

const openProfile = () => {
  isDrawerOpen.value = false
  isProfileOpen.value = true
}

/** 탭 전환 방향: next = 오른쪽 탭으로, prev = 왼쪽 탭으로 */
const tabDir = ref('next')
watch(activeTab, (next, prev) => {
  const nextIdx = TAB_ORDER.indexOf(next)
  const prevIdx = TAB_ORDER.indexOf(prev)
  if (nextIdx < 0 || prevIdx < 0 || nextIdx === prevIdx) return
  tabDir.value = nextIdx > prevIdx ? 'next' : 'prev'
})

const tabTransition = computed(() => (tabDir.value === 'next' ? 'nav-tab-next' : 'nav-tab-prev'))
</script>

<template>
  <div class="relative mx-auto flex mobile-frame flex-col overflow-hidden">
    <AppTopBar
      v-if="showTopBar"
      title="Firstfolio"
      @menu-click="isDrawerOpen = true"
      @profile-click="openProfile"
    />
    <main class="relative z-0 min-h-0 flex-1 overflow-hidden">
      <RouterView v-slot="{ Component }">
        <Transition :name="tabTransition" mode="out-in">
          <KeepAlive :include="KEEP_ALIVE_TABS" :max="KEEP_ALIVE_TABS.length">
            <component :is="Component" :key="tabCacheKey" class="h-full min-h-0" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </main>
    <div v-if="!hideNavbar" class="nav-dock pointer-events-none absolute inset-x-0 bottom-0 z-20">
      <div class="nav-content-blur" aria-hidden="true" />
      <div class="pointer-events-auto">
        <AppNavbar />
      </div>
    </div>

    <AppDrawer :open="isDrawerOpen" @close="isDrawerOpen = false" @profile-click="openProfile" />
    <UserProfileModal :open="isProfileOpen" @close="isProfileOpen = false" />
  </div>
</template>
