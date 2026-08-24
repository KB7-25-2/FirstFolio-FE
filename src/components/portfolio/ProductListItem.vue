<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { getAssetTypeMeta } from '@/constants/assetType.js'
import {
  calcPriceChangeVsOpen,
  formatPriceChangeAmount,
  formatPriceChangeRate,
  priceChangeFlashClass,
  priceChangeToneClass,
} from '@/utils/priceChange.js'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  isHeld: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['buy', 'select'])

const meta = computed(() => getAssetTypeMeta(props.product.assetType))
const dotClass = computed(() => meta.value.dotClass)
const buyActionLabel = computed(() => meta.value.buyActionLabel)
const quantityUnit = computed(() => meta.value.quantityUnit ?? '개')
const isSubscription = computed(() => meta.value.tradeType === 'SUBSCRIPTION')

// 가입형(예·적금·채권)은 이미 보유 중이면 재가입이 안 된다(422 TRADE_NOT_ALLOWED와 동일 정책) —
// 서버 에러를 받기 전에 미리 막아서 사용자 혼란을 줄인다.
const isBlocked = computed(() => isSubscription.value && props.isHeld)

// 주식·펀드는 시간압축 예외라 cycleSummary가 null로 온다(FUNC-039).
const cycleSummaryText = computed(() => props.product.cycleSummary ?? '실시간 시세')

const priceChange = computed(() =>
  isSubscription.value
    ? null
    : calcPriceChangeVsOpen(props.product.unitPrice, props.product.openPrice),
)

const priceToneClass = computed(() => {
  if (!priceChange.value) return 'text-[#c17f24]'
  if (priceChange.value.direction === 'flat') return 'text-[#c17f24]'
  return priceChangeToneClass(priceChange.value.direction)
})

const flashDirection = ref(null)
let flashTimer = null

watch(
  () => props.product.unitPrice,
  (next, prev) => {
    if (isSubscription.value) return
    if (prev == null || next == null || next === prev) return
    flashDirection.value = next > prev ? 'up' : 'down'
    if (flashTimer) clearTimeout(flashTimer)
    flashTimer = setTimeout(() => {
      flashDirection.value = null
      flashTimer = null
    }, 700)
  },
)

onUnmounted(() => {
  if (flashTimer) clearTimeout(flashTimer)
})

const changeAmountLabel = computed(() =>
  priceChange.value ? formatPriceChangeAmount(priceChange.value.amount) : null,
)

const changeRateLabel = computed(() =>
  priceChange.value ? formatPriceChangeRate(priceChange.value.rate) : null,
)

// unit_price는 매수형(주식·펀드) 수량 환산에만 필요하다. 가입형은 금액을 자유롭게 입력하는
// 방식이라 단가 대신 금리(realTerms.rate — 예·적금은 interest_rate, 채권은 coupon_rate를
// 매퍼가 이미 rate 하나로 합쳐둠)를 보여준다. 금리가 없으면(데이터 누락) 안내 문구만 남긴다.
const priceText = computed(() => {
  if (isSubscription.value) {
    const rate = props.product.realTerms?.rate
    return rate != null ? `연 ${rate}% · 금액 자유 입력` : '금액 자유 입력'
  }
  if (props.product.unitPrice == null) return '가격 정보 준비 중'
  return `1${quantityUnit.value} · ${props.product.unitPrice.toLocaleString('ko-KR')}원`
})
</script>

<template>
  <li
    class="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors"
    :class="[
      selected ? 'bg-[rgba(193,127,36,0.12)]' : '',
      selectable && !selected ? 'hover:bg-[rgba(193,127,36,0.1)]' : '',
    ]"
  >
    <button
      type="button"
      class="flex min-w-0 flex-1 items-start gap-2 text-left"
      :class="selectable ? 'cursor-pointer' : 'cursor-default'"
      :disabled="!selectable"
      @click="selectable && $emit('select', product)"
    >
      <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="dotClass" />
      <div class="min-w-0">
        <div class="flex items-center gap-1.5">
          <p class="truncate font-serif text-sm font-bold text-[#2c1810]">
            {{ product.displayName }}
          </p>
          <span
            v-if="isHeld"
            class="shrink-0 rounded-full bg-[rgba(193,127,36,0.14)] px-1.5 py-0.5 font-serif text-[9px] font-bold text-[#c17f24]"
          >
            보유중
          </span>
        </div>
        <p class="truncate font-serif text-xs text-[rgba(41,33,26,0.55)]">
          {{ product.riskLevel }} · {{ cycleSummaryText }}
        </p>
        <p
          class="mt-1 font-serif text-sm font-bold"
          :class="[priceToneClass, priceChangeFlashClass(flashDirection)]"
        >
          {{ priceText }}
        </p>
        <p
          v-if="changeAmountLabel"
          class="mt-0.5 font-serif text-[11px] font-bold"
          :class="[priceToneClass, priceChangeFlashClass(flashDirection)]"
        >
          {{ changeAmountLabel }}
          <span class="ml-0.5 font-semibold">{{ changeRateLabel }}</span>
        </p>
      </div>
    </button>

    <button
      v-if="!isBlocked"
      type="button"
      class="shrink-0 rounded-full bg-[#c17f24] px-3 py-1.5 font-serif text-xs font-bold text-[#fff8ec] transition-colors hover:bg-[#a86c1d]"
      @click="$emit('buy', product)"
    >
      {{ buyActionLabel }}
    </button>
    <span
      v-else
      class="shrink-0 rounded-full bg-[rgba(193,127,36,0.1)] px-3 py-1.5 font-serif text-xs text-[rgba(41,33,26,0.45)]"
    >
      가입 완료
    </span>
  </li>
</template>
