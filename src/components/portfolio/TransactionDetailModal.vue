<script setup>
import { computed } from 'vue'
import PortfolioModal from '@/components/portfolio/PortfolioModal.vue'

// transaction: mappers/portfolioMapper.js의 mapTransaction() 결과. TransactionListItem.vue와
// 라벨/금액 계산 로직이 겹치는데, 이 모달은 목록 화면당 딱 한 번만 렌더되니 중복 비용이
// 작아서 굳이 공용 유틸로 안 뺐다(카드 안에 모달을 중첩시켰다가 캘린더 날짜 모달과 겹쳐
// "모달이 두 번 뜨는" 버그가 났던 걸 고치면서, 상세 모달을 부모가 하나만 관리하는 구조로
// 바꿨다 — #86).
const props = defineProps({
  transaction: {
    type: Object,
    required: true,
  },
})

defineEmits(['close'])

const TYPE_LABEL = {
  INITIAL_GRANT: '최초 지급',
  BUY: '매수',
  SELL: '매도',
  INTEREST: '이자 지급',
  DIVIDEND: '배당 지급',
  MATURITY: '만기 상환',
  RESET: '포트폴리오 초기화',
}

const OUTFLOW_TYPES = new Set(['BUY'])

const typeLabel = computed(
  () => TYPE_LABEL[props.transaction.transactionType] ?? props.transaction.transactionType,
)
const isOutflow = computed(() => OUTFLOW_TYPES.has(props.transaction.transactionType))
const isReset = computed(() => props.transaction.transactionType === 'RESET')

const fmt = (n) => Math.round(Number(n ?? 0)).toLocaleString('ko-KR')

const displayAmount = computed(() => {
  const type = props.transaction.transactionType
  if (type === 'BUY' || type === 'SELL') {
    return props.transaction.detail?.net_cash_amount != null
      ? Number(props.transaction.detail.net_cash_amount)
      : props.transaction.amount
  }
  return props.transaction.amount
})

const breakdownRows = computed(() => {
  const type = props.transaction.transactionType
  const detail = props.transaction.detail
  if (!detail) return []

  if (type === 'BUY' || type === 'SELL') {
    const fee = Number(detail.fee_amount ?? 0)
    const tax = Number(detail.tax_amount ?? 0)
    if (fee <= 0 && tax <= 0) return []
    const rows = [{ label: '체결 금액', value: `${fmt(props.transaction.amount)}원` }]
    if (fee > 0) rows.push({ label: '수수료', value: `-${fmt(fee)}원` })
    if (tax > 0) rows.push({ label: '증권거래세', value: `-${fmt(tax)}원` })
    return rows
  }

  if (type === 'INTEREST' || type === 'MATURITY') {
    const gross = detail.gross_amount != null ? Number(detail.gross_amount) : null
    const tax = Number(detail.tax_amount ?? 0)
    if (gross == null || tax <= 0) return []
    const ratePercent =
      detail.tax_rate != null ? Math.round(Number(detail.tax_rate) * 1000) / 10 : null
    const taxLabel = ratePercent != null ? `이자소득세 ${ratePercent}%` : '이자소득세'
    return [
      { label: '세전 금액', value: `${fmt(gross)}원` },
      { label: taxLabel, value: `-${fmt(tax)}원` },
    ]
  }

  return []
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
  <PortfolioModal
    variant="light"
    :title="transaction.displayName ? `${typeLabel} · ${transaction.displayName}` : typeLabel"
    @close="$emit('close')"
  >
    <div class="flex flex-col gap-3">
      <p
        v-if="!isReset"
        class="font-serif text-2xl font-bold"
        :class="isOutflow ? 'text-[#c0433f]' : 'text-[#1D9E75]'"
      >
        {{ isOutflow ? '-' : '+' }}{{ fmt(displayAmount) }}원
      </p>

      <div
        v-if="breakdownRows.length"
        class="flex flex-col gap-1.5 border-t border-[rgba(193,127,36,0.2)] pt-3"
      >
        <div
          v-for="row in breakdownRows"
          :key="row.label"
          class="flex items-center justify-between font-serif text-[13px]"
        >
          <span class="text-[rgba(41,33,26,0.55)]">{{ row.label }}</span>
          <span class="font-bold text-[#2c1810]">{{ row.value }}</span>
        </div>
      </div>

      <div
        class="flex items-center justify-between border-t border-[rgba(193,127,36,0.2)] pt-3 font-serif text-[13px]"
      >
        <span class="text-[rgba(41,33,26,0.55)]">{{
          transaction.isScheduled ? '예정일' : '처리일'
        }}</span>
        <span class="font-bold text-[#2c1810]">{{ dateLabel }}</span>
      </div>
    </div>
  </PortfolioModal>
</template>
