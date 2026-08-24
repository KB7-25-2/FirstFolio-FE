<script setup>
import { ref, computed } from 'vue'
import PortfolioModal from '@/components/portfolio/PortfolioModal.vue'
import AmountInput from '@/components/portfolio/AmountInput.vue'
import { getAssetTypeMeta } from '@/constants/assetType.js'
import {
  calcSellProfit,
  formatSignedKrw,
  formatSignedRate,
  getEstimatedSellProceeds,
  getSellCostBasis,
  sellProfitToneClass,
} from '@/utils/sellProfit.js'

const props = defineProps({
  holding: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['close', 'confirm'])

// 예·적금·채권(가입형)은 입력 없이 항상 전액 해지. 주식·펀드(매수형)는 정수 개수 입력, 보유 이하만 가능.
const meta = computed(() => getAssetTypeMeta(props.holding.assetType))
const isSubscription = computed(() => meta.value.tradeType === 'SUBSCRIPTION')
const actionLabel = computed(() => meta.value.sellActionLabel)
const modalTitle = computed(() => `보유 상품 ${actionLabel.value}`)
const confirmLabel = computed(() => `${actionLabel.value}하기`)
const processingLabel = computed(() => `${actionLabel.value} 처리 중…`)

const holdingValue = computed(() => props.holding.valuationAmount ?? props.holding.principalAmount)

const quantity = ref(1)
const sellQuantity = computed(() => (isSubscription.value ? undefined : quantity.value))
const costBasisAmount = computed(() => getSellCostBasis(props.holding, sellQuantity.value))
const estimatedAmount = computed(() => getEstimatedSellProceeds(props.holding, sellQuantity.value))
const estimatedProfit = computed(() =>
  calcSellProfit({
    proceeds: estimatedAmount.value,
    costBasis: costBasisAmount.value,
  }),
)

const canConfirm = computed(() => {
  if (isSubscription.value) return holdingValue.value > 0
  return (
    Number.isInteger(quantity.value) &&
    quantity.value >= 1 &&
    quantity.value <= props.holding.quantity
  )
})

const handleConfirm = () => {
  if (!canConfirm.value || props.isSubmitting) return
  emit('confirm', isSubscription.value ? undefined : quantity.value)
}

const handleClose = () => {
  if (props.isSubmitting) return
  emit('close')
}
</script>

<template>
  <PortfolioModal :title="modalTitle" @close="handleClose">
    <p class="font-serif text-sm font-bold text-[#f5edd9]">{{ holding.displayName }}</p>
    <p class="font-serif text-xs text-[rgba(245,237,217,0.6)]">{{ holding.cycleSummary }}</p>

    <div
      v-if="isSubscription"
      class="mt-4 rounded-lg bg-[rgba(245,237,217,0.06)] px-3 py-2.5 font-serif text-sm text-[#f5edd9]"
    >
      {{ holdingValue.toLocaleString('ko-KR') }}원 전액 {{ actionLabel }}
    </div>

    <div v-else class="mt-4">
      <div
        class="mb-1.5 flex items-center justify-between font-serif text-xs text-[rgba(245,237,217,0.6)]"
      >
        <span>{{ actionLabel }} 개수</span>
        <span
          >보유 {{ holding.quantity.toLocaleString('ko-KR') }}{{ meta.quantityUnit }} · 최대
          {{ holding.quantity.toLocaleString('ko-KR') }}{{ meta.quantityUnit }}</span
        >
      </div>
      <AmountInput
        v-model="quantity"
        :min="1"
        :max="holding.quantity"
        :unit="meta.quantityUnit"
        max-button-label="전량"
        :disabled="isSubmitting"
      />
      <p class="mt-1.5 font-serif text-xs text-[rgba(245,237,217,0.6)]">
        예상 {{ actionLabel }} 금액 {{ estimatedAmount.toLocaleString('ko-KR') }}원
      </p>
    </div>

    <div
      v-if="estimatedProfit && costBasisAmount != null"
      class="mt-3 rounded-lg bg-[rgba(245,237,217,0.06)] px-3 py-2.5 font-serif text-sm"
    >
      <div class="flex items-center justify-between text-xs text-[rgba(245,237,217,0.6)]">
        <span>매입 금액</span>
        <span>{{ Math.round(costBasisAmount).toLocaleString('ko-KR') }}원</span>
      </div>
      <div class="mt-1.5 flex items-center justify-between font-bold">
        <span class="text-[#f5edd9]">예상 손익</span>
        <span :class="sellProfitToneClass(estimatedProfit.amount)">
          {{ formatSignedKrw(estimatedProfit.amount) }}
          <span v-if="estimatedProfit.rate != null" class="ml-1 text-xs font-semibold">
            {{ formatSignedRate(estimatedProfit.rate) }}
          </span>
        </span>
      </div>
    </div>

    <p v-if="errorMessage" class="mt-3 font-serif text-xs text-[#f0b4b4]">
      {{ errorMessage }}
    </p>

    <div class="mt-5 flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-xl border-[0.5px] border-[rgba(245,237,217,0.18)] py-2.5 font-serif text-sm text-[rgba(245,237,217,0.85)] transition-colors hover:enabled:bg-[rgba(245,237,217,0.08)] disabled:opacity-40"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        취소
      </button>
      <button
        type="button"
        class="flex-1 rounded-xl bg-[rgba(193,127,36,0.92)] py-2.5 font-serif text-sm font-bold text-[#1a1208] transition-colors hover:enabled:bg-[#c17f24] disabled:opacity-40"
        :disabled="!canConfirm || isSubmitting"
        @click="handleConfirm"
      >
        {{ isSubmitting ? processingLabel : confirmLabel }}
      </button>
    </div>
  </PortfolioModal>
</template>
