<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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

/** AppBar/Nav fade (대단원 퀴즈 · 일일퀘스트) */
const IMMERSIVE_ROUTES = new Set(['learning-scenario-quiz', 'daily-quest'])

const SCENARIO_ROOM_CLASS = 'scenario-room'
const SCENARIO_ROOM_BG = '#1a1a2e'
const CORK_THEME_COLOR = '#f7f1e4'
const CROSSFADE_MS = 300

const route = useRoute()
const hideNavbar = computed(() => route.matched.some((record) => record.meta.hideNavbar === true))
const fromImmersive = ref(false)
/** 일일퀘스트 leave 직후 — AppLayout 콘텐츠에 scenario-route 적용 */
const fromDailyQuest = ref(false)
const chromeShown = ref(!hideNavbar.value)
const isDrawerOpen = ref(false)
const isProfileOpen = ref(false)
/** 일일퀘스트 진입 시 상담실 veil (대단원 퀴즈는 LearningShellView가 담당) */
const isDailyQuestRoom = ref(route.name === 'daily-quest')
let chromeTimer
let roomTimer

function isImmersiveRoute(name) {
  return IMMERSIVE_ROUTES.has(name)
}

function crossfadeMs() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : CROSSFADE_MS
}

function clearChromeTimer() {
  if (chromeTimer) {
    window.clearTimeout(chromeTimer)
    chromeTimer = undefined
  }
}

function clearRoomTimer() {
  if (roomTimer) {
    window.clearTimeout(roomTimer)
    roomTimer = undefined
  }
}

function syncDocumentRoom(on) {
  document.documentElement.classList.toggle(SCENARIO_ROOM_CLASS, on)
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', on ? SCENARIO_ROOM_BG : CORK_THEME_COLOR)
}

watch(
  () => route.name,
  (name, prev) => {
    fromImmersive.value = isImmersiveRoute(prev)
    fromDailyQuest.value = prev === 'daily-quest'
    const immersiveFlow = isImmersiveRoute(name) || fromImmersive.value
    clearChromeTimer()

    if (!immersiveFlow) {
      chromeShown.value = !hideNavbar.value
      return
    }

    if (hideNavbar.value) {
      chromeShown.value = false
      isDrawerOpen.value = false
      return
    }

    chromeTimer = window.setTimeout(() => {
      chromeShown.value = true
    }, crossfadeMs())
  },
)

if (isDailyQuestRoom.value) syncDocumentRoom(true)

onUnmounted(() => {
  clearChromeTimer()
  clearRoomTimer()
  if (isDailyQuestRoom.value) syncDocumentRoom(false)
})

const { activeTab } = useNavTabs()
const showTopBar = computed(() => chromeShown.value && TOP_BAR_TABS.includes(activeTab.value))
const showNavDock = computed(() => chromeShown.value)
const chromeTransition = computed(() =>
  isImmersiveRoute(route.name) || fromImmersive.value ? 'scenario-chrome' : '',
)

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

const pageTransition = computed(() => {
  if (route.name === 'daily-quest' || fromDailyQuest.value) return 'scenario-route'
  return tabDir.value === 'next' ? 'nav-tab-next' : 'nav-tab-prev'
})

const onAfterLeave = () => {
  const on = route.name === 'daily-quest'
  isDailyQuestRoom.value = on
  clearRoomTimer()
  if (on) {
    roomTimer = window.setTimeout(() => syncDocumentRoom(true), crossfadeMs())
    return
  }
  syncDocumentRoom(false)
}
</script>

<template>
  <div class="relative mx-auto flex mobile-frame flex-col overflow-hidden">
    <div
      class="scenario-room-veil pointer-events-none absolute inset-0 z-0"
      :class="{ 'is-on': isDailyQuestRoom }"
      aria-hidden="true"
    />
    <Teleport to="body">
      <div
        class="scenario-room-veil pointer-events-none fixed inset-0 z-0"
        :class="{ 'is-on': isDailyQuestRoom }"
        aria-hidden="true"
      />
    </Teleport>

    <Transition :name="chromeTransition">
      <AppTopBar
        v-if="showTopBar"
        title="firstfolio"
        class="relative z-30"
        @menu-click="isDrawerOpen = true"
        @profile-click="openProfile"
      />
    </Transition>
    <main class="relative z-10 min-h-0 flex-1 overflow-hidden">
      <RouterView v-slot="{ Component }">
        <KeepAlive :include="KEEP_ALIVE_TABS" :max="KEEP_ALIVE_TABS.length">
          <Transition :name="pageTransition" mode="out-in" @after-leave="onAfterLeave">
            <component :is="Component" :key="tabCacheKey" class="h-full min-h-0" />
          </Transition>
        </KeepAlive>
      </RouterView>
    </main>
    <Transition :name="chromeTransition">
      <div v-if="showNavDock" class="nav-dock pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div class="nav-content-blur" aria-hidden="true" />
        <div class="pointer-events-auto">
          <AppNavbar />
        </div>
      </div>
    </Transition>

    <AppDrawer :open="isDrawerOpen" @close="isDrawerOpen = false" @profile-click="openProfile" />
    <UserProfileModal :open="isProfileOpen" @close="isProfileOpen = false" />
  </div>
</template>
