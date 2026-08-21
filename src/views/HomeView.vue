<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/userStore.js'
import { useDashboardStore } from '@/store/dashboardStore.js'
import { useStudyStore } from '@/store/studyStore.js'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import { formatKoreanDate } from '@/utils/date.js'
import { PORTFOLIO_LOCKED_MESSAGE } from '@/utils/foundationGuide.js'
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import StudyNote from '@/components/StudyNote.vue'
import PointShopNote from '@/components/PointShopNote.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'
import FoundationGuideOverlay from '@/components/FoundationGuideOverlay.vue'
import FoundationUnlockCeremony from '@/components/FoundationUnlockCeremony.vue'
import BaseToast from '@/components/BaseToast.vue'
import { useFoundationGuide } from '@/composables/useFoundationGuide.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const dashboardStore = useDashboardStore()
const portfolioStore = usePortfolioStore()
const studyStore = useStudyStore()
const { greeting } = storeToRefs(userStore)

const todayLabel = computed(() => formatKoreanDate())
const showPortfolioLockedToast = ref(false)
const showUnlockPreview = ref(false)

const { isOpen, dismiss, startFoundation } = useFoundationGuide()

watch(
  () => route.query.portfolioLocked,
  (locked) => {
    if (locked !== '1') return
    showPortfolioLockedToast.value = true
    router.replace({ name: 'home' })
  },
  { immediate: true },
)

watch(
  () => route.query.unlockCeremony,
  (preview) => {
    if (preview !== '1') return
    showUnlockPreview.value = true
    router.replace({ name: 'home' })
  },
  { immediate: true },
)

const closePortfolioLockedToast = () => {
  showPortfolioLockedToast.value = false
}

const confirmUnlockPreview = async () => {
  await studyStore.fetchCurriculum()
  await portfolioStore.grantFoundationCash()
  studyStore.clearFoundationUnlock()
  showUnlockPreview.value = false
  await router.push({ name: 'portfolio-purchase' })
}

const dismissUnlockPreview = () => {
  showUnlockPreview.value = false
}

onMounted(() => {
  dashboardStore.ensureDashboard()
})

onActivated(() => {
  dashboardStore.ensureDashboard()
})
</script>

<template>
  <div class="cork-board flex h-full flex-col overflow-hidden">
    <div
      data-scroll-reveal-root
      class="nav-scroll-pad flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-4"
    >
      <div class="flex shrink-0 items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="font-serif text-[10px] tracking-wide text-[var(--cork-ink-faint)]">
            {{ todayLabel }}
          </p>
          <p class="mt-0.5 truncate font-serif text-[12px] font-bold text-[var(--cork-ink-muted)]">
            {{ greeting }}
          </p>
        </div>
      </div>

      <ScrollReveal class="flex justify-center">
        <PortfolioSummary />
      </ScrollReveal>

      <!-- ScrollReveal transform이 stacking을 가리므로 가이드+StudyNote는 밖에 둔다 -->
      <div class="flex justify-center">
        <FoundationGuideOverlay :open="isOpen" @dismiss="dismiss" @start="startFoundation">
          <StudyNote />
        </FoundationGuideOverlay>
      </div>

      <ScrollReveal class="flex justify-center">
        <PointShopNote />
      </ScrollReveal>
    </div>

    <BaseToast
      :open="showPortfolioLockedToast"
      :message="PORTFOLIO_LOCKED_MESSAGE"
      data-testid="portfolio-locked-toast"
      @close="closePortfolioLockedToast"
    />

    <FoundationUnlockCeremony
      :open="showUnlockPreview"
      @confirm="confirmUnlockPreview"
      @close="dismissUnlockPreview"
    />
  </div>
</template>
