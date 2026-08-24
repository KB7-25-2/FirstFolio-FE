import { getAssetTypeMeta } from '@/constants/assetType.js'

/**
 * 매도 수량에 해당하는 매입 원금.
 * 가입형(예·적금·채권)은 전액 해지라 보유 원금 전체.
 * 매수형(주식·펀드)은 평단가 × 수량(없으면 원금 비례).
 */
export const getSellCostBasis = (holding, quantity) => {
  if (!holding) return null
  const meta = getAssetTypeMeta(holding.assetType)
  if (meta.tradeType === 'SUBSCRIPTION') {
    const principal = Number(holding.principalAmount ?? 0)
    return principal > 0 ? principal : null
  }

  const qty = Number(quantity ?? 0)
  if (qty <= 0) return null
  if (holding.averageCost != null) return Number(holding.averageCost) * qty

  const principal = Number(holding.principalAmount ?? 0)
  const heldQty = Number(holding.quantity ?? 0)
  if (heldQty > 0 && principal > 0) return (principal / heldQty) * qty
  return null
}

export const getEstimatedSellProceeds = (holding, quantity) => {
  if (!holding) return 0
  const meta = getAssetTypeMeta(holding.assetType)
  if (meta.tradeType === 'SUBSCRIPTION') {
    return Number(holding.valuationAmount ?? holding.principalAmount ?? 0)
  }
  return Number(holding.unitPrice ?? 0) * Number(quantity ?? 0)
}

export const calcSellProfit = ({ proceeds, costBasis }) => {
  if (proceeds == null || costBasis == null) return null
  const amount = proceeds - costBasis
  const rate = costBasis > 0 ? (amount / costBasis) * 100 : null
  return { amount, rate }
}

export const attachSellTradeMeta = (tradeResult, holding, quantity) => ({
  ...tradeResult,
  productName: holding.displayName,
  assetType: holding.assetType,
  costBasis: getSellCostBasis(holding, quantity),
})

export const formatSignedKrw = (amount) => {
  const rounded = Math.round(amount ?? 0)
  const abs = Math.abs(rounded).toLocaleString('ko-KR')
  if (rounded > 0) return `+${abs}원`
  if (rounded < 0) return `-${abs}원`
  return '0원'
}

export const formatSignedRate = (rate) => {
  if (rate == null) return null
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

export const sellProfitToneClass = (amount) => {
  if (amount > 0) return 'text-[var(--pf-positive)]'
  if (amount < 0) return 'text-[var(--pf-negative)]'
  return 'text-[rgba(245,237,217,0.75)]'
}
