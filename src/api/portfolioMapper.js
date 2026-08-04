import { getAssetTypeMeta, CASH_META } from '@/constants/assetType.js'

const mapHolding = (raw) => ({
  holdingId: raw.holdingId,
  productId: raw.productId,
  displayName: raw.displayName,
  assetType: raw.assetType,
  cycleSummary: raw.cycleSummary,
  quantity: raw.quantity ?? 1,
  unitPrice: raw.unitPrice ?? raw.principalAmount ?? 0,
  principalAmount: raw.principalAmount ?? 0,
  highlighted: Boolean(raw.highlighted),
})

const computeAllocations = (holdings, cashBalance, totalAssetValue) => {
  if (!totalAssetValue || totalAssetValue <= 0) return []

  const amountByAssetType = new Map()
  holdings.forEach((holding) => {
    const prev = amountByAssetType.get(holding.assetType) ?? 0
    amountByAssetType.set(holding.assetType, prev + holding.principalAmount)
  })

  const segments = Array.from(amountByAssetType.entries()).map(([assetType, amount]) => {
    const meta = getAssetTypeMeta(assetType)
    return {
      label: meta.label,
      color: meta.color,
      ratio: Math.round((amount / totalAssetValue) * 100),
    }
  })

  if (cashBalance > 0) {
    segments.push({
      label: CASH_META.label,
      color: CASH_META.color,
      ratio: Math.round((cashBalance / totalAssetValue) * 100),
    })
  }

  return segments
}

export const mapPortfolioSummaryResponse = (raw) => {
  const holdings = (raw.holdings ?? []).map(mapHolding)
  const cashBalance = raw.cashBalance ?? 0
  const totalAssetValue =
    raw.totalAssetValue ?? cashBalance + holdings.reduce((sum, h) => sum + h.principalAmount, 0)

  return {
    totalAssetValue,
    cashBalance,
    profitLossAmount: raw.profitLossAmount ?? 0,
    goalAchievementRate: raw.goalAchievementRate ?? null,
    allocations: raw.allocations ?? computeAllocations(holdings, cashBalance, totalAssetValue),
    holdings,
    aiFeedback: raw.aiFeedback ?? null,
  }
}

export const recomputePortfolioSummary = (summary) => mapPortfolioSummaryResponse(summary)
