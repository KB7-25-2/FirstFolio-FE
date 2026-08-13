<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/userStore.js'
import { formatKoreanDate } from '@/utils/date.js'
import { PORTFOLIO_LOCKED_MESSAGE } from '@/utils/foundationGuide.js'
import PortfolioSummary from '@/components/PortfolioSummary.vue'
import StudyNote from '@/components/StudyNote.vue'
import PointShopNote from '@/components/PointShopNote.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'
import FoundationGuideOverlay from '@/components/FoundationGuideOverlay.vue'
import BaseToast from '@/components/BaseToast.vue'
import { useFoundationGuide } from '@/composables/useFoundationGuide.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { greeting } = storeToRefs(userStore)

const todayLabel = computed(() => formatKoreanDate())
const showPortfolioLockedToast = ref(false)

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

const closePortfolioLockedToast = () => {
  showPortfolioLockedToast.value = false
}
</script>

<template>
  <div class="cork-board flex h-full flex-col overflow-hidden">
    <div
      data-scroll-reveal-root
      class="nav-scroll-pad flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-5"
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
        <span
          class="shrink-0 rounded-full border-[0.5px] border-[rgba(193,127,36,0.4)] bg-[rgba(193,127,36,0.08)] px-2.5 py-1 font-serif text-[12px] whitespace-nowrap text-[var(--nav-active-primary)]"
        >
          오늘 출석 완료
        </span>
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
  </div>
</template>
