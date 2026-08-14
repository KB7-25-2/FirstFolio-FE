<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import PortfolioSummaryCard from '@/components/portfolio/PortfolioSummaryCard.vue'
import HoldingsList from '@/components/portfolio/HoldingsList.vue'
import AiCoachCard from '@/components/portfolio/AiCoachCard.vue'
import SellHoldingModal from '@/components/portfolio/SellHoldingModal.vue'
import TradeResultModal from '@/components/portfolio/TradeResultModal.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'

const store = usePortfolioStore()

const sellTargetHolding = ref(null)
const isSelling = ref(false)
const sellError = ref(null)
const tradeResult = ref(null) // 거래 완료 모달에 넘길 값(상품명·자산군 포함)

// 매도/만기 완료(SOLD, MATURED)된 항목은 "현재 자산"에서 제외한다.
const activeHoldings = computed(
  () => store.summary?.holdings.filter((holding) => holding.status === 'ACTIVE') ?? [],
)

onMounted(() => {
  if (!store.summary) store.fetchSummary()
})

const openSellModal = (holding) => {
  sellError.value = null
  sellTargetHolding.value = holding
}

const closeSellModal = () => {
  if (isSelling.value) return // 처리 중에는 닫기 방지 (중복 클릭/이탈로 인한 요청 유실 방지)
  sellTargetHolding.value = null
  sellError.value = null
}

const handleSellConfirm = async (quantity) => {
  isSelling.value = true
  sellError.value = null

  try {
    const result = await store.sellHolding(sellTargetHolding.value.holdingId, quantity)
    // mapTradeResult엔 상품명이 없어서(응답 자체에 없음) 방금 판 holding에서 채워 넣는다.
    tradeResult.value = {
      ...result,
      productName: sellTargetHolding.value.displayName,
      assetType: sellTargetHolding.value.assetType,
    }
    sellTargetHolding.value = null
  } catch (err) {
    sellError.value = err.message || '판매 처리 중 문제가 발생했어요. 다시 시도해주세요.'
  } finally {
    isSelling.value = false
  }
}

const closeTradeResult = () => {
  tradeResult.value = null
}
</script>

<template>
  <div
    data-scroll-reveal-root
    class="nav-scroll-pad flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-2"
  >
    <p v-if="store.error" class="text-sm text-[var(--pf-negative)]">{{ store.error }}</p>

    <template v-if="store.summary">
      <ScrollReveal>
        <PortfolioSummaryCard :summary="store.summary" />
      </ScrollReveal>
      <ScrollReveal>
        <HoldingsList :holdings="activeHoldings" @request-sell="openSellModal" />
      </ScrollReveal>
      <ScrollReveal v-if="store.summary.aiFeedback">
        <AiCoachCard :message="store.summary.aiFeedback" />
      </ScrollReveal>
    </template>

    <BaseLoading v-else-if="store.isLoading" />

    <SellHoldingModal
      v-if="sellTargetHolding"
      :holding="sellTargetHolding"
      :is-submitting="isSelling"
      :error-message="sellError"
      @close="closeSellModal"
      @confirm="handleSellConfirm"
    />

    <TradeResultModal v-if="tradeResult" :result="tradeResult" @close="closeTradeResult" />
  </div>
</template>
