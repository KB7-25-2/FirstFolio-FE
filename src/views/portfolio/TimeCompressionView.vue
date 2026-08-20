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

// productId → 카탈로그 상품(FUNC-031). cycleSummary/riskLevel/isTimeCompressionExempt는
// 보유 응답(FUNC-034)엔 없어서 카탈로그와 조인해야 한다.
const productsById = computed(() =>
  Object.fromEntries(store.purchasableProducts.map((product) => [product.productId, product])),
)

// 이 화면은 "보유한" 예·적금·채권만 보여준다(주식·펀드는 애초에 시간 압축 대상이 아님 — FUNC-039).
const heldTimeCompressedItems = computed(() => {
  const holdings = store.summary?.holdings ?? []
  return holdings
    .filter((holding) => holding.status === 'ACTIVE')
    .map((holding) => {
      const product = productsById.value[holding.productId]
      if (!product || product.isTimeCompressionExempt) return null

      return {
        ...product,
        holdingId: holding.holdingId,
        principalAmount: holding.principalAmount,
        valuationAmount: holding.valuationAmount,
      }
    })
    .filter(Boolean)
})

// --- 성장 곡선(시간 압축 그래프) ---
// x축 = 서비스 경과일, y축 = 원금+이자 누적 가치. 백엔드 AssetEventCalculator(FUNC-041)가
// 실제로 이자를 계산하는 방식과 최대한 맞춘다:
// - 예·적금, 복리채: 만기 1회 지급 → 평평하다가 만기에 한 번에 계단식으로 오른다.
// - 이표채(주기 지급): 주기마다 계단식으로 오르고, 마지막 회차는 남은 개월만큼만 일할 지급.
// interval/월 비율을 서비스 일수(day)로 그대로 환산한다 — 시간 압축이 개월→일 비율을
// 균등하게 압축했다는 전제라 이 환산이 맞다.
const buildGrowthCurve = (item) => {
  const principal = item.principalAmount
  const maturityHours = item.simulationTerms?.maturityHours
  const maturityMonths = item.realTerms?.maturityMonths
  const rate = item.realTerms?.rate
  if (!principal || !maturityHours || !maturityMonths || rate == null) return null

  const serviceMaturityDays = maturityHours / 24
  const r = rate / 100
  const intervalMonths = item.realTerms?.intervalMonths

  // 이자소득세 15.4% — 백엔드 AssetEventCalculator.interest()가 지급 건마다 떼는 세율
  // (TradePolicyProvider 기본값 trade.policy.interest-income-tax-rate:0.154)과 동일하게
  // 맞춘다. API로 내려오는 값이 아니라 백엔드 기본 설정을 그대로 가정한 것이라, 배포 환경에서
  // 이 값이 바뀌면 여기도 같이 바꿔야 한다.
  const AFTER_TAX = 1 - 0.154

  // {day, value} 쌍을 순서대로 쌓는다. 계단식이라 같은 day에 지급 전/후 두 점을 넣는다.
  const points = [{ day: 0, value: principal }]

  if (intervalMonths && intervalMonths > 0) {
    // 이표채: 주기마다 쿠폰 지급(세후)
    let paidMonths = 0
    let cumulative = principal
    while (paidMonths + intervalMonths <= maturityMonths) {
      paidMonths += intervalMonths
      const coupon = principal * r * (intervalMonths / 12) * AFTER_TAX
      const day = (paidMonths / maturityMonths) * serviceMaturityDays
      points.push({ day, value: cumulative })
      cumulative += coupon
      points.push({ day, value: cumulative })
    }
    const remainderMonths = maturityMonths - paidMonths
    if (remainderMonths > 0) {
      const coupon = principal * r * (remainderMonths / 12) * AFTER_TAX
      points.push({ day: serviceMaturityDays, value: cumulative })
      cumulative += coupon
      points.push({ day: serviceMaturityDays, value: cumulative })
    }
  } else {
    // 예·적금, 복리채: 만기 시 일괄 지급(세후)
    // 예·적금은 rateType==='COMPOUND', 채권은 interestType에 "복리"가 포함되는지로 복리를
    // 판정한다(백엔드 AssetEventTerms 기준 — 필드 자체가 자산군마다 다르다).
    const isCompound =
      item.realTerms?.rateType === 'COMPOUND' ||
      (item.realTerms?.interestType?.includes('복리') ?? false)
    let totalInterest
    if (isCompound) {
      const years = Math.floor(maturityMonths / 12)
      const remainderMonths = maturityMonths % 12
      totalInterest =
        (principal * (1 + r) ** years * (1 + r * (remainderMonths / 12)) - principal) * AFTER_TAX
    } else {
      totalInterest = principal * r * (maturityMonths / 12) * AFTER_TAX
    }
    points.push({ day: serviceMaturityDays, value: principal })
    points.push({ day: serviceMaturityDays, value: principal + totalInterest })
  }

  const values = points.map((p) => p.value)
  return {
    points,
    maturityDays: serviceMaturityDays,
    minValue: principal,
    maxValue: Math.max(...values),
  }
}

const growthCurveCache = new Map()
const growthCurve = (item) => {
  if (!growthCurveCache.has(item.holdingId)) {
    growthCurveCache.set(item.holdingId, buildGrowthCurve(item))
  }
  return growthCurveCache.get(item.holdingId)
}

// SVG viewBox 300×120. y축은 0부터가 아니라 원금(minValue)부터 시작해야 계단이 보인다 —
// 억 단위 원금 대비 이자 몇만 원은 0 기준으론 눈에 안 띌 만큼 작다.
const CHART_WIDTH = 300
const CHART_HEIGHT = 100

const growthCurvePath = (item) => {
  const curve = growthCurve(item)
  if (!curve) return ''
  const { points, maturityDays, minValue, maxValue } = curve
  const yRange = maxValue - minValue || 1
  const toX = (day) => (maturityDays > 0 ? (day / maturityDays) * CHART_WIDTH : 0)
  const toY = (value) => CHART_HEIGHT - ((value - minValue) / yRange) * CHART_HEIGHT

  return points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${toX(point.day).toFixed(1)} ${toY(point.value).toFixed(1)}`,
    )
    .join(' ')
}

const growthCurveEndLabel = (item) => {
  const curve = growthCurve(item)
  if (!curve) return null
  return formatWon(curve.maxValue)
}

const growthCurveStartLabel = (item) => {
  const curve = growthCurve(item)
  return curve ? formatWon(curve.minValue) : null
}

const growthCurveDaysLabel = (item) => {
  const curve = growthCurve(item)
  if (!curve) return null
  const days = curve.maturityDays
  return Number.isInteger(days) ? `${days}일` : `${days.toFixed(1)}일`
}

const growthCurveProfitRate = (item) => {
  const curve = growthCurve(item)
  if (!curve || curve.minValue <= 0) return null
  return ((curve.maxValue - curve.minValue) / curve.minValue) * 100
}

const formatWon = (value) => `${Math.round(value).toLocaleString('ko-KR')}원`
const formattedProfitRate = (rate) => `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`
const profitRateClass = (rate) => {
  if (rate > 0) return 'text-[var(--pf-positive)]'
  if (rate < 0) return 'text-[var(--pf-negative)]'
  return 'text-[rgba(41,33,26,0.5)]'
}

// 데이터가 로드되면 첫 슬라이드로 스크롤 위치를 맞춘다.
watch(
  heldTimeCompressedItems,
  async (items) => {
    if (!items.length) return
    activeIndex.value = 0
    await nextTick()
    if (carouselEl.value) carouselEl.value.scrollTo({ left: 0 })
  },
  { immediate: true },
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
</script>

<template>
  <div
    data-scroll-reveal-root
    class="nav-scroll-pad hide-scrollbar absolute inset-0 flex flex-col gap-3 overflow-y-auto overscroll-contain"
  >
    <div class="flex shrink-0 items-baseline justify-between">
      <p class="font-pen text-base text-[#c17f24]">내가 보유한 상품의 시간 압축</p>
      <p
        v-if="heldTimeCompressedItems.length > 1"
        class="font-serif text-[10px] text-[rgba(41,33,26,0.45)]"
      >
        옆으로 넘겨서 비교해보세요 →
      </p>
    </div>

    <ScrollReveal v-if="heldTimeCompressedItems.length">
      <div class="flex flex-col gap-3">
        <div
          ref="carouselEl"
          class="carousel-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1"
          style="scrollbar-width: none"
          @scroll="handleScroll"
        >
          <section
            v-for="item in heldTimeCompressedItems"
            :key="item.holdingId"
            class="w-full shrink-0 snap-center rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] p-4 shadow-[0_4px_12px_rgba(44,24,16,0.1)]"
          >
            <p class="font-serif font-bold text-[#2c1810]">{{ item.displayName }}</p>
            <p class="mt-0.5 font-serif text-xs text-[rgba(41,33,26,0.55)]">
              {{ item.riskLevel }}
            </p>

            <h2 class="mt-3 font-serif text-sm font-bold text-[#2c1810]">상품 조건</h2>
            <div v-if="cycleSummaryChips(item).length" class="mt-1.5 flex flex-wrap gap-1.5">
              <span
                v-for="(chip, index) in cycleSummaryChips(item)"
                :key="index"
                class="rounded-full border-[0.5px] border-[rgba(193,127,36,0.35)] bg-[rgba(193,127,36,0.08)] px-2 py-1 font-serif text-[11px] font-medium text-[#8a5c1e]"
              >
                {{ chip }}
              </span>
            </div>

            <div class="mt-3">
              <div class="flex items-baseline justify-between">
                <h2 class="font-serif text-sm font-bold text-[#2c1810]">얼마나 오르나 (세후)</h2>
                <span
                  v-if="growthCurveProfitRate(item) != null"
                  class="font-serif text-sm font-bold"
                  :class="profitRateClass(growthCurveProfitRate(item))"
                >
                  만기 시 {{ formattedProfitRate(growthCurveProfitRate(item)) }}
                </span>
              </div>

              <template v-if="growthCurve(item)">
                <svg
                  viewBox="0 0 300 100"
                  preserveAspectRatio="none"
                  class="mt-2 h-24 w-full overflow-visible"
                >
                  <line
                    x1="0"
                    y1="100"
                    x2="300"
                    y2="100"
                    stroke="rgba(41,33,26,0.15)"
                    stroke-width="1"
                  />
                  <path
                    :d="growthCurvePath(item)"
                    fill="none"
                    stroke="#c17f24"
                    stroke-width="2.5"
                    stroke-linejoin="round"
                  />
                </svg>
                <div
                  class="mt-1 flex items-center justify-between font-serif text-[10px] text-[rgba(41,33,26,0.45)]"
                >
                  <span>0일 · {{ growthCurveStartLabel(item) }}</span>
                  <span>{{ growthCurveDaysLabel(item) }} · {{ growthCurveEndLabel(item) }}</span>
                </div>
              </template>
              <p v-else class="mt-1.5 font-serif text-[11px] text-[rgba(41,33,26,0.45)]">
                금리 정보가 없어 성장 곡선을 그릴 수 없어요.
              </p>

              <p class="mt-1.5 font-serif text-[10px] text-[rgba(41,33,26,0.45)]">
                원금 {{ formatWon(item.principalAmount) }} → 평가액
                {{ formatWon(item.valuationAmount) }}
              </p>
            </div>

            <p class="mt-3 font-serif text-sm leading-relaxed text-[rgba(41,33,26,0.65)]">
              서비스 안에서는 압축된 기간으로 빠르게 진행되지만, 실제 상품 기준으로는 위 기간을
              따릅니다. 계산은 동일 조건에서 재현 가능하게 관리돼요.
            </p>
          </section>
        </div>

        <div v-if="heldTimeCompressedItems.length > 1" class="flex justify-center gap-1.5">
          <button
            v-for="(item, index) in heldTimeCompressedItems"
            :key="item.holdingId"
            type="button"
            class="size-1.5 rounded-full transition-colors"
            :class="index === activeIndex ? 'bg-[#c17f24]' : 'bg-[rgba(193,127,36,0.2)]'"
            :aria-label="`${item.displayName} 보기`"
            @click="goToIndex(index)"
          />
        </div>
      </div>
    </ScrollReveal>

    <p v-else-if="store.isLoading" class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
      불러오는 중…
    </p>
    <p v-else class="font-serif text-sm text-[rgba(41,33,26,0.45)]">
      아직 보유한 예금·채권 상품이 없어요. 상품 구매 탭에서 가입해보세요.
    </p>
  </div>
</template>

<style scoped>
.carousel-scroll::-webkit-scrollbar {
  display: none;
}
</style>
