<script setup>
import { computed } from 'vue'
import PortfolioModal from '@/components/portfolio/PortfolioModal.vue'
import { getAssetTypeMeta } from '@/constants/assetType.js'

// result: mapTradeResult()가 만든 모델(+ productName/assetType을 호출부가 덧붙여 넘긴다).
// mapTradeResult엔 상품명이 없어서(거래 API 응답 자체에 없음) 호출부가 알고 있는 값을 합쳐서 넘긴다.
const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close'])

const meta = computed(() => getAssetTypeMeta(props.result.assetType))
const isSubscription = computed(() => meta.value.tradeType === 'SUBSCRIPTION')
const isBuy = computed(() => props.result.transactionType === 'BUY')

const actionLabel = computed(() =>
  isBuy.value ? meta.value.buyActionLabel : meta.value.sellActionLabel,
)
const title = computed(() => `${actionLabel.value} 완료`)

// 2026-08-12(#75·#76): "얼마 나갔는지/들어왔는지"는 amount(체결액)가 아니라 net_cash_amount다.
// 매수는 현금이 나간 거라 "총 출금액", 매도는 들어온 거라 "실 수령액"으로 라벨을 구분한다.
const netCashLabel = computed(() => (isBuy.value ? '총 출금액' : '실 수령액'))

const fmt = (n) => Math.round(n).toLocaleString('ko-KR')

const hasFee = computed(() => props.result.feeAmount > 0)
const hasTax = computed(() => props.result.taxAmount > 0)

// 매수형(주식·펀드)만 정수 수량 내림으로 요청액과 체결액이 달라질 수 있다 — 그 차액은
// 사용자가 요청한 게 아니라 서버가 소진 못 한 잔여분이라, 별도로 안내한다.
const hasRoundingLeftover = computed(
  () =>
    isBuy.value &&
    !isSubscription.value &&
    props.result.requestedAmount != null &&
    props.result.requestedAmount !== props.result.amount,
)
</script>

<template>
  <PortfolioModal :title="title" @close="$emit('close')">
    <p class="font-serif text-sm font-bold text-[#f5edd9]">{{ result.productName }}</p>
    <p
      v-if="!isSubscription && result.quantity != null"
      class="font-serif text-xs text-[rgba(245,237,217,0.6)]"
    >
      {{ fmt(result.quantity) }}{{ meta.quantityUnit }} · 단가 {{ fmt(result.unitPrice) }}원
    </p>

    <div class="mt-4 flex flex-col gap-1.5 font-serif text-sm">
      <div class="flex items-center justify-between">
        <span class="text-[rgba(245,237,217,0.6)]">체결 금액</span>
        <span class="text-[#f5edd9]">{{ fmt(result.amount) }}원</span>
      </div>
      <div v-if="hasFee" class="flex items-center justify-between text-xs">
        <span class="text-[rgba(245,237,217,0.5)]">수수료</span>
        <span class="text-[rgba(245,237,217,0.75)]">-{{ fmt(result.feeAmount) }}원</span>
      </div>
      <div v-if="hasTax" class="flex items-center justify-between text-xs">
        <span class="text-[rgba(245,237,217,0.5)]">증권거래세</span>
        <span class="text-[rgba(245,237,217,0.75)]">-{{ fmt(result.taxAmount) }}원</span>
      </div>

      <div class="my-1 border-t-[0.5px] border-[rgba(245,237,217,0.15)]" />

      <div class="flex items-center justify-between font-bold">
        <span class="text-[#f5edd9]">{{ netCashLabel }}</span>
        <span class="text-[#c17f24]">{{ fmt(result.netCashAmount) }}원</span>
      </div>
    </div>

    <div
      v-if="hasRoundingLeftover"
      class="mt-2 flex flex-col gap-0.5 font-serif text-xs text-[rgba(245,237,217,0.5)]"
    >
      <p>
        요청하신 {{ fmt(result.requestedAmount) }}원 중 {{ fmt(result.amount) }}원만 체결됐어요.
      </p>
      <p>나머지는 현금으로 남았어요.</p>
    </div>

    <div class="mt-3 flex items-center justify-between font-serif text-xs">
      <span class="text-[rgba(245,237,217,0.5)]">거래 후 보유 현금</span>
      <span class="text-[rgba(245,237,217,0.75)]">{{ fmt(result.cashBalance) }}원</span>
    </div>

    <button
      type="button"
      class="mt-5 w-full rounded-xl bg-[rgba(193,127,36,0.92)] py-2.5 font-serif text-sm font-bold text-[#1a1208] transition-colors hover:bg-[#c17f24]"
      @click="emit('close')"
    >
      확인
    </button>
  </PortfolioModal>
</template>
