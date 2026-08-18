<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/store/dashboardStore.js'
import { resolveInvestmentStyle } from '@/utils/investmentStyle.js'
import { PORTFOLIO_LOCKED_MESSAGE } from '@/utils/foundationGuide.js'
import BaseLoading from '@/components/BaseLoading.vue'
import MemoPin from '@/components/MemoPin.vue'

const dashboardStore = useDashboardStore()
const router = useRouter()
const { portfolio, allocationView, totalAssetsDisplay, isLoading, error, portfolioAvailable } =
  storeToRefs(dashboardStore)

onMounted(() => {
  // HomeView에서 선조회; 미적재 시만 보완
  if (!portfolio.value) {
    dashboardStore.fetchDashboard()
  }
})

const ruledOffsets = computed(() => Array.from({ length: 8 }, (_, index) => 44 + index * 22))

const investmentStyle = computed(() => resolveInvestmentStyle(allocationView.value))

const emptyMessage = computed(() => {
  if (error.value) return error.value
  if (!portfolioAvailable.value) {
    return portfolio.value?.reason === 'NO_PORTFOLIO'
      ? '아직 포트폴리오가 없습니다.'
      : portfolio.value?.reason || '포트폴리오 정보가 없습니다.'
  }
  return '포트폴리오 정보가 없습니다.'
})

const goPortfolios = () => {
  if (dashboardStore.isPortfolioLocked.value) {
    router.push({ name: 'learning', query: { mainChapterId: '1' } })
    return
  }
  router.push({ name: 'portfolio-holdings' })
}
</script>

<template>
  <div class="memo-selectable relative w-full max-w-[346px]" data-testid="portfolio-summary">
    <MemoPin side="center" tone="portfolio" />

    <section
      class="relative min-h-[133px] w-full rotate-[0.8deg] overflow-hidden rounded border-[0.5px] border-[var(--portfolio-border)] bg-[var(--portfolio-surface)] shadow-[0_5px_14px_rgba(0,0,0,0.35)]"
      :aria-label="isPortfolioLocked ? PORTFOLIO_LOCKED_MESSAGE : '현재 포트폴리오로 이동'"
      role="button"
      tabindex="0"
      @click="goPortfolios"
      @keydown.enter="goPortfolios"
    >
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          v-for="top in ruledOffsets"
          :key="top"
          class="absolute left-0 h-px w-full bg-[var(--portfolio-line)]"
          :style="{ top: `${top}px` }"
        />
      </div>

      <div
        class="pointer-events-none absolute top-3 bottom-3 left-[26px] w-px bg-[var(--portfolio-margin)]"
        aria-hidden="true"
      />

      <div class="relative flex flex-col gap-2 py-5 pr-4 pl-[38px]">
        <BaseLoading
          v-if="isLoading && !portfolio"
          class="py-6 text-center"
          tone="onLight"
          size="2xs"
          message="포트폴리오를 불러오는 중…"
        />

        <div v-else-if="isPortfolioLocked" class="py-5 pr-2" data-testid="portfolio-summary-locked">
          <p class="font-serif text-[10px] font-bold tracking-wide text-[var(--portfolio-muted)]">
            포트폴리오 잠금
          </p>
          <p
            class="mt-1.5 font-serif text-[14px] leading-snug font-bold text-[var(--portfolio-ink)]"
          >
            {{ PORTFOLIO_LOCKED_MESSAGE }}
          </p>
          <p class="mt-2 font-serif text-[11px] text-[#c17f24]">기초 과정 학습 →</p>
        </div>

        <div
          v-else-if="error || !portfolioAvailable"
          class="py-6 text-center font-serif text-[10px] text-[var(--portfolio-muted)]"
        >
          {{ emptyMessage }}
        </div>

        <template v-else>
          <p class="font-serif text-[10px] text-[var(--portfolio-muted)]">현재 포트폴리오</p>

          <div class="flex items-baseline gap-1.5">
            <p class="font-serif font-bold text-[22px] leading-none text-[var(--portfolio-ink)]">
              {{ totalAssetsDisplay }}
            </p>
            <p class="font-serif text-[11px] text-[var(--portfolio-unit)]">원</p>
          </div>

          <div class="flex h-2.5 w-full overflow-hidden rounded-[3px]" aria-hidden="true">
            <div
              v-for="item in allocationView"
              :key="item.assetType"
              class="h-full"
              :style="{ width: `${item.ratio}%`, backgroundColor: item.color }"
            />
          </div>

          <div class="flex flex-wrap gap-2.5">
            <div
              v-for="item in allocationView"
              :key="`legend-${item.assetType}`"
              class="flex items-center gap-[3px]"
            >
              <span
                class="size-1.5 shrink-0 rounded-[3px]"
                :style="{ backgroundColor: item.color }"
                aria-hidden="true"
              />
              <span class="font-serif text-[8px] text-[var(--portfolio-legend)]">
                {{ item.label }} {{ Math.round(item.ratio) }}%
              </span>
            </div>
          </div>
        </template>
      </div>

      <div
        v-if="!isPortfolioLocked && portfolioSummary?.available"
        class="pointer-events-none absolute top-11 right-3 z-10 flex max-w-[42%] items-center gap-1.5 rounded-[14px] border-[0.5px] border-[var(--portfolio-chip-border)] bg-[var(--portfolio-chip-bg)] px-2.5 py-[5px]"
        aria-hidden="true"
      >
        <span class="font-serif text-[12px] leading-none text-[var(--portfolio-chip-label)]"
          >성향</span
        >
        <span
          class="truncate text-[13px] leading-none font-black text-[var(--portfolio-chip-value)]"
        >
          {{ investmentStyle }}
        </span>
      </div>
    </section>
  </div>
</template>
