import { getAssetTypeMeta, CASH_META } from '@/constants/assetType.js'

// 보유 상품 원본(raw)을 화면에서 쓰는 형태로 정규화한다.
// status/averageCost는 portfolio_holdings 컬럼(ACTIVE|MATURED|SOLD, 평균 매입 단가)과 대응된다.
const mapHolding = (raw) => ({
  holdingId: raw.holdingId,
  productId: raw.productId,
  displayName: raw.displayName,
  assetType: raw.assetType,
  cycleSummary: raw.cycleSummary,
  quantity: raw.quantity ?? 1,
  averageCost: raw.averageCost ?? raw.unitPrice ?? raw.principalAmount ?? 0,
  unitPrice: raw.unitPrice ?? raw.averageCost ?? raw.principalAmount ?? 0,
  principalAmount: raw.principalAmount ?? 0,
  status: raw.status ?? 'ACTIVE',
})

// 자산군별/현금 비중을 holdings + cashBalance로부터 직접 계산한다.
// 매도/만기 완료(SOLD, MATURED)된 보유는 더 이상 평가자산이 아니므로 제외한다.
// 백엔드가 allocations를 안 내려줘도 화면은 항상 정확한 비중을 보여줄 수 있다.
const computeAllocations = (holdings, cashBalance, totalAssetValue) => {
  if (!totalAssetValue || totalAssetValue <= 0) return []

  const amountByAssetType = new Map()
  holdings
    .filter((holding) => holding.status === 'ACTIVE')
    .forEach((holding) => {
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

// 포트폴리오 요약 API 응답(raw)을 화면용 모델로 변환한다.
// - totalAssetValue: 백엔드 값이 없으면 현금+보유원금 합으로 근사 계산
// - allocations: 백엔드가 안 내려주면 holdings 기준으로 직접 계산
// - goalAchievementRate, aiFeedback: ERD/명세에 없는 값이라 없으면 null 처리(화면에서 조건부 렌더링)
export const mapPortfolioSummaryResponse = (raw) => {
  const holdings = (raw.holdings ?? []).map(mapHolding)
  const cashBalance = raw.cashBalance ?? 0
  const totalAssetValue =
    raw.totalAssetValue ??
    cashBalance +
      holdings
        .filter((holding) => holding.status === 'ACTIVE')
        .reduce((sum, holding) => sum + holding.principalAmount, 0)

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

// 판매/구매로 holdings·cashBalance가 바뀐 뒤, 파생값(totalAssetValue/allocations)을 다시 계산할 때 쓴다.
// summary에 이미 들어있는 allocations는 매도 전 값이라 그대로 두면 안 되므로 제거하고 넘긴다 —
// 그래야 mapPortfolioSummaryResponse가 `raw.allocations ?? computeAllocations(...)`에서
// 캐시된 옛 값 대신 최신 holdings 기준으로 다시 계산한다.
export const recomputePortfolioSummary = (summary) => {
  const rest = { ...summary }
  delete rest.allocations
  return mapPortfolioSummaryResponse(rest)
}
