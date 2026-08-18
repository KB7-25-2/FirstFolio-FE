<script setup>
import { computed } from 'vue'
import MemoPin from '@/components/MemoPin.vue'
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
  if (props.summary.profitLossAmount > 0) return 'text-[#1D9E75]'
  if (props.summary.profitLossAmount < 0) return 'text-[#c0433f]'
  return 'text-[rgba(41,33,26,0.55)]'
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
  <div class="relative w-full">
    <MemoPin side="left" tone="portfolio" />

    <section
      class="relative w-full -rotate-[0.6deg] overflow-hidden rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.4)] bg-[#fff8ec] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
    >
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-[#c17f24]"
        aria-hidden="true"
      />

      <div class="relative flex items-start justify-between gap-4 pt-1.5">
        <div class="flex flex-col gap-1">
          <p class="font-serif text-[10px] font-bold tracking-wide text-[rgba(193,127,36,0.85)]">
            총 자산
          </p>
          <p class="font-pen text-[30px] leading-none text-[#2c1810]">
            {{ formatCurrency(summary.totalAssetValue) }}
          </p>
          <p class="mt-1 font-serif text-[11px] text-[rgba(41,33,26,0.55)]">
            현금 {{ formatCurrency(summary.cashBalance) }} · 평가손익
            <span :class="profitLossClass">{{ profitLossLabel }}</span>
          </p>
        </div>

        <AllocationDonutChart :segments="summary.allocations">
          <template v-if="investedRatio !== null">
            <span class="font-serif text-base font-bold text-[#2c1810]">{{ investedRatio }}%</span>
            <span class="font-serif text-[8px] text-[rgba(41,33,26,0.45)]">투자 비중</span>
          </template>
        </AllocationDonutChart>
      </div>

      <p class="mt-3 font-serif text-[10px] font-bold tracking-wide text-[rgba(41,33,26,0.4)]">
        보유 {{ activeHoldingCount }}개 상품
      </p>

      <ul class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        <li
          v-for="item in summary.allocations"
          :key="item.label"
          class="flex items-center gap-1.5 font-serif text-[10px] text-[rgba(41,33,26,0.55)]"
        >
          <span class="size-1.5 rounded-full" :style="{ backgroundColor: item.color }" />
          {{ item.label }} {{ item.ratio }}%
        </li>
      </ul>
    </section>
  </div>
</template>
