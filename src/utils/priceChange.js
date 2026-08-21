/**
 * 시가 대비 현재가 등락 (주식앱 공통 표기).
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

export const priceChangeToneClass = (direction) => {
  if (direction === 'up') return 'text-[var(--pf-positive)]'
  if (direction === 'down') return 'text-[var(--pf-negative)]'
  return 'text-[rgba(41,33,26,0.45)]'
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
