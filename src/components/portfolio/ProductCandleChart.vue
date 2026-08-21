<script setup>
import { computed, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import {
  CHART_PERIODS,
  DEFAULT_CHART_PERIOD,
  buildChartCandlesForPeriod,
  formatChartCategoryLabel,
} from '@/utils/productChartCandles.js'

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
})

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

const chartOptions = computed(() => {
  const period = selectedPeriod.value
  return {
    chart: {
      type: 'candlestick',
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      animations: { enabled: false },
      parentHeightOffset: 0,
    },
    grid: {
      borderColor: 'rgba(193,127,36,0.2)',
      strokeDashArray: 3,
      padding: { left: 4, right: 4, top: 0, bottom: 0 },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#2f6b4f',
          downward: '#c0433f',
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
        minWidth: 40,
        maxWidth: 56,
        formatter: (value) =>
          Number(value).toLocaleString('ko-KR', {
            maximumFractionDigits: 0,
            notation: 'compact',
          }),
      },
    },
    tooltip: {
      theme: 'light',
      x: {
        formatter: (_value, { dataPointIndex, w }) => {
          const label = w?.globals?.categoryLabels?.[dataPointIndex]
          return label ? formatChartCategoryLabel(label, period) : ''
        },
      },
    },
  }
})
</script>

<template>
  <section
    class="rounded-[3px] border-[0.5px] border-[rgba(193,127,36,0.3)] bg-[#fff8ec] px-2.5 py-2 shadow-[0_4px_12px_rgba(44,24,16,0.1)]"
  >
    <div class="mb-1 flex items-end justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate font-serif text-xs font-bold text-[#2c1810]">
          {{ productName || '상품 시세' }}
        </p>
        <p class="font-serif text-[9px] text-[rgba(41,33,26,0.5)]">
          {{ marketOpen ? '장중 · 실시간 갱신' : '장외 · 확정 시세' }}
        </p>
      </div>
      <p v-if="priceLabel" class="shrink-0 font-serif text-xs font-bold text-[#c17f24]">
        {{ priceLabel }}
      </p>
    </div>

    <div class="mb-1.5 flex gap-1 overflow-x-auto">
      <button
        v-for="period in CHART_PERIODS"
        :key="period.value"
        type="button"
        class="shrink-0 rounded-full px-2 py-0.5 font-serif text-[10px] font-bold transition-colors"
        :class="
          selectedPeriod === period.value
            ? 'bg-[#c17f24] text-[#fff8ec]'
            : 'bg-[rgba(193,127,36,0.12)] text-[rgba(41,33,26,0.55)]'
        "
        @click="selectedPeriod = period.value"
      >
        {{ period.label }}
      </button>
    </div>

    <p v-if="loading" class="py-6 text-center font-serif text-xs text-[rgba(41,33,26,0.45)]">
      차트 불러오는 중…
    </p>
    <p v-else-if="errorMessage" class="py-6 text-center font-serif text-xs text-[#c0433f]">
      {{ errorMessage }}
    </p>
    <p v-else-if="!hasData" class="py-6 text-center font-serif text-xs text-[rgba(41,33,26,0.45)]">
      아직 표시할 시세가 없어요.
    </p>
    <VueApexCharts
      v-else
      :key="selectedPeriod"
      type="candlestick"
      height="150"
      :options="chartOptions"
      :series="chartSeries"
    />
  </section>
</template>
