<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import VolatilityLineChart from '@/components/portfolio/VolatilityLineChart.vue'
import CompressionRuleItem from '@/components/portfolio/CompressionRuleItem.vue'

const store = usePortfolioStore()

const selectedProductId = ref(null)

onMounted(() => {
  store.fetchTimeCompressionRules()
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

// 보유 중인 상품을 맨 위로 정렬 (원래 순서는 각 그룹 내에서 유지)
const sortedRules = computed(() =>
  [...store.timeCompressionRules].sort((a, b) => {
    const aHeld = heldProductIds.value.has(a.productId) ? 0 : 1
    const bHeld = heldProductIds.value.has(b.productId) ? 0 : 1
    return aHeld - bHeld
  }),
)

// 데이터가 로드되면 기본 선택값을 정렬된 목록의 첫 번째(=보유 상품 우선)로 맞춘다.
watch(
  sortedRules,
  (rules) => {
    if (rules.length && selectedProductId.value === null) {
      selectedProductId.value = rules[0].productId
    }
  },
  { immediate: true },
)

const selectedRule = computed(
  () =>
    sortedRules.value.find((rule) => rule.productId === selectedProductId.value) ??
    sortedRules.value[0] ??
    null,
)

const handleSelect = (rule) => {
  selectedProductId.value = rule.productId
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <section
      class="rounded-2xl border border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
    >
      <p class="font-pen text-sm text-[var(--pf-highlight)]">상품 선택</p>
      <h2 class="mt-1 font-bold text-[var(--pf-text)]">서비스 내 주기 / 실제 상품</h2>
      <p class="mt-1 text-xs text-[var(--pf-text-muted)]">
        아래에서 상품을 선택하면 작동 원리와 그래프가 그 상품 기준으로 바뀌어요.
      </p>

      <ul class="mt-3 flex max-h- flex-col gap-1 overflow-y-auto pr-1">
        <CompressionRuleItem
          v-for="rule in sortedRules"
          :key="rule.productId"
          :rule="rule"
          :is-held="heldProductIds.has(rule.productId)"
          :is-selected="rule.productId === selectedProductId"
          @select="handleSelect"
        />
      </ul>

      <p
        v-if="!store.timeCompressionRules.length && store.isLoading"
        class="mt-2 text-sm text-[var(--pf-text-muted)]"
      >
        불러오는 중…
      </p>
    </section>

    <section
      v-if="selectedRule"
      class="rounded-2xl border border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
    >
      <p class="font-pen text-sm text-[var(--pf-highlight)]">
        {{ selectedRule.productName }} · 작동 원리는?
      </p>
      <h2 class="mt-1 text-lg font-bold text-[var(--pf-text)]">{{ selectedRule.headline }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-[var(--pf-text-muted)]">
        {{ selectedRule.description }}
      </p>
    </section>

    <section
      v-if="selectedRule"
      class="rounded-2xl border border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
    >
      <p class="font-pen text-sm text-[var(--pf-highlight)]">예제 예시 (서비스 1일)</p>
      <h2 class="mt-1 font-bold text-[var(--pf-text)]">변동성 밴드 · 기대 수익률</h2>

      <VolatilityLineChart
        :key="selectedRule.productId"
        :points="selectedRule.points"
        class="mt-3"
      />

      <div class="mt-3 flex items-center justify-between text-xs">
        <span class="text-[var(--pf-positive)]">기대 {{ selectedRule.expectedReturn }}</span>
        <span class="text-[var(--pf-text-muted)]">변동성 {{ selectedRule.volatility }}</span>
        <span class="rounded-full bg-white/10 px-2 py-0.5 text-[var(--pf-text-muted)]"
          >재현 가능</span
        >
      </div>
    </section>
  </div>
</template>
