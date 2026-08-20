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

// API 금액은 "29999218.45"처럼 소수점이 붙은 문자열/숫자로 온다. 원화는 소수 단위가 없어서
// 화면 표시는 반올림해 정수로만 보여준다(내부 계산엔 원래 값을 그대로 쓴다).
const formatCurrency = (value) => `${Math.round(Number(value ?? 0)).toLocaleString('ko-KR')}원`

// 총자산 폭이 도넛 차트(96px 고정) 때문에 좁아, 금액 자릿수가 늘면 "원"이 다음 줄로
// 밀려 내려가는 문제가 있었다. 줄바꿈을 아예 막고(whitespace-nowrap) 자릿수에 맞춰
// 폰트 크기를 단계적으로 줄여 한 줄 안에 들어오게 한다.
const totalAssetText = computed(() => formatCurrency(props.summary.totalAssetValue))
const totalAssetFontClass = computed(() => {
  const length = totalAssetText.value.length
  if (length > 14) return 'text-[20px]'
  if (length > 11) return 'text-[24px]'
  return 'text-[30px]'
})

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

// 서버가 계산한 손익률(%, 최초 지급 모의투자금 대비) — 프론트에서 재계산하지 않고 그대로 쓴다.
const profitRateLabel = computed(() => {
  const rate = props.summary.profitRate
  if (rate == null) return null
  const sign = rate > 0 ? '+' : ''
  return `${sign}${Number(rate).toFixed(2)}%`
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
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <p class="font-serif text-[10px] font-bold tracking-wide text-[rgba(193,127,36,0.85)]">
            총 자산
          </p>
          <p
            class="font-pen whitespace-nowrap leading-tight text-[#2c1810]"
            :class="totalAssetFontClass"
          >
            {{ totalAssetText }}
          </p>
          <div class="mt-1 flex flex-col gap-0.5">
            <p class="whitespace-nowrap font-serif text-[11px] text-[rgba(41,33,26,0.55)]">
              현금
              <span class="font-bold text-[#2c1810]">{{
                formatCurrency(summary.cashBalance)
              }}</span>
            </p>
            <p class="whitespace-nowrap font-serif text-[11px] text-[rgba(41,33,26,0.55)]">
              평가손익 <span class="font-bold" :class="profitLossClass">{{ profitLossLabel }}</span>
            </p>
            <p
              v-if="profitRateLabel"
              class="whitespace-nowrap font-serif text-[11px] text-[rgba(41,33,26,0.55)]"
            >
              수익률 <span class="font-bold" :class="profitLossClass">{{ profitRateLabel }}</span>
            </p>
          </div>
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
