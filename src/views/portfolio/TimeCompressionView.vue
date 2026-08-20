<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import ScrollReveal from '@/components/ScrollReveal.vue'

const store = usePortfolioStore()

const carouselEl = ref(null)
const activeIndex = ref(0)

// "서비스 1일 만기 · 1일마다 이자 · 실제 1개월 만기 · 실제 만기 시 일괄 이자" 같은 한 문장을
// 손글씨체 대형 텍스트로 그대로 찍으면 가독성이 떨어진다. "·" 기준으로 쪼개서 개별 칩으로
// 보여주면 각 조건을 스캔하기 쉬워진다.
const cycleSummaryChips = (product) =>
  product.cycleSummary ? product.cycleSummary.split(' · ') : []

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
  <div
    data-scroll-reveal-root
    class="nav-scroll-pad hide-scrollbar absolute inset-0 flex flex-col gap-3 overflow-y-auto overscroll-contain"
  >
    <div class="flex shrink-0 items-baseline justify-between">
      <p class="font-pen text-base text-[#c17f24]">상품별 시간 압축 비교</p>
      <p class="font-serif text-[10px] text-[rgba(41,33,26,0.45)]">옆으로 넘겨서 비교해보세요 →</p>
    </div>

    <ScrollReveal v-if="sortedProducts.length">
      <div class="flex flex-col gap-3">
        <div
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
            <p class="mt-0.5 font-serif text-xs text-[rgba(41,33,26,0.55)]">
              {{ product.riskLevel }}
            </p>

            <h2 class="mt-3 font-serif text-sm font-bold text-[#2c1810]">상품 조건</h2>
            <div v-if="cycleSummaryChips(product).length" class="mt-1.5 flex flex-wrap gap-1.5">
              <span
                v-for="(chip, index) in cycleSummaryChips(product)"
                :key="index"
                class="rounded-full border-[0.5px] border-[rgba(193,127,36,0.35)] bg-[rgba(193,127,36,0.08)] px-2 py-1 font-serif text-[11px] font-medium text-[#8a5c1e]"
              >
                {{ chip }}
              </span>
            </div>
            <p v-else class="mt-1.5 font-serif text-sm text-[rgba(41,33,26,0.55)]">실시간 시세</p>
            <p class="mt-2 font-serif text-sm leading-relaxed text-[rgba(41,33,26,0.65)]">
              서비스 안에서는 압축된 기간으로 빠르게 진행되지만, 실제 상품 기준으로는 위 기간을
              따릅니다. 계산은 동일 조건에서 재현 가능하게 관리돼요.
            </p>
          </section>
        </div>

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
    </ScrollReveal>

    <p v-else-if="store.isLoading" class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
      불러오는 중…
    </p>
    <p v-else class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
      시간 압축이 적용되는 상품이 없어요.
    </p>
  </div>
</template>

<style scoped>
.carousel-scroll::-webkit-scrollbar {
  display: none;
}
</style>
