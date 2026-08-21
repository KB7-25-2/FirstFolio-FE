<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import ProductListItem from '@/components/portfolio/ProductListItem.vue'
import ProductCandleChart from '@/components/portfolio/ProductCandleChart.vue'
import BuyProductModal from '@/components/portfolio/BuyProductModal.vue'
import TradeResultModal from '@/components/portfolio/TradeResultModal.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'
import { ASSET_TYPE_META } from '@/constants/assetType.js'
import * as portfolioService from '@/services/portfolioTradeService.js'

// 월봉 집계·3개월 일봉 구간에 넉넉히 쓰도록 서버 상한(200)까지 받는다.
const CHART_CANDLE_COUNT = 200
const SNAPSHOT_POLL_MS = 2_000
const CHART_ASSET_TYPES = new Set(['STOCK', 'FUND'])

const store = usePortfolioStore()

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
const buyTargetProduct = ref(null)
const isBuying = ref(false)
const buyError = ref(null)
const tradeResult = ref(null)

const selectedChartProductId = ref(null)
const chartCandles = ref([])
const chartSnapshot = ref(null)
const chartLoading = ref(false)
const chartError = ref(null)

let snapshotPollTimer = null
let chartRequestId = 0

const isChartAsset = (product) => CHART_ASSET_TYPES.has(product?.assetType)

onMounted(() => {
  store.fetchPurchasableProducts().then(() => store.hydrateProductPrices())
  if (!store.summary) store.fetchSummary()
})

onUnmounted(() => {
  stopSnapshotPolling()
})

const heldProductIds = computed(
  () =>
    new Set(
      (store.summary?.holdings ?? [])
        .filter((holding) => holding.status === 'ACTIVE')
        .map((holding) => holding.productId),
    ),
)

const filteredProducts = computed(() => {
  if (activeFilter.value === 'ALL') return store.purchasableProducts
  return store.purchasableProducts.filter((product) => product.assetType === activeFilter.value)
})

const chartableProducts = computed(() =>
  store.purchasableProducts.filter((product) => isChartAsset(product)),
)

const selectedChartProduct = computed(
  () =>
    chartableProducts.value.find((product) => product.productId === selectedChartProductId.value) ??
    null,
)

const stopSnapshotPolling = () => {
  if (!snapshotPollTimer) return
  clearInterval(snapshotPollTimer)
  snapshotPollTimer = null
}

const applySnapshot = (snapshot) => {
  chartSnapshot.value = snapshot
}

const pollMarketSnapshot = async (productId, requestId) => {
  try {
    const snapshot = await portfolioService.getProductMarketSnapshotData(productId)
    if (requestId !== chartRequestId) return
    applySnapshot(snapshot)

    if (!snapshot.marketOpen) {
      stopSnapshotPolling()
    }
  } catch {
    // 폴링 실패는 차트를 비우지 않는다 — 확정 일봉은 그대로 두고 다음 주기에 재시도.
  }
}

const startSnapshotPolling = (productId, requestId) => {
  stopSnapshotPolling()
  snapshotPollTimer = setInterval(() => {
    pollMarketSnapshot(productId, requestId)
  }, SNAPSHOT_POLL_MS)
}

const loadChartForProduct = async (product) => {
  const requestId = (chartRequestId += 1)
  stopSnapshotPolling()
  chartCandles.value = []
  chartSnapshot.value = null
  chartError.value = null

  if (!product || !isChartAsset(product)) {
    chartLoading.value = false
    return
  }

  chartLoading.value = true
  try {
    const [candlesResult, snapshot] = await Promise.all([
      portfolioService.getProductCandlesList(product.productId, { count: CHART_CANDLE_COUNT }),
      portfolioService.getProductMarketSnapshotData(product.productId),
    ])
    if (requestId !== chartRequestId) return

    chartCandles.value = candlesResult.candles
    applySnapshot(snapshot)
    if (snapshot.marketOpen) {
      startSnapshotPolling(product.productId, requestId)
    }
  } catch (err) {
    if (requestId !== chartRequestId) return
    chartError.value = err.message || '시세 차트를 불러오지 못했어요.'
  } finally {
    if (requestId === chartRequestId) chartLoading.value = false
  }
}

const selectChartProduct = (product) => {
  if (!isChartAsset(product)) return
  if (selectedChartProductId.value === product.productId) return
  selectedChartProductId.value = product.productId
}

// 카탈로그가 채워지면 첫 STOCK·FUND를 자동 선택. 필터 변경으로 선택이 목록에서
// 사라져도 차트 대상은 유지한다(상단 차트는 필터와 독립).
watch(
  chartableProducts,
  (products) => {
    if (!products.length) {
      selectedChartProductId.value = null
      return
    }
    const stillValid = products.some(
      (product) => product.productId === selectedChartProductId.value,
    )
    if (!stillValid) {
      selectedChartProductId.value = products[0].productId
    }
  },
  { immediate: true },
)

watch(selectedChartProductId, (productId) => {
  const product = chartableProducts.value.find((item) => item.productId === productId) ?? null
  loadChartForProduct(product)
})

const openBuyModal = async (product) => {
  buyError.value = null
  buyTargetProduct.value = product

  if (isChartAsset(product)) {
    selectChartProduct(product)
  }

  try {
    const detail = await store.fetchProductDetail(product.productId)
    if (detail && buyTargetProduct.value?.productId === product.productId) {
      buyTargetProduct.value = { ...product, ...detail }
    }
  } catch (err) {
    if (buyTargetProduct.value?.productId === product.productId) {
      buyError.value = err.message || '가격 정보를 불러오지 못했어요.'
    }
  }
}

const closeBuyModal = () => {
  if (isBuying.value) return
  buyTargetProduct.value = null
  buyError.value = null
}

const handleBuyConfirm = async (amount) => {
  isBuying.value = true
  buyError.value = null

  try {
    const result = await store.buyProduct(buyTargetProduct.value, amount)
    tradeResult.value = {
      ...result,
      productName: buyTargetProduct.value.displayName,
      assetType: buyTargetProduct.value.assetType,
    }
    buyTargetProduct.value = null
  } catch (err) {
    buyError.value = err.message || '구매 처리 중 문제가 발생했어요. 다시 시도해주세요.'
  } finally {
    isBuying.value = false
  }
}

const closeTradeResult = () => {
  tradeResult.value = null
}
</script>

<template>
  <div
    data-scroll-reveal-root
    class="nav-scroll-pad absolute inset-0 flex flex-col gap-3 overflow-y-auto overscroll-contain"
  >
    <!-- PortfolioTabs → 차트 → 자산군 chip 순서 -->
    <ProductCandleChart
      v-if="selectedChartProduct"
      :product-name="selectedChartProduct.displayName"
      :candles="chartCandles"
      :live-candle="chartSnapshot?.currentCandle"
      :current-price="chartSnapshot?.currentPrice ?? selectedChartProduct.unitPrice"
      :market-open="Boolean(chartSnapshot?.marketOpen)"
      :loading="chartLoading"
      :error-message="chartError"
    />

    <div class="cork-board-patch sticky top-0 z-10 py-1.5">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="filter in FILTERS"
          :key="filter.value"
          type="button"
          class="shrink-0 rounded-full px-3 py-1.5 font-serif text-xs font-bold transition-colors"
          :class="
            activeFilter === filter.value
              ? 'border-[1.5px] border-[#c17f24] bg-[#fff8ec] text-[#2c1810]'
              : 'border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] text-[rgba(41,33,26,0.55)]'
          "
          @click="activeFilter = filter.value"
        >
          <span
            v-if="filter.color"
            class="mr-1.5 inline-block size-2 rounded-full align-middle"
            :style="{ backgroundColor: filter.color }"
          />
          {{ filter.label }}
        </button>
      </div>
    </div>

    <ScrollReveal v-if="store.summary">
      <p class="font-serif text-xs text-[rgba(41,33,26,0.55)]">
        구매 가능 현금
        <span class="font-bold text-[#2c1810]"
          >{{ store.summary.cashBalance.toLocaleString('ko-KR') }}원</span
        >
      </p>
    </ScrollReveal>

    <p v-if="store.error" class="font-serif text-sm text-[#c0433f]">{{ store.error }}</p>

    <ScrollReveal v-if="filteredProducts.length">
      <div
        class="rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] shadow-[0_4px_12px_rgba(44,24,16,0.1)]"
      >
        <ul class="divide-y divide-[rgba(193,127,36,0.15)]">
          <ProductListItem
            v-for="product in filteredProducts"
            :key="product.productId"
            :product="product"
            :is-held="heldProductIds.has(product.productId)"
            :selectable="isChartAsset(product)"
            :selected="product.productId === selectedChartProductId"
            @select="selectChartProduct"
            @buy="openBuyModal"
          />
        </ul>
      </div>
    </ScrollReveal>

    <p v-else-if="store.isLoading" class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
      불러오는 중…
    </p>
    <div v-else class="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <p class="font-serif text-base text-[rgba(41,33,26,0.5)]">해당 자산군의 상품이 없어요.</p>
    </div>

    <BuyProductModal
      v-if="buyTargetProduct && store.summary"
      :product="buyTargetProduct"
      :cash-balance="store.summary.cashBalance"
      :is-submitting="isBuying"
      :error-message="buyError"
      @close="closeBuyModal"
      @confirm="handleBuyConfirm"
    />

    <TradeResultModal v-if="tradeResult" :result="tradeResult" @close="closeTradeResult" />
  </div>
</template>
