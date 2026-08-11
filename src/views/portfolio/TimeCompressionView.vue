<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'

const store = usePortfolioStore()

const carouselEl = ref(null)
const activeIndex = ref(0)

onMounted(() => {
  if (!store.purchasableProducts.length) store.fetchPurchasableProducts()
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

// 주식·펀드는 시간압축 예외(실시간 시세, 만기 없음)라 이 화면 대상이 아니다(FUNC-039).
// 보유 중인 상품을 맨 앞 슬라이드로 정렬.
const sortedProducts = computed(() =>
  store.purchasableProducts
    .filter((product) => !product.isTimeCompressionExempt)
    .sort((a, b) => {
      const aHeld = heldProductIds.value.has(a.productId) ? 0 : 1
      const bHeld = heldProductIds.value.has(b.productId) ? 0 : 1
      return aHeld - bHeld
    }),
)

// 스크롤 위치로 현재 몇 번째 슬라이드가 보이는지 계산 (scroll-snap 기반, 별도 JS 드래그 로직 불필요)
let scrollTimer = null
const handleScroll = () => {
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    const el = carouselEl.value
    if (!el || !el.clientWidth) return
    activeIndex.value = Math.round(el.scrollLeft / el.clientWidth)
  }, 80)
}

const goToIndex = (index) => {
  const el = carouselEl.value
  if (!el) return
  el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
}

// 데이터가 로드되면 첫 슬라이드(=보유 상품 우선)로 스크롤 위치를 맞춘다.
watch(
  sortedProducts,
  async (products) => {
    if (!products.length) return
    activeIndex.value = 0
    await nextTick()
    if (carouselEl.value) carouselEl.value.scrollTo({ left: 0 })
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-baseline justify-between">
      <p class="font-pen text-base text-[#c17f24]">상품별 시간 압축 비교</p>
      <p class="font-serif text-[10px] text-[rgba(41,33,26,0.45)]">옆으로 넘겨서 비교해보세요 →</p>
    </div>

    <div
      v-if="sortedProducts.length"
      ref="carouselEl"
      class="carousel-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1"
      style="scrollbar-width: none"
      @scroll="handleScroll"
    >
      <section
        v-for="product in sortedProducts"
        :key="product.productId"
        class="w-full shrink-0 snap-center rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-4 shadow-[0_4px_12px_rgba(44,24,16,0.1)]"
      >
        <div class="flex items-center gap-1.5">
          <p class="font-serif font-bold text-[#2c1810]">{{ product.displayName }}</p>
          <span
            v-if="heldProductIds.has(product.productId)"
            class="rounded-full bg-[rgba(193,127,36,0.14)] px-1.5 py-0.5 font-serif text-[9px] font-bold text-[#c17f24]"
          >
            보유중
          </span>
        </div>
        <p class="mt-0.5 font-serif text-xs text-[rgba(41,33,26,0.55)]">{{ product.riskLevel }}</p>

        <h2 class="mt-3 font-pen text-xl text-[#2c1810]">
          {{ product.cycleSummary ?? '실시간 시세' }}
        </h2>
        <p class="mt-2 font-serif text-sm leading-relaxed text-[rgba(41,33,26,0.65)]">
          서비스 안에서는 압축된 기간으로 빠르게 진행되지만, 실제 상품 기준으로는 위 기간을
          따릅니다. 계산은 동일 조건에서 재현 가능하게 관리돼요.
        </p>
      </section>
    </div>

    <p v-else-if="store.isLoading" class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
      불러오는 중…
    </p>
    <p v-else class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
      시간 압축이 적용되는 상품이 없어요.
    </p>

    <!-- 페이지 인디케이터 (점) -->
    <div v-if="sortedProducts.length > 1" class="flex justify-center gap-1.5">
      <button
        v-for="(product, index) in sortedProducts"
        :key="product.productId"
        type="button"
        class="size-1.5 rounded-full transition-colors"
        :class="index === activeIndex ? 'bg-[#c17f24]' : 'bg-[rgba(193,127,36,0.2)]'"
        :aria-label="`${product.displayName} 보기`"
        @click="goToIndex(index)"
      />
    </div>
  </div>
</template>

<style scoped>
.carousel-scroll::-webkit-scrollbar {
  display: none;
}
</style>
