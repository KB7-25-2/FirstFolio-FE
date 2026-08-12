<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import AppTopBar from '@/components/AppTopBar.vue'
import AppDrawer from '@/components/AppDrawer.vue'
import UserProfileModal from '@/components/UserProfileModal.vue'
import { useNavTabs } from '@/composables/useNavTabs.js'
import { useUserStore } from '@/store/userStore.js'

/** 상단 앱바를 쓰는 아이보리 대시보드 탭 (포트폴리오·상점은 자체 다크 헤더 사용) */
const TOP_BAR_TABS = ['home', 'daily', 'learning', 'portfolios', 'point-market']

const route = useRoute()
const hideNavbar = computed(() => route.matched.some((record) => record.meta.hideNavbar === true))

const { activeTab } = useNavTabs()
const showTopBar = computed(() => !hideNavbar.value && TOP_BAR_TABS.includes(activeTab.value))

const userStore = useUserStore()
onMounted(() => {
  if (!userStore.profile) userStore.fetchProfile()
})

const isDrawerOpen = ref(false)
const isProfileOpen = ref(false)

const openProfile = () => {
  isDrawerOpen.value = false
  isProfileOpen.value = true
}
</script>

<template>
  <div class="relative mx-auto flex mobile-frame flex-col overflow-hidden">
    <AppTopBar
      v-if="showTopBar"
      title="Firstfolio"
      @menu-click="isDrawerOpen = true"
      @profile-click="openProfile"
    />
    <main class="relative z-0 min-h-0 flex-1 overflow-y-auto hide-scrollbar">
      <RouterView />
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
