<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import ProductListItem from '@/components/portfolio/ProductListItem.vue'
import BuyProductModal from '@/components/portfolio/BuyProductModal.vue'
import TradeResultModal from '@/components/portfolio/TradeResultModal.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'
import { ASSET_TYPE_META } from '@/constants/assetType.js'

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
const tradeResult = ref(null) // 거래 완료 모달에 넘길 값(상품명·자산군 포함)

onMounted(() => {
  store.fetchPurchasableProducts().then(() => store.hydrateProductPrices())
  if (!store.summary) store.fetchSummary()
})

// 현재 보유 중인 상품(productId) 목록 — ACTIVE인 것만
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

const openBuyModal = async (product) => {
  buyError.value = null
  // 목록엔 가격이 없어서(FUNC-031) 우선 모달부터 열고("가격 정보 준비 중" 표시),
  // 상세 조회(FUNC-032)로 현재가를 받아오는 대로 채워 넣는다.
  buyTargetProduct.value = product

  try {
    const detail = await store.fetchProductDetail(product.productId)
    // 그 사이 사용자가 모달을 닫았거나 다른 상품을 열었으면 반영하지 않는다.
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
    // mapTradeResult엔 상품명이 없어서(응답 자체에 없음) 방금 산 product에서 채워 넣는다.
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
    <!-- ScrollReveal 밖에 둔다 — ScrollReveal이 인라인 transform을 걸어서, 그 안에서는
         position: sticky가 스크롤 컨테이너 기준이 아니라 transform이 만든 새 컨테이닝 블록
         기준으로 깨진다. -->
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
              : 'border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] text-[rgba(44,24,16,0.55)]'
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
