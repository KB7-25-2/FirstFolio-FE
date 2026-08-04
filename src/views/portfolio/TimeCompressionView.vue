<script setup>
import { onMounted } from 'vue'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import VolatilityLineChart from '@/components/portfolio/VolatilityLineChart.vue'
import CompressionRuleItem from '@/components/portfolio/CompressionRuleItem.vue'

const store = usePortfolioStore()

onMounted(() => {
  store.fetchTimeCompressionRules()
})

// TODO: "예제 예시" 라벨이 붙은 고정 예시 그래프인지, 실시간 계산값인지 정책 확인 필요.
// 확인 전까지는 화면 학습용 정적 데이터로 둔다.
const EXAMPLE_VOLATILITY_POINTS = [
  { label: 'D0', value: 20 },
  { label: 'D1', value: 32 },
  { label: 'D2', value: 28 },
  { label: 'D3', value: 45 },
  { label: 'D4', value: 40 },
  { label: 'D5', value: 58 },
  { label: 'D6', value: 66 },
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <section
      class="rounded-2xl border border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
    >
      <p class="font-pen text-sm text-[var(--pf-highlight)]">작동 원리는?</p>
      <h2 class="mt-1 text-lg font-bold text-[var(--pf-text)]">서비스 6일 ≈ 실제 6개월</h2>
      <p class="mt-2 text-sm leading-relaxed text-[var(--pf-text-muted)]">
        자산 변화를 빠르게 경험하도록 만기·이자·배당·가격 주기를 단축해요. 계산은 시뮬레이션
        정책으로 관리되며 동일 조건에서 재현됩니다.
      </p>
    </section>

    <section
      class="rounded-2xl border border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
    >
      <p class="font-pen text-sm text-[var(--pf-highlight)]">예제 예시 (서비스 1일)</p>
      <h2 class="mt-1 font-bold text-[var(--pf-text)]">변동성 밴드 · 기대 수익률</h2>

      <VolatilityLineChart :points="EXAMPLE_VOLATILITY_POINTS" class="mt-3" />

      <div class="mt-3 flex items-center justify-between text-xs">
        <span class="text-[var(--pf-positive)]">기대 +4.8%</span>
        <span class="text-[var(--pf-text-muted)]">변동성 ±2.4%</span>
        <span class="rounded-full bg-white/10 px-2 py-0.5 text-[var(--pf-text-muted)]"
          >재현 가능</span
        >
      </div>
    </section>

    <section
      class="rounded-2xl border border-[var(--pf-card-border)] bg-[var(--pf-card-bg)] p-4 backdrop-blur-md"
    >
      <p class="font-pen text-sm text-[var(--pf-highlight)]">시뮬레이션 규칙</p>
      <h2 class="mt-1 font-bold text-[var(--pf-text)]">서비스 내 주기 / 실제 상품</h2>

      <ul class="mt-2">
        <CompressionRuleItem
          v-for="rule in store.timeCompressionRules"
          :key="rule.productName"
          :rule="rule"
        />
      </ul>

      <p
        v-if="!store.timeCompressionRules.length && store.isLoading"
        class="mt-2 text-sm text-[var(--pf-text-muted)]"
      >
        불러오는 중…
      </p>
    </section>
  </div>
</template>
