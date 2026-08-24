<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import {
  CHART_PERIODS,
  DEFAULT_CHART_PERIOD,
  buildChartCandlesForPeriod,
  formatChartCategoryLabel,
} from '@/utils/productChartCandles.js'
import {
  PRICE_CANDLE_DOWN,
  PRICE_CANDLE_UP,
  calcPriceChangeVsOpen,
  formatPriceChangeAmount,
  formatPriceChangeRate,
  priceChangeFlashClass,
  priceChangeSurfaceClass,
  priceChangeToneClass,
} from '@/utils/priceChange.js'

const props = defineProps({
  productName: {
    type: String,
    default: '',
  },
  candles: {
    type: Array,
    default: () => [],
  },
  liveCandle: {
    type: Object,
    default: null,
  },
  currentPrice: {
    type: Number,
    default: null,
  },
  marketOpen: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  /** card: 목록용 작은 카드 / detail: 시세 탭용 큰 차트 */
  variant: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'detail'].includes(value),
  },
})

const isDetail = computed(() => props.variant === 'detail')
const chartHeight = computed(() => (isDetail.value ? 280 : 150))

const selectedPeriod = ref(DEFAULT_CHART_PERIOD)

const periodCandles = computed(() =>
  buildChartCandlesForPeriod(props.candles, props.liveCandle, selectedPeriod.value),
)

const toChartPoint = (candle) => ({
  x: candle.tradeDate,
  y: [candle.openPrice, candle.highPrice, candle.lowPrice, candle.closePrice],
})

const chartSeries = computed(() => [
  {
    name: selectedPeriod.value === 'monthly' ? '월봉' : '일봉',
    data: periodCandles.value.map(toChartPoint),
  },
])

const hasData = computed(() => chartSeries.value[0].data.length > 0)

const priceLabel = computed(() => {
  if (props.currentPrice == null) return null
  return `${props.currentPrice.toLocaleString('ko-KR')}원`
})

const priceChange = computed(() =>
  calcPriceChangeVsOpen(props.currentPrice, props.liveCandle?.openPrice),
)

const priceToneClass = computed(() => {
  if (!priceChange.value) return 'text-[#c17f24]'
  if (priceChange.value.direction === 'flat') return 'text-[#c17f24]'
  return priceChangeToneClass(priceChange.value.direction)
})

const changeDirection = computed(() => priceChange.value?.direction ?? 'flat')

const flashDirection = ref(null)
let flashTimer = null

watch(
  () => props.currentPrice,
  (next, prev) => {
    if (prev == null || next == null || next === prev) return
    flashDirection.value = next > prev ? 'up' : 'down'
    if (flashTimer) clearTimeout(flashTimer)
    flashTimer = setTimeout(() => {
      flashDirection.value = null
      flashTimer = null
    }, 700)
  },
)

onUnmounted(() => {
  if (flashTimer) clearTimeout(flashTimer)
})

const changeAmountLabel = computed(() =>
  priceChange.value ? formatPriceChangeAmount(priceChange.value.amount) : null,
)

const changeRateLabel = computed(() =>
  priceChange.value ? formatPriceChangeRate(priceChange.value.rate) : null,
)

const formatPrice = (value) => Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 0 })

const chartOptions = computed(() => {
  const period = selectedPeriod.value
  return {
    chart: {
      type: 'candlestick',
      background: '#ffffff',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      animations: { enabled: false },
      parentHeightOffset: 0,
    },
    grid: {
      borderColor: 'rgba(193,127,36,0.18)',
      strokeDashArray: 3,
      padding: { left: 4, right: 4, top: 0, bottom: 0 },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: PRICE_CANDLE_UP,
          downward: PRICE_CANDLE_DOWN,
        },
        wick: { useFillColor: true },
      },
    },
    xaxis: {
      type: 'category',
      tickAmount: period === 'monthly' ? undefined : 6,
      labels: {
        style: { colors: 'rgba(41,33,26,0.55)', fontSize: '9px' },
        rotate: 0,
        hideOverlappingLabels: true,
        formatter: (value) => formatChartCategoryLabel(value, period),
      },
      axisBorder: { color: 'rgba(193,127,36,0.25)' },
      axisTicks: { show: false },
    },
    yaxis: {
      opposite: true,
      tooltip: { enabled: true },
      labels: {
        style: { colors: 'rgba(41,33,26,0.55)', fontSize: '9px' },
        minWidth: 48,
        maxWidth: 72,
        formatter: (value) => formatPrice(value),
      },
    },
    tooltip: {
      theme: 'light',
      custom: ({ dataPointIndex, w }) => {
        const point = w?.globals?.initialSeries?.[0]?.data?.[dataPointIndex]
        const ohlc = point?.y
        if (!Array.isArray(ohlc) || ohlc.length < 4) return ''
        const [open, high, low, close] = ohlc
        const dateLabel = formatChartCategoryLabel(point.x, period)
        return `
          <div style="padding:8px 10px;font-size:11px;line-height:1.5;color:#2c1810">
            <p style="margin:0 0 4px;font-weight:700">${dateLabel}</p>
            <p style="margin:0">시가 ${formatPrice(open)}</p>
            <p style="margin:0">고가 ${formatPrice(high)}</p>
            <p style="margin:0">저가 ${formatPrice(low)}</p>
            <p style="margin:0">종가 ${formatPrice(close)}</p>
          </div>
        `
      },
    },
  }
})
</script>

<template>
  <section
    :class="
      isDetail
        ? 'w-full'
        : 'rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] px-2.5 py-2 shadow-[0_4px_12px_rgba(44,24,16,0.1)]'
    "
  >
    <div v-if="!isDetail" class="mb-1 flex items-end justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate font-serif text-xs font-bold text-[#2c1810]">
          {{ productName || '상품 시세' }}
        </p>
        <p
          class="mt-0.5 flex items-center gap-1 font-serif text-[10px] font-semibold"
          :class="marketOpen ? 'text-[#a86b1a]' : 'text-[rgba(41,33,26,0.72)]'"
        >
          <span
            class="inline-block size-1.5 shrink-0 rounded-full"
            :class="marketOpen ? 'bg-[#c17f24]' : 'bg-[rgba(41,33,26,0.35)]'"
            aria-hidden="true"
          />
          {{ marketOpen ? '장중 · 실시간 갱신' : '장외 · 확정 시세' }}
        </p>
      </div>
      <div
        v-if="priceLabel"
        class="shrink-0 rounded-md border px-1.5 py-0.5 text-right transition-[border-color] duration-300"
        :class="priceChangeSurfaceClass(changeDirection)"
      >
        <p
          class="font-serif text-xs font-bold"
          :class="[priceToneClass, priceChangeFlashClass(flashDirection)]"
        >
          {{ priceLabel }}
        </p>
        <p
          v-if="changeAmountLabel"
          class="mt-0.5 font-serif text-[10px] font-bold"
          :class="[priceToneClass, priceChangeFlashClass(flashDirection)]"
        >
          {{ changeAmountLabel }}
          <span class="ml-0.5 font-semibold">{{ changeRateLabel }}</span>
        </p>
      </div>
    </div>

    <div class="mb-2 flex gap-1 overflow-x-auto" :class="isDetail ? 'justify-start' : ''">
      <button
        v-for="period in CHART_PERIODS"
        :key="period.value"
        type="button"
        class="shrink-0 rounded-full px-2.5 py-1 font-serif text-[10px] font-bold transition-colors"
        :class="
          selectedPeriod === period.value
            ? 'bg-[#c17f24] text-[#fff8ec] hover:bg-[#a86c1d]'
            : 'bg-[rgba(193,127,36,0.12)] text-[rgba(41,33,26,0.55)] hover:bg-[rgba(193,127,36,0.22)] hover:text-[#2c1810]'
        "
        @click="selectedPeriod = period.value"
      >
        {{ period.label }}
      </button>
    </div>

    <p v-if="loading" class="py-16 text-center font-serif text-xs text-[rgba(41,33,26,0.45)]">
      차트 불러오는 중…
    </p>
    <p v-else-if="errorMessage" class="py-16 text-center font-serif text-xs text-[#c0433f]">
      {{ errorMessage }}
    </p>
    <p v-else-if="!hasData" class="py-16 text-center font-serif text-xs text-[rgba(41,33,26,0.45)]">
      아직 표시할 시세가 없어요.
    </p>
    <div v-else class="overflow-hidden rounded-[3px] border border-[rgba(193,127,36,0.2)] bg-white">
      <VueApexCharts
        :key="`${selectedPeriod}-${variant}`"
        type="candlestick"
        :height="chartHeight"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
  </section>
</template>
