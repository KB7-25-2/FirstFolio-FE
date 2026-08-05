<script setup>
import { ref, computed } from 'vue'
import PortfolioModal from '@/components/portfolio/PortfolioModal.vue'
import AmountInput from '@/components/portfolio/AmountInput.vue'
import { getAssetTypeMeta } from '@/constants/assetType.js'

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

// 예·적금·채권은 "해지"(항상 전액), 주식·채권은 "매도", 펀드는 "환매"(부분 가능)
const meta = computed(() => getAssetTypeMeta(props.holding.assetType))
const isSubscription = computed(() => meta.value.tradeType === 'SUBSCRIPTION')
const actionLabel = computed(() => meta.value.sellActionLabel)
const modalTitle = computed(() => `보유 상품 ${actionLabel.value}`)
const confirmLabel = computed(() => `${actionLabel.value}하기`)
const processingLabel = computed(() => `${actionLabel.value} 처리 중…`)

const holdingValue = computed(() => props.holding.valuationAmount ?? props.holding.principalAmount)
const amount = ref(isSubscription.value ? holdingValue.value : 0)

const estimatedQuantity = computed(() =>
  isSubscription.value || !props.holding.unitPrice
    ? null
    : Math.floor((amount.value / props.holding.unitPrice) * 1e6) / 1e6,
)

const canConfirm = computed(() => amount.value > 0 && amount.value <= holdingValue.value)

const handleConfirm = () => {
  if (!canConfirm.value || props.isSubmitting) return
  emit('confirm', amount.value)
}

const handleClose = () => {
  if (props.isSubmitting) return
  emit('close')
}
</script>

<template>
  <PortfolioModal :title="modalTitle" @close="handleClose">
    <p class="text-sm font-bold text-[var(--pf-text)]">{{ holding.displayName }}</p>
    <p class="text-xs text-[var(--pf-text-muted)]">{{ holding.cycleSummary }}</p>
    <p class="mt-1 text-xs text-[var(--pf-text-muted)]">
      보유 평가액 {{ holdingValue.toLocaleString('ko-KR') }}원
    </p>

    <div
      v-if="isSubscription"
      class="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-[var(--pf-text)]"
    >
      전액 {{ actionLabel }}돼요 · {{ holdingValue.toLocaleString('ko-KR') }}원
    </div>
    <div v-else class="mt-4">
      <p class="mb-1.5 text-xs text-[var(--pf-text-muted)]">{{ actionLabel }} 금액</p>
      <AmountInput v-model="amount" :min="0" :max="holdingValue" :disabled="isSubmitting" />
      <p v-if="estimatedQuantity !== null" class="mt-1.5 text-xs text-[var(--pf-text-muted)]">
        예상 {{ actionLabel }} 수량 {{ estimatedQuantity.toLocaleString('ko-KR')
        }}{{ meta.quantityUnit }}
      </p>
    </div>

    <p v-if="errorMessage" class="mt-3 text-xs text-[var(--pf-negative)]">
      {{ errorMessage }}
    </p>

    <div class="mt-5 flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-full border border-[var(--pf-card-border)] py-2 text-sm text-[var(--pf-text)] disabled:opacity-40"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        취소
      </button>
      <button
        type="button"
        class="flex-1 rounded-full bg-[var(--pf-cta-bg)] py-2 text-sm font-bold text-[var(--pf-cta-text)] disabled:opacity-40"
        :disabled="!canConfirm || isSubmitting"
        @click="handleConfirm"
      >
        {{ isSubmitting ? processingLabel : confirmLabel }}
      </button>
    </div>
  </PortfolioModal>
</template>
