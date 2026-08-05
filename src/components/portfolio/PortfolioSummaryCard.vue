<script setup>
import { computed } from 'vue'
import AllocationDonutChart from '@/components/portfolio/AllocationDonutChart.vue'

// summary: {
//   totalAssetValue, cashBalance, profitLossAmount, goalAchievementRate,
//   allocations: [{ label, ratio, color }]
// }
const props = defineProps({
  summary: {
    type: Object,
    required: true,
  },
})

const formatCurrency = (value) => `${Number(value ?? 0).toLocaleString('ko-KR')}원`

const profitLossClass = computed(() => {
  if (props.summary.profitLossAmount > 0) return 'text-[var(--pf-positive)]'
  if (props.summary.profitLossAmount < 0) return 'text-[var(--pf-negative)]'
  return 'text-[var(--pf-text-muted)]'
})

const profitLossLabel = computed(() => {
  const amount = props.summary.profitLossAmount ?? 0
  const sign = amount > 0 ? '+' : ''
  return `${sign}${formatCurrency(amount)}`
})

// 총자산 대비 현금을 제외한 투자 비중(%). 총자산이 0이면 계산하지 않는다.
const investedRatio = computed(() => {
  const total = props.summary.totalAssetValue
  if (!total) return null
  const invested = total - props.summary.cashBalance
  return Math.round((invested / total) * 100)
})

// 매도/만기 완료(SOLD, MATURED)는 세지 않고, 현재 보유 중(ACTIVE)인 상품 개수만 센다.
const activeHoldingCount = computed(
  () => props.summary.holdings.filter((holding) => holding.status === 'ACTIVE').length,
)
</script>

<template>
  <section
    class="rounded-2xl border border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
  >
    <span
      class="mb-2 inline-block rounded-full bg-white/10 px-2 py-0.5 font-pen text-xs text-[var(--pf-highlight)]"
    >
      보유 자산 현황
    </span>

    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <p class="text-xs text-[var(--pf-text-muted)]">보유 자산 요약</p>
        <p class="text-xs text-[var(--pf-text-muted)]">총 자산</p>
        <p class="text-2xl font-bold text-[var(--pf-text)]">
          {{ formatCurrency(summary.totalAssetValue) }}
        </p>
        <p class="text-xs text-[var(--pf-text-muted)]">
          현금 {{ formatCurrency(summary.cashBalance) }}
        </p>
        <p class="text-xs" :class="profitLossClass">평가손익 {{ profitLossLabel }}</p>
      </div>

      <AllocationDonutChart :segments="summary.allocations">
        <template v-if="investedRatio !== null">
          <span class="text-lg font-bold text-[var(--pf-text)]">{{ investedRatio }}%</span>
          <span class="text-[9px] text-[var(--pf-text-muted)]">투자 비중</span>
        </template>
      </AllocationDonutChart>
    </div>

    <p class="mt-4 text-xs text-[var(--pf-text-muted)]">보유 {{ activeHoldingCount }}개 상품</p>

    <ul class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
      <li
        v-for="item in summary.allocations"
        :key="item.label"
        class="flex items-center gap-1.5 text-xs text-[var(--pf-text-muted)]"
      >
        <span class="size-1.5 rounded-full" :style="{ backgroundColor: item.color }" />
        {{ item.label }} {{ item.ratio }}%
      </li>
    </ul>
  </section>
</template>
