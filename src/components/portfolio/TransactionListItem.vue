<script setup>
import { computed } from 'vue'

// transaction: mappers/portfolioMapper.js의 mapTransaction() 결과.
const props = defineProps({
  transaction: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select'])

const TYPE_LABEL = {
  INITIAL_GRANT: '최초 지급',
  BUY: '매수',
  SELL: '매도',
  INTEREST: '이자 지급',
  DIVIDEND: '배당 지급',
  MATURITY: '만기 상환',
  RESET: '포트폴리오 초기화',
}

// 현금 방향 — BUY만 나가고, 나머지(SELL·이자·배당·만기·최초지급)는 들어온다. RESET은 이벤트일 뿐 금액 의미가 약해 중립으로 둔다.
const OUTFLOW_TYPES = new Set(['BUY'])

const typeLabel = computed(
  () => TYPE_LABEL[props.transaction.transactionType] ?? props.transaction.transactionType,
)
const isOutflow = computed(() => OUTFLOW_TYPES.has(props.transaction.transactionType))
const isReset = computed(() => props.transaction.transactionType === 'RESET')

const fmt = (n) => Math.round(Number(n ?? 0)).toLocaleString('ko-KR')

// 2026-08-12(#75·#76·#77): 목록 amount는 종류마다 의미가 다르다 —
//   BUY/SELL은 체결 금액일 뿐이라 실제 현금 증감(detail.net_cash_amount)과 다를 수 있다.
//   INTEREST/MATURITY는 amount 자체가 이미 현금 증감(세후/원금)이라 그대로 쓴다.
const displayAmount = computed(() => {
  const type = props.transaction.transactionType
  if (type === 'BUY' || type === 'SELL') {
    return props.transaction.detail?.net_cash_amount != null
      ? Number(props.transaction.detail.net_cash_amount)
      : props.transaction.amount
  }
  return props.transaction.amount
})

const dateLabel = computed(() => {
  if (!props.transaction.processedAt) return null
  return new Date(props.transaction.processedAt).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <li
    class="flex cursor-pointer flex-col gap-1 rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.18)] bg-white/55 px-3.5 py-3 text-left transition-colors hover:bg-[rgba(193,127,36,0.1)] active:opacity-70"
    role="button"
    tabindex="0"
    @click="emit('select', transaction)"
    @keydown.enter="emit('select', transaction)"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-1.5">
        <span
          class="shrink-0 rounded-full px-1.5 py-0.5 font-serif text-[10px] font-bold"
          :class="
            isReset
              ? 'bg-[rgba(41,33,26,0.08)] text-[rgba(41,33,26,0.55)]'
              : isOutflow
                ? 'bg-[rgba(192,67,63,0.1)] text-[#c0433f]'
                : 'bg-[rgba(29,158,117,0.1)] text-[#1D9E75]'
          "
        >
          {{ typeLabel }}
        </span>
        <p
          v-if="transaction.displayName"
          class="min-w-0 truncate font-serif text-sm font-bold text-[#2c1810]"
        >
          {{ transaction.displayName }}
        </p>
      </div>
      <p
        v-if="!isReset"
        class="shrink-0 font-serif text-[13px] font-bold"
        :class="isOutflow ? 'text-[#c0433f]' : 'text-[#1D9E75]'"
      >
        {{ isOutflow ? '-' : '+' }}{{ fmt(displayAmount) }}원
      </p>
    </div>

    <div class="flex justify-end">
      <span class="font-serif text-[11px] text-[rgba(41,33,26,0.45)]">{{ dateLabel }}</span>
    </div>
  </li>
</template>
