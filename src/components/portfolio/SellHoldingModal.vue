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

// 예·적금·채권(가입형)은 입력 없이 항상 전액 해지. 주식·펀드(매수형)는 정수 개수 입력, 보유 이하만 가능.
const meta = computed(() => getAssetTypeMeta(props.holding.assetType))
const isSubscription = computed(() => meta.value.tradeType === 'SUBSCRIPTION')
const actionLabel = computed(() => meta.value.sellActionLabel)
const modalTitle = computed(() => `보유 상품 ${actionLabel.value}`)
const confirmLabel = computed(() => `${actionLabel.value}하기`)
const processingLabel = computed(() => `${actionLabel.value} 처리 중…`)

const holdingValue = computed(() => props.holding.valuationAmount ?? props.holding.principalAmount)

// 매수형만 쓰는 개수 입력 — 실제 거래 API에 quantity 그대로 보낸다(금액 환산 안 함).
const quantity = ref(1)
const estimatedAmount = computed(() =>
  props.holding.unitPrice ? quantity.value * props.holding.unitPrice : 0,
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
  // 가입형은 quantity 없이 확인만(서버가 전액 처리). 매수형은 quantity 그대로 전달.
  emit('confirm', isSubscription.value ? undefined : quantity.value)
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

    <!-- 예·적금·채권: 입력 없이 금액 읽기 전용 -->
    <div
      v-if="isSubscription"
      class="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-[var(--pf-text)]"
    >
      {{ holdingValue.toLocaleString('ko-KR') }}원 전액 {{ actionLabel }}
    </div>

    <!-- 주식·펀드: 정수 개수 입력 -->
    <div v-else class="mt-4">
      <div class="mb-1.5 flex items-center justify-between text-xs text-[var(--pf-text-muted)]">
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
      <p class="mt-1.5 text-xs text-[var(--pf-text-muted)]">
        예상 {{ actionLabel }} 금액 {{ estimatedAmount.toLocaleString('ko-KR') }}원
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
