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
</script>

<template>
  <section
    class="rounded-2xl border border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
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
        <template v-if="summary.goalAchievementRate !== null">
          <span class="text-lg font-bold text-[var(--pf-text)]"
            >{{ summary.goalAchievementRate }}%</span
          >
          <span class="text-[9px] text-[var(--pf-text-muted)]">목표 달성</span>
        </template>
      </AllocationDonutChart>
    </div>

    <ul class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
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
