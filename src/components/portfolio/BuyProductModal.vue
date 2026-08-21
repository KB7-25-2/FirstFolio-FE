<script setup>
import { ref, computed } from 'vue'
import PortfolioModal from '@/components/portfolio/PortfolioModal.vue'
import AmountInput from '@/components/portfolio/AmountInput.vue'
import { getAssetTypeMeta, MARKET_BUY_FEE_RATE } from '@/constants/assetType.js'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  cashBalance: {
    type: Number,
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

// 예·적금·채권은 "가입", 나머지는 "매수" — 자산군별 정확한 금융 용어
const meta = computed(() => getAssetTypeMeta(props.product.assetType))
const isSubscription = computed(() => meta.value.tradeType === 'SUBSCRIPTION')
const actionLabel = computed(() => meta.value.buyActionLabel)
const modalTitle = computed(() => `상품 ${actionLabel.value}`)
const confirmLabel = computed(() => `${actionLabel.value}하기`)
const processingLabel = computed(() => `${actionLabel.value} 처리 중…`)
const cycleSummaryText = computed(() => props.product.cycleSummary ?? '실시간 시세')

// 예·적금·채권(SUBSCRIPTION)은 서버가 current_price를 아예 내려주지 않는다(설계상 정상).
// "가격 정보 없음" 판정은 매수형(주식·펀드)에만 적용한다.
const hasPriceInfo = computed(() => isSubscription.value || props.product.unitPrice != null)
const amount = ref(0)

// 2026-08-12(#75): 매수 수수료(주식·펀드만 0.015%)는 체결액 밖에서 추가로 나간다
// (현금 차감 = 체결액 + 수수료). "전액" 버튼이 잔액을 그대로 채우면 수수료분만큼 모자라
// 422 INSUFFICIENT_SIMULATION_CASH가 날 수 있어, 입력 가능한 최대 금액을 수수료만큼 낮춰둔다.
// 예·적금·채권은 수수료가 붙지 않아(가입형) 잔액 전부를 그대로 최대값으로 쓴다.
const maxBuyAmount = computed(() =>
  isSubscription.value
    ? props.cashBalance
    : Math.floor(props.cashBalance / (1 + MARKET_BUY_FEE_RATE)),
)

// 매수형(주식·펀드)은 서버가 수량=내림(금액÷현재가)으로 환산 — 미리보기로 예상 체결 수량/금액을 보여준다.
const estimatedQuantity = computed(() =>
  hasPriceInfo.value && !isSubscription.value
    ? Math.floor(amount.value / props.product.unitPrice)
    : 0,
)
const estimatedFillAmount = computed(() =>
  isSubscription.value ? amount.value : estimatedQuantity.value * (props.product.unitPrice ?? 0),
)
const hasRoundingLeftover = computed(
  () => !isSubscription.value && amount.value > 0 && estimatedFillAmount.value < amount.value,
)

const isInsufficient = computed(() => amount.value > maxBuyAmount.value)
const isTooSmall = computed(
  () => !isSubscription.value && amount.value > 0 && estimatedQuantity.value <= 0,
)
const canConfirm = computed(
  () => hasPriceInfo.value && amount.value > 0 && !isInsufficient.value && !isTooSmall.value,
)

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
    <p class="font-serif text-sm font-bold text-[#f5edd9]">{{ product.displayName }}</p>
    <p class="font-serif text-xs text-[rgba(245,237,217,0.6)]">{{ cycleSummaryText }}</p>
    <p
      v-if="hasPriceInfo && !isSubscription"
      class="mt-1 font-serif text-xs text-[rgba(245,237,217,0.6)]"
    >
      현재가 {{ product.unitPrice.toLocaleString('ko-KR') }}원
    </p>

    <div class="mt-4">
      <p class="mb-1.5 font-serif text-xs text-[rgba(245,237,217,0.6)]">{{ actionLabel }} 금액</p>
      <AmountInput v-model="amount" :min="0" :max="maxBuyAmount" :disabled="isSubmitting" />
    </div>

    <div v-if="!isSubscription" class="mt-3 flex items-center justify-between font-serif text-sm">
      <span class="text-[rgba(245,237,217,0.6)]">예상 체결 수량</span>
      <span class="font-bold text-[#f5edd9]"
        >{{ estimatedQuantity.toLocaleString('ko-KR') }}{{ meta.quantityUnit }}</span
      >
    </div>
    <div
      v-if="hasRoundingLeftover"
      class="mt-1 flex items-center justify-between font-serif text-xs"
    >
      <span class="text-[rgba(245,237,217,0.6)]">실제 반영 금액</span>
      <span class="text-[#f5edd9]"
        >{{ estimatedFillAmount.toLocaleString('ko-KR') }}원 (나머지는 현금으로 남아요)</span
      >
    </div>

    <div class="mt-1 flex items-center justify-between font-serif text-xs">
      <span class="text-[rgba(245,237,217,0.6)]">보유 현금</span>
      <span :class="isInsufficient ? 'text-[#f0b4b4]' : 'text-[rgba(245,237,217,0.6)]'"
        >{{ cashBalance.toLocaleString('ko-KR') }}원</span
      >
    </div>
    <p
      v-if="!isSubscription"
      class="mt-1 flex flex-col gap-0.5 text-right font-serif text-[11px] text-[rgba(245,237,217,0.4)]"
    >
      <span>매수 수수료 0.015%가 별도로 나가요.</span>
      <span>최대 {{ maxBuyAmount.toLocaleString('ko-KR') }}원까지 입력할 수 있어요.</span>
    </p>

    <p v-if="isInsufficient" class="mt-2 font-serif text-xs text-[#f0b4b4]">
      보유 현금이 부족해요. 금액을 줄여주세요.
    </p>
    <p v-if="isTooSmall" class="mt-2 font-serif text-xs text-[#f0b4b4]">
      입력한 금액으로는 1{{ meta.quantityUnit }}도 살 수 없어요. 금액을 늘려주세요.
    </p>
    <p v-if="!hasPriceInfo" class="mt-2 font-serif text-xs text-[#f0b4b4]">
      가격 정보를 아직 불러올 수 없어요. 잠시 후 다시 시도해주세요.
    </p>
    <p v-if="errorMessage" class="mt-2 font-serif text-xs text-[#f0b4b4]">
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
