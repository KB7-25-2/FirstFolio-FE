/** 상품 시세 차트 기간. API는 일봉만 주므로 월봉은 프론트 집계. */
export const CHART_PERIODS = [
  { value: 'monthly', label: '월봉' },
  { value: '3m', label: '3개월' },
  { value: '1m', label: '1개월' },
  { value: '1w', label: '1주' },
]

export const DEFAULT_CHART_PERIOD = 'monthly'

const PERIOD_LOOKBACK_DAYS = {
  '3m': 90,
  '1m': 30,
  '1w': 7,
}

const isCompleteOhlc = (candle) =>
  candle?.tradeDate &&
  candle.openPrice != null &&
  candle.highPrice != null &&
  candle.lowPrice != null &&
  candle.closePrice != null

/** 확정 일봉에 당일 live 봉을 덮어쓰거나 보강한다. */
export const mergeDailyCandlesWithLive = (candles, liveCandle) => {
  const byDate = new Map()
  for (const candle of candles) {
    if (isCompleteOhlc(candle)) byDate.set(candle.tradeDate, { ...candle })
  }

  if (liveCandle && isCompleteOhlc(liveCandle)) {
    if (liveCandle.status === 'PROVISIONAL') {
      byDate.set(liveCandle.tradeDate, { ...liveCandle })
    } else if (liveCandle.status === 'CONFIRMED' && !byDate.has(liveCandle.tradeDate)) {
      byDate.set(liveCandle.tradeDate, { ...liveCandle })
    }
  }

  return [...byDate.values()].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate))
}

const shiftCalendarDays = (isoDate, deltaDays) => {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + deltaDays)
  return date.toISOString().slice(0, 10)
}

const filterByLookbackDays = (candles, days) => {
  if (!candles.length) return []
  const latest = candles[candles.length - 1].tradeDate
  const cutoff = shiftCalendarDays(latest, -(days - 1))
  return candles.filter((candle) => candle.tradeDate >= cutoff)
}

/** 일봉 → 월봉(시=월 첫 거래일 시가, 종=월 마지막 거래일 종가). */
export const aggregateMonthlyCandles = (dailyCandles) => {
  const byMonth = new Map()

  for (const candle of dailyCandles) {
    const monthKey = candle.tradeDate.slice(0, 7)
    const existing = byMonth.get(monthKey)
    if (!existing) {
      byMonth.set(monthKey, {
        tradeDate: monthKey,
        openPrice: candle.openPrice,
        highPrice: candle.highPrice,
        lowPrice: candle.lowPrice,
        closePrice: candle.closePrice,
      })
      continue
    }
    existing.highPrice = Math.max(existing.highPrice, candle.highPrice)
    existing.lowPrice = Math.min(existing.lowPrice, candle.lowPrice)
    existing.closePrice = candle.closePrice
  }

  return [...byMonth.values()]
}

/**
 * @param {Array} candles 확정 일봉
 * @param {object|null} liveCandle market-snapshot current_candle
 * @param {'monthly'|'3m'|'1m'|'1w'} period
 */
export const buildChartCandlesForPeriod = (candles, liveCandle, period) => {
  const daily = mergeDailyCandlesWithLive(candles, liveCandle)

  if (period === 'monthly') {
    return aggregateMonthlyCandles(daily)
  }

  const lookback = PERIOD_LOOKBACK_DAYS[period]
  if (lookback == null) return daily
  return filterByLookbackDays(daily, lookback)
}

/** 축·툴팁용. 월봉은 `26/8`, 일봉은 `8/20`. */
export const formatChartCategoryLabel = (value, period) => {
  const text = String(value ?? '')
  if (period === 'monthly') {
    const monthMatch = text.match(/^(\d{4})-(\d{2})$/)
    if (monthMatch) return `${monthMatch[1].slice(2)}/${Number(monthMatch[2])}`
  }
  const dayMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dayMatch) return `${Number(dayMatch[2])}/${Number(dayMatch[3])}`
  return text
}
