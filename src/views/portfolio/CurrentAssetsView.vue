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
import { ASSET_TYPE_META } from '@/constants/assetType.js'

const store = usePortfolioStore()

// 색상 점(color)을 넣어 어떤 색이 어떤 자산군인지 필터에서 바로 확인할 수 있게 한다.
// PortfolioSummaryCard 범례·도넛 차트와 같은 색상 소스(ASSET_TYPE_META)를 써서 색이 어긋나지 않게 한다.
const FILTERS = [
  { value: 'ALL', label: '전체', color: null },
  {
    value: 'DEPOSIT_SAVINGS',
    label: ASSET_TYPE_META.DEPOSIT_SAVINGS.label,
    color: ASSET_TYPE_META.DEPOSIT_SAVINGS.color,
  },
  { value: 'BOND', label: ASSET_TYPE_META.BOND.label, color: ASSET_TYPE_META.BOND.color },
  { value: 'STOCK', label: ASSET_TYPE_META.STOCK.label, color: ASSET_TYPE_META.STOCK.color },
  { value: 'FUND', label: ASSET_TYPE_META.FUND.label, color: ASSET_TYPE_META.FUND.color },
]

const activeFilter = ref('ALL')
const sellTargetHolding = ref(null)
const isSelling = ref(false)
const sellError = ref(null)
const tradeResult = ref(null) // 거래 완료 모달에 넘길 값(상품명·자산군 포함)

// 매도/만기 완료(SOLD, MATURED)된 항목은 "현재 자산"에서 제외한다.
const activeHoldings = computed(
  () => store.summary?.holdings.filter((holding) => holding.status === 'ACTIVE') ?? [],
)

const filteredHoldings = computed(() => {
  if (activeFilter.value === 'ALL') return activeHoldings.value
  return activeHoldings.value.filter((holding) => holding.assetType === activeFilter.value)
})

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
    class="nav-scroll-pad absolute inset-0 flex flex-col gap-4 overflow-y-auto overscroll-contain px-2"
  >
    <p v-if="store.error" class="text-sm text-[var(--pf-negative)]">{{ store.error }}</p>

    <template v-if="store.summary">
      <ScrollReveal>
        <PortfolioSummaryCard :summary="store.summary" />
      </ScrollReveal>

      <!-- ScrollReveal 밖에 둔다 — ScrollReveal이 인라인 transform을 걸어서, 그 안에서는
           position: sticky가 스크롤 컨테이너 기준이 아니라 transform이 만든 새 컨테이닝 블록
           기준으로 깨진다. -->
      <div class="cork-board-patch sticky top-0 z-10 -mx-2 px-2 py-1.5">
        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="filter in FILTERS"
            :key="filter.value"
            type="button"
            class="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-serif text-xs font-bold transition-colors"
            :class="
              activeFilter === filter.value
                ? 'border-[1.5px] border-[#c17f24] bg-[#fff8ec] text-[#2c1810]'
                : 'border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] text-[rgba(44,24,16,0.55)]'
            "
            @click="activeFilter = filter.value"
          >
            <span
              v-if="filter.color"
              class="size-2 rounded-full"
              :style="{ backgroundColor: filter.color }"
            />
            {{ filter.label }}
          </button>
        </div>
      </div>

      <ScrollReveal>
        <HoldingsList :holdings="filteredHoldings" @request-sell="openSellModal" />
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
