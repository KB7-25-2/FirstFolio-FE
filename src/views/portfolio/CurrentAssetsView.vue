<script setup>
import { onMounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import PortfolioSummaryCard from '@/components/portfolio/PortfolioSummaryCard.vue'
import HoldingsList from '@/components/portfolio/HoldingsList.vue'
// import AiCoachCard from '@/components/portfolio/AiCoachCard.vue'

const store = usePortfolioStore()

onMounted(() => {
  store.fetchSummary()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="store.error" class="text-sm text-[var(--pf-negative)]">{{ store.error }}</p>

    <template v-if="store.summary">
      <PortfolioSummaryCard :summary="store.summary" />
      <HoldingsList :holdings="store.summary.holdings" />
      <!--      <AiCoachCard v-if="store.summary.aiFeedback" :message="store.summary.aiFeedback" />-->
    </template>

    <p v-else-if="store.isLoading" class="text-sm text-[var(--pf-text-muted)]">불러오는 중…</p>
  </div>
</template>
