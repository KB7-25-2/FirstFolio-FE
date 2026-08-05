<script setup>
import { ref, computed } from 'vue'
import PortfolioModal from '@/components/portfolio/PortfolioModal.vue'
import QuantityStepper from '@/components/portfolio/QuantityStepper.vue'
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

// 예·적금은 "해지", 주식·채권은 "매도", 펀드는 "환매" — 자산군별 정확한 금융 용어
const actionLabel = computed(() => getAssetTypeMeta(props.holding.assetType).sellActionLabel)
const modalTitle = computed(() => `보유 상품 ${actionLabel.value}`)
const confirmLabel = computed(() => `${actionLabel.value}하기`)
const processingLabel = computed(() => `${actionLabel.value} 처리 중…`)
const quantityFieldLabel = computed(() => `${actionLabel.value} 개수`)

const isFixedQuantity = computed(() => props.holding.quantity <= 1)
const quantity = ref(isFixedQuantity.value ? props.holding.quantity : 1)
const quantityUnit = computed(() => getAssetTypeMeta(props.holding.assetType).quantityUnit ?? '')

const estimatedAmount = computed(() => quantity.value * props.holding.unitPrice)

const handleConfirm = () => {
  if (props.isSubmitting) return
  emit('confirm', quantity.value)
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

    <div class="mt-4 flex items-center justify-between">
      <span class="text-xs text-[var(--pf-text-muted)]">
        {{ quantityFieldLabel }}
        <span v-if="!isFixedQuantity" class="text-[var(--pf-text-faint)]"
          >(보유 {{ holding.quantity }}{{ quantityUnit }})</span
        >
      </span>
      <span v-if="isFixedQuantity" class="text-sm text-[var(--pf-text)]">전량 (1개)</span>
      <QuantityStepper
        v-else
        v-model="quantity"
        :min="1"
        :max="holding.quantity"
        :unit="quantityUnit"
        :disabled="isSubmitting"
      />
    </div>

    <div class="mt-3 flex items-center justify-between text-sm">
      <span class="text-[var(--pf-text-muted)]">예상 {{ actionLabel }} 금액</span>
      <span class="font-bold text-[var(--pf-text)]"
        >{{ estimatedAmount.toLocaleString('ko-KR') }}원</span
      >
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
        class="flex-1 rounded-full bg-[var(--pf-cta-bg)] py-2 text-sm font-bold text-[var(--pf-cta-text)] disabled:opacity-60"
        :disabled="isSubmitting"
        @click="handleConfirm"
      >
        {{ isSubmitting ? processingLabel : confirmLabel }}
      </button>
    </div>
  </PortfolioModal>
</template>
