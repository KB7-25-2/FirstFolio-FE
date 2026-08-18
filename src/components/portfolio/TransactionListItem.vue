<script setup>
import { computed } from 'vue'

// transaction: mappers/portfolioMapper.js의 mapTransaction() 결과.
// detail은 자유 형식 원본(snake_case) 그대로다 — 모르는 키는 무시하고, 필요한 키만 방어적으로 읽는다.
const props = defineProps({
  transaction: {
    type: Object,
    required: true,
  },
})

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
// 그래서 화면 대표 금액은 BUY/SELL일 땐 detail.net_cash_amount를(없으면 amount로 폴백),
// 그 외엔 amount를 그대로 쓴다.
const displayAmount = computed(() => {
  const type = props.transaction.transactionType
  if (type === 'BUY' || type === 'SELL') {
    return props.transaction.detail?.net_cash_amount != null
      ? Number(props.transaction.detail.net_cash_amount)
      : props.transaction.amount
  }
  return props.transaction.amount
})

// 체결 금액과 대표 금액(net_cash_amount)이 다르면(=수수료·세금이 붙었으면) 소계 라인을 보여준다.
const costBreakdown = computed(() => {
  const type = props.transaction.transactionType
  const detail = props.transaction.detail
  if (!detail) return null

  if (type === 'BUY' || type === 'SELL') {
    const fee = Number(detail.fee_amount ?? 0)
    const tax = Number(detail.tax_amount ?? 0)
    if (fee <= 0 && tax <= 0) return null
    const parts = [`체결 ${fmt(props.transaction.amount)}원`]
    if (fee > 0) parts.push(`수수료 -${fmt(fee)}원`)
    if (tax > 0) parts.push(`증권거래세 -${fmt(tax)}원`)
    return parts.join(' · ')
  }

  if (type === 'INTEREST' || type === 'MATURITY') {
    const gross = detail.gross_amount != null ? Number(detail.gross_amount) : null
    const tax = Number(detail.tax_amount ?? 0)
    if (gross == null || tax <= 0) return null
    const ratePercent =
      detail.tax_rate != null ? Math.round(Number(detail.tax_rate) * 1000) / 10 : null
    const rateLabel = ratePercent != null ? ` ${ratePercent}%` : ''
    return `세전 ${fmt(gross)}원 · 이자소득세${rateLabel} -${fmt(tax)}원`
  }

  return null
})

const dateLabel = computed(() => {
  const raw = props.transaction.isScheduled
    ? props.transaction.scheduledAt
    : props.transaction.processedAt
  if (!raw) return null
  return new Date(raw).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
})
</script>

<template>
  <li
    class="flex flex-col gap-1 rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.18)] bg-white/55 px-3.5 py-3"
  >
    <div class="flex items-center justify-between gap-2">
      <p class="truncate font-serif text-sm font-bold text-[#2c1810]">
        {{ typeLabel }}<span v-if="transaction.displayName"> · {{ transaction.displayName }}</span>
      </p>
      <p
        v-if="!isReset"
        class="shrink-0 font-serif text-[13px] font-bold"
        :class="isOutflow ? 'text-[#c0433f]' : 'text-[#1D9E75]'"
      >
        {{ isOutflow ? '-' : '+' }}{{ fmt(displayAmount) }}원
      </p>
    </div>

    <div class="flex items-center justify-between gap-2">
      <p class="truncate font-serif text-[11px] text-[rgba(41,33,26,0.55)]">
        {{ costBreakdown ?? '' }}
      </p>
      <div class="flex shrink-0 items-center gap-1.5">
        <span
          v-if="transaction.isScheduled"
          class="rounded-full bg-[rgba(193,127,36,0.15)] px-1.5 py-0.5 font-serif text-[9px] font-bold text-[#c17f24]"
        >
          예정
        </span>
        <span class="font-serif text-[11px] text-[rgba(41,33,26,0.45)]">{{ dateLabel }}</span>
      </div>
    </div>
  </li>
</template>
