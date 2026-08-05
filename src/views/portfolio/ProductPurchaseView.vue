<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import ProductListItem from '@/components/portfolio/ProductListItem.vue'
import BuyProductModal from '@/components/portfolio/BuyProductModal.vue'
import { ASSET_TYPE_META } from '@/constants/assetType.js'

const store = usePortfolioStore()

const FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'DEPOSIT_SAVINGS', label: ASSET_TYPE_META.DEPOSIT_SAVINGS.label },
  { value: 'BOND', label: ASSET_TYPE_META.BOND.label },
  { value: 'STOCK', label: ASSET_TYPE_META.STOCK.label },
  { value: 'FUND', label: ASSET_TYPE_META.FUND.label },
]

const activeFilter = ref('ALL')
const buyTargetProduct = ref(null)
const isBuying = ref(false)
const buyError = ref(null)

onMounted(() => {
  store.fetchPurchasableProducts()
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
    await store.buyProduct(buyTargetProduct.value, amount)
    buyTargetProduct.value = null
  } catch (err) {
    buyError.value = err.message || '구매 처리 중 문제가 발생했어요. 다시 시도해주세요.'
  } finally {
    isBuying.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="filter in FILTERS"
        :key="filter.value"
        type="button"
        class="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors"
        :class="
          activeFilter === filter.value
            ? 'bg-[var(--pf-tab-active-bg)] text-[var(--pf-tab-active-text)]'
            : 'border border-[var(--pf-card-border)] text-[var(--pf-text-muted)]'
        "
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <p v-if="store.summary" class="text-xs text-[var(--pf-text-muted)]">
      구매 가능 현금
      <span class="font-bold text-[var(--pf-text)]"
        >{{ store.summary.cashBalance.toLocaleString('ko-KR') }}원</span
      >
    </p>

    <p v-if="store.error" class="text-sm text-[var(--pf-negative)]">{{ store.error }}</p>

    <div
      v-if="filteredProducts.length"
      class="overflow-hidden rounded-2xl border border-[var(--pf-card-border)] bg-white/8"
    >
      <ul class="divide-y divide-white/5">
        <ProductListItem
          v-for="product in filteredProducts"
          :key="product.productId"
          :product="product"
          :is-held="heldProductIds.has(product.productId)"
          @buy="openBuyModal"
        />
      </ul>
    </div>

    <p v-else-if="store.isLoading" class="text-sm text-[var(--pf-text-muted)]">불러오는 중…</p>
    <p v-else class="text-sm text-[var(--pf-text-muted)]">해당 자산군의 상품이 없어요.</p>

    <BuyProductModal
      v-if="buyTargetProduct && store.summary"
      :product="buyTargetProduct"
      :cash-balance="store.summary.cashBalance"
      :is-submitting="isBuying"
      :error-message="buyError"
      @close="closeBuyModal"
      @confirm="handleBuyConfirm"
    />
  </div>
</template>
