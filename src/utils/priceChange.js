/**
 * 시가 대비 현재가 등락 (주식앱 공통 표기).
 * 한국 시세 관례: 상승=빨강, 하락=파랑.
 * @param {number|null|undefined} currentPrice
 * @param {number|null|undefined} openPrice
 * @returns {{ amount: number, rate: number, direction: 'up'|'down'|'flat' }|null}
 */
export const calcPriceChangeVsOpen = (currentPrice, openPrice) => {
  if (currentPrice == null || openPrice == null || openPrice === 0) return null
  const amount = currentPrice - openPrice
  const rate = (amount / openPrice) * 100
  return {
    amount,
    rate,
    direction: amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat',
  }
}

/** Apex 캔들·직접 hex가 필요할 때 */
export const PRICE_CANDLE_UP = '#e53935'
export const PRICE_CANDLE_DOWN = '#1e88e5'

export const priceChangeToneClass = (direction) => {
  if (direction === 'up') return 'text-[var(--pf-positive)]'
  if (direction === 'down') return 'text-[var(--pf-negative)]'
  return 'text-[rgba(41,33,26,0.45)]'
}

/** 등락 시 border (목록 가격 칩용 — glow는 텍스트 flash로만) */
export const priceChangeSurfaceClass = (direction) => {
  if (direction === 'up') return 'border-[var(--pf-positive)]'
  if (direction === 'down') return 'border-[var(--pf-negative)]'
  return 'border-transparent'
}

/** 가격 틱 직후 짧게 강조하는 pulse 클래스 */
export const priceChangeFlashClass = (direction) => {
  if (direction === 'up') return 'pf-price-flash-up'
  if (direction === 'down') return 'pf-price-flash-down'
  return ''
}

export const formatPriceChangeAmount = (amount) => {
  if (amount == null) return null
  const abs = Math.abs(amount).toLocaleString('ko-KR', { maximumFractionDigits: 0 })
  if (amount > 0) return `▲ ${abs}`
  if (amount < 0) return `▼ ${abs}`
  return `─ 0`
}

export const formatPriceChangeRate = (rate) => {
  if (rate == null) return null
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(2)}%`
}
