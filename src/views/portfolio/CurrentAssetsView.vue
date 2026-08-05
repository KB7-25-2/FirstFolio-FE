<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import PortfolioSummaryCard from '@/components/portfolio/PortfolioSummaryCard.vue'
import HoldingsList from '@/components/portfolio/HoldingsList.vue'
import AiCoachCard from '@/components/portfolio/AiCoachCard.vue'
import SellHoldingModal from '@/components/portfolio/SellHoldingModal.vue'

const store = usePortfolioStore()

const sellTargetHolding = ref(null)

// 매도/만기 완료(SOLD, MATURED)된 항목은 "현재 자산"에서 제외한다.
const activeHoldings = computed(
  () => store.summary?.holdings.filter((holding) => holding.status === 'ACTIVE') ?? [],
)

onMounted(() => {
  store.fetchSummary()
})

const openSellModal = (holding) => {
  sellTargetHolding.value = holding
}

const closeSellModal = () => {
  sellTargetHolding.value = null
}

const handleSellConfirm = async (quantity) => {
  await store.sellHolding(sellTargetHolding.value.holdingId, quantity)
  closeSellModal()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="store.error" class="text-sm text-[var(--pf-negative)]">{{ store.error }}</p>

    <template v-if="store.summary">
      <PortfolioSummaryCard :summary="store.summary" />
      <HoldingsList :holdings="activeHoldings" @request-sell="openSellModal" />
      <AiCoachCard v-if="store.summary.aiFeedback" :message="store.summary.aiFeedback" />
    </template>

    <p v-else-if="store.isLoading" class="text-sm text-[var(--pf-text-muted)]">불러오는 중…</p>

    <SellHoldingModal
      v-if="sellTargetHolding"
      :holding="sellTargetHolding"
      @close="closeSellModal"
      @confirm="handleSellConfirm"
    />
  </div>
</template>
