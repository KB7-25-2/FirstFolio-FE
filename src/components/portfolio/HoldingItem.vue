<script setup>
import { computed } from 'vue'
import { getAssetTypeMeta } from '@/constants/assetType.js'

const CHART_ASSET_TYPES = new Set(['STOCK', 'FUND'])

// holding: {
//   holdingId, displayName, assetType,
//   cycleSummary,      // 백엔드가 완성 문자열로 내려줌 ("서비스 6일 만기 · 실제 6개월")
//   quantity, principalAmount
// }
const props = defineProps({
  holding: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['request-sell', 'select'])

const sellActionLabel = computed(() => getAssetTypeMeta(props.holding.assetType).sellActionLabel)
const quantityUnit = computed(() => getAssetTypeMeta(props.holding.assetType).quantityUnit)
const isSubscription = computed(
  () => getAssetTypeMeta(props.holding.assetType).tradeType === 'SUBSCRIPTION',
)
const isSelectable = computed(() => CHART_ASSET_TYPES.has(props.holding.assetType))

const handleSelect = () => {
  if (!isSelectable.value) return
  emit('select', props.holding)
}

// 원금이 아니라 "지금 이 상품이 얼마짜리인지"(평가액)를 보여준다.
const displayAmount = computed(() => props.holding.valuationAmount ?? props.holding.principalAmount)
const formattedAmount = computed(
  () => `${Math.round(displayAmount.value).toLocaleString('ko-KR')}원`,
)

const formattedQuantity = computed(() =>
  quantityUnit.value
    ? `${props.holding.quantity.toLocaleString('ko-KR')}${quantityUnit.value}`
    : '',
)

// 매수형(주식·펀드)의 "현재가" — 만기 없는 자산군이라 cycleSummary 대신 여기 노출한다.
const formattedUnitPrice = computed(() =>
  !isSubscription.value && props.holding.unitPrice != null
    ? `${Math.round(props.holding.unitPrice).toLocaleString('ko-KR')}원`
    : null,
)
const formattedSecondaryLine = computed(() => {
  // 매수형은 가격 정보를 아래 전용 줄(매입가/현재가/수익률)에서 따로 보여주니,
  // 여기(수량 줄)엔 수량만 남긴다. 예·적금·채권은 그대로 만기 정보를 붙인다.
  const parts = isSubscription.value
    ? [formattedQuantity.value, props.holding.cycleSummary]
    : [formattedQuantity.value]
  return parts.filter(Boolean).join(' · ')
})

// 매입가(평단가) — 매수형(주식·펀드)에만 있다(예·적금·채권은 mapHoldingFromApi에서
// averageCost를 null로 둠, "평균낼 것이 없는 상품"이라서).
const formattedAverageCost = computed(() =>
  !isSubscription.value && props.holding.averageCost != null
    ? `${Math.round(props.holding.averageCost).toLocaleString('ko-KR')}원`
    : null,
)

const hasPriceRow = computed(
  () =>
    !isSubscription.value &&
    (formattedAverageCost.value != null || formattedUnitPrice.value != null),
)

// 수익률 = (현재가 - 매입가) / 매입가 * 100. 매입가가 있는 매수형 상품에서만 계산된다.
const profitRate = computed(() => {
  if (isSubscription.value) return null
  const cost = props.holding.averageCost
  const price = props.holding.unitPrice
  if (cost == null || price == null || cost <= 0) return null
  return ((price - cost) / cost) * 100
})
const formattedProfitRate = computed(() => {
  if (profitRate.value == null) return null
  const sign = profitRate.value > 0 ? '+' : ''
  return `${sign}${profitRate.value.toFixed(1)}%`
})
const profitRateClass = computed(() => {
  if (profitRate.value == null) return ''
  if (profitRate.value > 0) return 'text-[var(--pf-positive)]'
  if (profitRate.value < 0) return 'text-[var(--pf-negative)]'
  return 'text-[rgba(41,33,26,0.5)]'
})
</script>

<template>
  <li
    class="flex flex-col gap-2 rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.18)] bg-white/55 px-3.5 py-3 transition-colors"
    :class="isSelectable ? 'cursor-pointer hover:bg-[rgba(193,127,36,0.1)]' : ''"
    :role="isSelectable ? 'button' : undefined"
    :tabindex="isSelectable ? 0 : undefined"
    @click="handleSelect"
    @keydown.enter.prevent="handleSelect"
    @keydown.space.prevent="handleSelect"
  >
    <div class="flex items-center justify-between gap-2">
      <p class="truncate font-serif text-sm font-bold text-[#2c1810]">{{ holding.displayName }}</p>
      <p class="shrink-0 font-serif text-[13px] font-bold text-[#c17f24]">{{ formattedAmount }}</p>
    </div>

    <div class="flex items-center justify-between gap-2">
      <p class="truncate font-serif text-[11px] text-[rgba(41,33,26,0.55)]">
        {{ formattedSecondaryLine }}
      </p>
      <button
        type="button"
        class="shrink-0 rounded-full bg-[#2c1810] px-2.5 py-1 font-serif text-[10px] font-bold text-[#fff8ec] transition-colors hover:bg-[#4a2e1c]"
        @click.stop="emit('request-sell', holding)"
      >
        {{ sellActionLabel }}
      </button>
    </div>

    <div
      v-if="hasPriceRow"
      class="mt-1 flex items-center gap-x-3 gap-y-0.5 rounded-[3px] bg-[rgba(193,127,36,0.06)] px-2 py-1.5 font-serif text-[10px]"
    >
      <span v-if="formattedAverageCost" class="text-[rgba(41,33,26,0.5)]">
        매입가 <span class="font-bold text-[rgba(41,33,26,0.75)]">{{ formattedAverageCost }}</span>
      </span>
      <span v-if="formattedUnitPrice" class="text-[rgba(41,33,26,0.5)]">
        현재가 <span class="font-bold text-[#c17f24]">{{ formattedUnitPrice }}</span>
      </span>
      <span v-if="formattedProfitRate" class="ml-auto font-bold" :class="profitRateClass">
        {{ formattedProfitRate }}
      </span>
    </div>

    <span
      v-if="holding.isPriceUnavailable"
      class="mt-0.5 inline-block w-fit rounded-full bg-[rgba(192,67,63,0.12)] px-1.5 py-0.5 font-serif text-[9px] font-bold text-[#c0433f]"
    >
      시세 정보 없음 · 매입 원금 기준
    </span>
  </li>
</template>
