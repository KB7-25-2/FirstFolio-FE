<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import ProductCandleChart from '@/components/portfolio/ProductCandleChart.vue'
import BuyProductModal from '@/components/portfolio/BuyProductModal.vue'
import SellHoldingModal from '@/components/portfolio/SellHoldingModal.vue'
import TradeResultModal from '@/components/portfolio/TradeResultModal.vue'
import { getAssetTypeMeta } from '@/constants/assetType.js'
import {
  calcPriceChangeVsOpen,
  formatPriceChangeAmount,
  formatPriceChangeRate,
  priceChangeFlashClass,
  priceChangeToneClass,
} from '@/utils/priceChange.js'
import { attachSellTradeMeta } from '@/utils/sellProfit.js'
import * as portfolioService from '@/services/portfolioTradeService.js'

const CHART_CANDLE_COUNT = 200
const SNAPSHOT_POLL_MS = 2_000

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close'])

const store = usePortfolioStore()

const productState = ref({ ...props.product })
const chartCandles = ref([])
const chartSnapshot = ref(null)
const chartLoading = ref(false)
const chartError = ref(null)

const buyTargetProduct = ref(null)
const isBuying = ref(false)
const buyError = ref(null)

const sellTargetHolding = ref(null)
const isSelling = ref(false)
const sellError = ref(null)
const tradeResult = ref(null)

let snapshotPollTimer = null
let chartRequestId = 0

const productId = computed(() => props.product.productId)

const meta = computed(() => getAssetTypeMeta(productState.value?.assetType))
const buyLabel = computed(() => meta.value.buyActionLabel || '매수')
const sellLabel = computed(() => meta.value.sellActionLabel || '매도')

const activeHolding = computed(
  () =>
    (store.summary?.holdings ?? []).find(
      (holding) => holding.status === 'ACTIVE' && holding.productId === productId.value,
    ) ?? null,
)

const canSell = computed(() => activeHolding.value != null)

const currentPrice = computed(
  () => chartSnapshot.value?.currentPrice ?? productState.value?.unitPrice ?? null,
)

const openPrice = computed(
  () => chartSnapshot.value?.currentCandle?.openPrice ?? productState.value?.openPrice ?? null,
)

const priceChange = computed(() => calcPriceChangeVsOpen(currentPrice.value, openPrice.value))

const priceToneClass = computed(() => {
  if (!priceChange.value || priceChange.value.direction === 'flat') return 'text-[#2c1810]'
  return priceChangeToneClass(priceChange.value.direction)
})

const priceLabel = computed(() => {
  if (currentPrice.value == null) return '시세 준비 중'
  return `${currentPrice.value.toLocaleString('ko-KR')}원`
})

const flashDirection = ref(null)
let priceFlashTimer = null

watch(currentPrice, (next, prev) => {
  if (prev == null || next == null || next === prev) return
  flashDirection.value = next > prev ? 'up' : 'down'
  if (priceFlashTimer) clearTimeout(priceFlashTimer)
  priceFlashTimer = setTimeout(() => {
    flashDirection.value = null
    priceFlashTimer = null
  }, 700)
})

const changeAmountLabel = computed(() =>
  priceChange.value ? formatPriceChangeAmount(priceChange.value.amount) : null,
)

const changeRateLabel = computed(() =>
  priceChange.value ? formatPriceChangeRate(priceChange.value.rate) : null,
)

const marketStatusLabel = computed(() =>
  chartSnapshot.value?.marketOpen ? '장중 · 실시간 갱신' : '장외 · 확정 시세',
)

const stopSnapshotPolling = () => {
  if (!snapshotPollTimer) return
  clearInterval(snapshotPollTimer)
  snapshotPollTimer = null
}

const pollMarketSnapshot = async (id, requestId) => {
  try {
    const snapshot = await portfolioService.getProductMarketSnapshotData(id)
    if (requestId !== chartRequestId) return
    chartSnapshot.value = snapshot
    productState.value = {
      ...productState.value,
      unitPrice: snapshot.currentPrice ?? productState.value.unitPrice,
      openPrice: snapshot.currentCandle?.openPrice ?? productState.value.openPrice,
    }
    if (!snapshot.marketOpen) stopSnapshotPolling()
  } catch {
    // 폴링 실패 시 확정 일봉은 유지
  }
}

const startSnapshotPolling = (id, requestId) => {
  stopSnapshotPolling()
  snapshotPollTimer = setInterval(() => pollMarketSnapshot(id, requestId), SNAPSHOT_POLL_MS)
}

const loadMarket = async (id) => {
  const requestId = (chartRequestId += 1)
  stopSnapshotPolling()
  chartCandles.value = []
  chartSnapshot.value = null
  chartError.value = null
  chartLoading.value = true
  productState.value = { ...props.product }

  try {
    if (!store.summary) await store.fetchSummary()

    const [candlesResult, snapshot] = await Promise.all([
      portfolioService.getProductCandlesList(id, { count: CHART_CANDLE_COUNT }),
      portfolioService.getProductMarketSnapshotData(id),
    ])
    if (requestId !== chartRequestId) return

    chartCandles.value = candlesResult.candles
    chartSnapshot.value = snapshot
    productState.value = {
      ...productState.value,
      unitPrice: snapshot.currentPrice ?? productState.value.unitPrice,
      openPrice: snapshot.currentCandle?.openPrice ?? null,
    }
    if (snapshot.marketOpen) startSnapshotPolling(id, requestId)
  } catch (err) {
    if (requestId !== chartRequestId) return
    chartError.value = err.message || '시세 차트를 불러오지 못했어요.'
  } finally {
    if (requestId === chartRequestId) chartLoading.value = false
  }
}

watch(
  productId,
  (id) => {
    if (id == null) return
    loadMarket(id)
  },
  { immediate: true },
)

onUnmounted(() => {
  chartRequestId += 1
  stopSnapshotPolling()
  if (priceFlashTimer) clearTimeout(priceFlashTimer)
})

const handleClose = () => {
  if (isBuying.value || isSelling.value) return
  emit('close')
}

// 매수/매도 모달은 연 시점 스냅샷을 들고 있으므로, 스냅샷 폴링으로 갱신된
// productState 시세를 덮어씌워 현재가·예상 금액이 장중에도 따라가게 한다.
const buyModalProduct = computed(() => {
  if (!buyTargetProduct.value) return null
  return {
    ...buyTargetProduct.value,
    unitPrice: productState.value?.unitPrice ?? buyTargetProduct.value.unitPrice,
    openPrice: productState.value?.openPrice ?? buyTargetProduct.value.openPrice,
  }
})

const sellModalHolding = computed(() => {
  if (!sellTargetHolding.value) return null
  const liveHolding = activeHolding.value
  return {
    ...(liveHolding ?? sellTargetHolding.value),
    unitPrice:
      productState.value?.unitPrice ?? liveHolding?.unitPrice ?? sellTargetHolding.value.unitPrice,
  }
})

const openBuyModal = async () => {
  buyError.value = null
  buyTargetProduct.value = productState.value
  try {
    const detail = await store.fetchProductDetail(productState.value.productId)
    if (detail && buyTargetProduct.value?.productId === productState.value.productId) {
      // 상세의 고정 시세보다 폴링 중인 productState 시세를 우선한다
      buyTargetProduct.value = {
        ...productState.value,
        ...detail,
        unitPrice: productState.value.unitPrice ?? detail.unitPrice,
        openPrice: productState.value.openPrice ?? detail.openPrice,
      }
    }
  } catch (err) {
    buyError.value = err.message || '가격 정보를 불러오지 못했어요.'
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
    await store.fetchSummary()
  } catch (err) {
    buyError.value = err.message || '구매 처리 중 문제가 발생했어요. 다시 시도해주세요.'
  } finally {
    isBuying.value = false
  }
}

const openSellModal = () => {
  if (!activeHolding.value) return
  sellError.value = null
  sellTargetHolding.value = activeHolding.value
}

const closeSellModal = () => {
  if (isSelling.value) return
  sellTargetHolding.value = null
  sellError.value = null
}

const handleSellConfirm = async (quantity) => {
  isSelling.value = true
  sellError.value = null
  try {
    const result = await store.sellHolding(sellTargetHolding.value.holdingId, quantity)
    tradeResult.value = attachSellTradeMeta(result, sellTargetHolding.value, quantity)
    sellTargetHolding.value = null
    await store.fetchSummary()
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
  <!-- main(z-10) 안에서 열리면 nav-dock(z-20)에 매도/매수 버튼이 가려지므로 body로 올림 -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/50"
        aria-label="시세 모달 닫기"
        @click="handleClose"
      />

      <div
        class="relative z-10 flex max-h-[min(92dvh,760px)] w-full max-w-[var(--mobile-width)] flex-col overflow-hidden rounded-t-2xl border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] shadow-[0_-12px_40px_rgba(44,24,16,0.28)] sm:rounded-2xl"
      >
        <div class="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-1">
          <p class="font-serif text-[11px] font-bold tracking-wide text-[rgba(41,33,26,0.45)]">
            상품 시세
          </p>
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-full bg-[rgba(193,127,36,0.12)] font-serif text-sm text-[#c17f24] transition-colors hover:bg-[rgba(193,127,36,0.24)]"
            aria-label="닫기"
            @click="handleClose"
          >
            ✕
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3">
          <div class="mb-4">
            <h2 class="font-serif text-xl font-bold text-[#2c1810]">
              {{ productState.displayName || '상품 시세' }}
            </h2>
            <p
              class="mt-2 font-serif text-2xl font-bold leading-none"
              :class="[priceToneClass, priceChangeFlashClass(flashDirection)]"
            >
              {{ priceLabel }}
            </p>
            <p
              v-if="changeAmountLabel"
              class="mt-1.5 font-serif text-sm font-bold"
              :class="[priceToneClass, priceChangeFlashClass(flashDirection)]"
            >
              {{ changeAmountLabel }}
              <span class="ml-1">{{ changeRateLabel }}</span>
            </p>
            <p
              class="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-serif text-[12px]"
            >
              <span v-if="productState.riskLevel" class="font-medium text-[rgba(41,33,26,0.72)]">
                {{ productState.riskLevel }}
              </span>
              <span
                v-if="productState.riskLevel"
                class="text-[rgba(41,33,26,0.35)]"
                aria-hidden="true"
              >
                ·
              </span>
              <span
                class="inline-flex items-center gap-1 font-semibold"
                :class="chartSnapshot?.marketOpen ? 'text-[#a86b1a]' : 'text-[rgba(41,33,26,0.72)]'"
              >
                <span
                  class="inline-block size-1.5 shrink-0 rounded-full"
                  :class="chartSnapshot?.marketOpen ? 'bg-[#c17f24]' : 'bg-[rgba(41,33,26,0.35)]'"
                  aria-hidden="true"
                />
                {{ marketStatusLabel }}
              </span>
            </p>
          </div>

          <ProductCandleChart
            variant="detail"
            :product-name="productState.displayName || ''"
            :candles="chartCandles"
            :live-candle="chartSnapshot?.currentCandle"
            :current-price="currentPrice"
            :market-open="Boolean(chartSnapshot?.marketOpen)"
            :loading="chartLoading"
            :error-message="chartError"
          />
        </div>

        <div
          class="shrink-0 border-t-[0.5px] border-[rgba(193,127,36,0.25)] bg-[#fff8ec] px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div class="flex gap-2">
            <button
              type="button"
              class="flex h-11 flex-1 items-center justify-center rounded-[10px] border-[0.5px] border-[#c17f24] bg-[#fff8ec] font-serif text-[14px] font-bold text-[#c17f24] shadow-[0_3px_6px_rgba(139,80,20,0.18)] transition-colors hover:enabled:bg-[rgba(193,127,36,0.12)] disabled:opacity-40"
              :disabled="!canSell"
              @click="openSellModal"
            >
              {{ sellLabel }}
            </button>
            <button
              type="button"
              class="flex h-11 flex-1 items-center justify-center rounded-[10px] bg-[#c17f24] font-serif text-[14px] font-bold text-[#fff8ec] shadow-[0_3px_6px_rgba(139,80,20,0.35)] transition-colors hover:bg-[#a86c1d]"
              @click="openBuyModal"
            >
              {{ buyLabel }}
            </button>
          </div>
        </div>
      </div>

      <BuyProductModal
        v-if="buyModalProduct && store.summary"
        :product="buyModalProduct"
        :cash-balance="store.summary.cashBalance"
        :is-submitting="isBuying"
        :error-message="buyError"
        @close="closeBuyModal"
        @confirm="handleBuyConfirm"
      />

      <SellHoldingModal
        v-if="sellModalHolding"
        :holding="sellModalHolding"
        :is-submitting="isSelling"
        :error-message="sellError"
        @close="closeSellModal"
        @confirm="handleSellConfirm"
      />

      <TradeResultModal v-if="tradeResult" :result="tradeResult" @close="closeTradeResult" />
    </div>
  </Teleport>
</template>
