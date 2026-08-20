<script setup>
import { computed } from 'vue'
import { getAssetTypeMeta } from '@/constants/assetType.js'

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

defineEmits(['request-sell'])

const sellActionLabel = computed(() => getAssetTypeMeta(props.holding.assetType).sellActionLabel)
const quantityUnit = computed(() => getAssetTypeMeta(props.holding.assetType).quantityUnit)
const isSubscription = computed(
  () => getAssetTypeMeta(props.holding.assetType).tradeType === 'SUBSCRIPTION',
)

// 원금이 아니라 "지금 이 상품이 얼마짜리인지"(평가액)를 보여준다.
const displayAmount = computed(() => props.holding.valuationAmount ?? props.holding.principalAmount)
const formattedAmount = computed(() => `${displayAmount.value.toLocaleString('ko-KR')}원`)

const formattedQuantity = computed(() =>
  quantityUnit.value
    ? `${props.holding.quantity.toLocaleString('ko-KR')}${quantityUnit.value}`
    : '',
)

// 예·적금·채권(SUBSCRIPTION)은 cycleSummary(만기·이자주기)가 있지만, 주식·펀드(MARKET)는
// 만기 개념이 없어 cycleSummary가 항상 null이다 — 그 자리에 대신 현재가(unitPrice)를 보여준다.
// unitPrice는 mapHoldingFromApi에서 이미 valuationAmount / quantity로 계산돼 있다.
const formattedUnitPrice = computed(() =>
  props.holding.unitPrice != null
    ? `현재가 ${Math.round(props.holding.unitPrice).toLocaleString('ko-KR')}원`
    : null,
)
const secondaryText = computed(() =>
  isSubscription.value
    ? props.holding.cycleSummary
    : (formattedUnitPrice.value ?? props.holding.cycleSummary),
)
const formattedSecondaryLine = computed(() => {
  const parts = [formattedQuantity.value, secondaryText.value].filter(Boolean)
  return parts.join(' · ')
})
</script>

<template>
  <li
    class="flex flex-col gap-1 rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.18)] bg-white/55 px-3.5 py-3"
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
        class="shrink-0 rounded-full bg-[#2c1810] px-2.5 py-1 font-serif text-[10px] font-bold text-[#fff8ec]"
        @click="$emit('request-sell', holding)"
      >
        {{ sellActionLabel }}
      </button>
    </div>

    <span
      v-if="holding.isPriceUnavailable"
      class="mt-0.5 inline-block w-fit rounded-full bg-[rgba(192,67,63,0.12)] px-1.5 py-0.5 font-serif text-[9px] font-bold text-[#c0433f]"
    >
      시세 정보 없음 · 매입 원금 기준
    </span>
  </li>
</template>
