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

const dotClass = computed(() => getAssetTypeMeta(props.holding.assetType).dotClass)
const sellActionLabel = computed(() => getAssetTypeMeta(props.holding.assetType).sellActionLabel)
const quantityUnit = computed(() => getAssetTypeMeta(props.holding.assetType).quantityUnit)

// 원금이 아니라 "지금 이 상품이 얼마짜리인지"(평가액)를 보여준다.
const displayAmount = computed(() => props.holding.valuationAmount ?? props.holding.principalAmount)
const formattedAmount = computed(() => `${displayAmount.value.toLocaleString('ko-KR')}원`)

// 평가액이 원금이랑 다르면(손익 발생) 작게 병기
const holdingProfitLoss = computed(() => displayAmount.value - props.holding.principalAmount)
const formattedQuantity = computed(() =>
  quantityUnit.value
    ? `${props.holding.quantity.toLocaleString('ko-KR')}${quantityUnit.value}`
    : null,
)
</script>

<template>
  <li
    class="group flex items-center justify-between gap-3 border border-transparent px-3 py-3 transition-all hover:mx-1 hover:my-1 hover:rounded-xl hover:border-[var(--pf-highlight)] hover:bg-white/12"
  >
    <div class="flex min-w-0 items-start gap-2">
      <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="dotClass" />
      <div class="min-w-0">
        <div class="flex items-baseline gap-1.5">
          <p class="truncate font-bold text-[var(--pf-text)]">{{ holding.displayName }}</p>
          <span v-if="formattedQuantity" class="shrink-0 text-xs text-[var(--pf-text-muted)]"
            >{{ formattedQuantity }} 보유</span
          >
        </div>
        <p class="truncate text-xs text-[var(--pf-text-muted)]">{{ holding.cycleSummary }}</p>
        <span
          v-if="holding.isPriceUnavailable"
          class="mt-1 inline-block w-fit rounded-full bg-[var(--pf-negative)]/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--pf-negative)]"
        >
          시세 정보 없음 · 매입 원금 기준
        </span>
        <div class="mt-1 flex items-baseline gap-1.5">
          <p class="text-lg font-bold text-[var(--pf-highlight)]">{{ formattedAmount }}</p>
          <span
            v-if="holdingProfitLoss !== 0"
            class="text-xs"
            :class="
              holdingProfitLoss > 0 ? 'text-[var(--pf-positive)]' : 'text-[var(--pf-negative)]'
            "
          >
            {{ holdingProfitLoss > 0 ? '+' : '' }}{{ holdingProfitLoss.toLocaleString('ko-KR') }}원
          </span>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="shrink-0 rounded-full border border-[var(--pf-card-border)] px-3 py-1.5 text-xs font-bold text-[var(--pf-text)] transition-colors group-hover:border-transparent group-hover:bg-[var(--pf-cta-bg)] group-hover:text-[var(--pf-cta-text)]"
      @click="$emit('request-sell', holding)"
    >
      {{ sellActionLabel }}
    </button>
  </li>
</template>
