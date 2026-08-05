import { getAssetTypeMeta, CASH_META } from '@/constants/assetType.js'

// ============================================================
// FUNC-031 GET /financial-products — 상품 카탈로그
// ============================================================

// risk_level enum → 한글 라벨. 문서 예시엔 LOW만 나와있어 MEDIUM/HIGH는 추정치.
// TODO: 실제 enum 값(MID인지 MEDIUM인지 등) 확인되면 맞춰야 함.
const RISK_LEVEL_LABEL = {
  LOW: '저위험',
  MEDIUM: '중위험',
  HIGH: '고위험',
}

// real_terms.interest_interval enum → 한글 표현. 문서 예시엔 MONTHLY만 나와있어 나머지는 추정치.
const INTEREST_INTERVAL_LABEL = {
  DAILY: '매일',
  MONTHLY: '월 1회',
  QUARTERLY: '분기 1회',
  YEARLY: '연 1회',
}

const formatHours = (hours) => {
  if (hours == null) return null
  if (hours % 24 === 0) return `${hours / 24}일`
  return `${hours}시간`
}

// simulation_terms/real_terms를 "서비스 6일 만기 · 실제 6개월 만기" 같은 한 줄 문구로 조합한다.
// STOCK/FUND는 시간압축 예외라 둘 다 null로 온다 → cycleSummary도 null.
export const formatCycleSummary = (simulationTerms, realTerms) => {
  if (!simulationTerms || !realTerms) return null

  const parts = []
  if (simulationTerms.service_maturity_hours != null) {
    parts.push(`서비스 ${formatHours(simulationTerms.service_maturity_hours)} 만기`)
  }
  if (simulationTerms.service_interest_interval_hours != null) {
    parts.push(`${formatHours(simulationTerms.service_interest_interval_hours)}마다 이자`)
  }
  if (realTerms.maturity_months != null) {
    parts.push(`실제 ${realTerms.maturity_months}개월 만기`)
  }
  if (realTerms.interest_interval != null) {
    const label =
      INTEREST_INTERVAL_LABEL[realTerms.interest_interval] ?? realTerms.interest_interval
    parts.push(`실제 ${label} 이자`)
  }

  return parts.length ? parts.join(' · ') : null
}

// GET /financial-products의 item 하나 → 화면용 모델. unit_price(가격)는 이 API에 없음(FUNC-032 확인 후 반영).
export const mapFinancialProduct = (raw) => ({
  productId: raw.product_id,
  displayName: raw.display_name,
  assetType: raw.asset_type,
  riskLevel: RISK_LEVEL_LABEL[raw.risk_level] ?? raw.risk_level,
  cycleSummary: formatCycleSummary(raw.simulation_terms, raw.real_terms),
  isTimeCompressionExempt: !raw.simulation_terms && !raw.real_terms,
})

export const mapFinancialProductsResponse = (raw) => ({
  items: (raw.items ?? []).map(mapFinancialProduct),
  nextCursor: raw.next_cursor ?? null,
})

// FUNC-032 GET /financial-products/{id} 응답 → 화면용 모델.
// 목록 API(FUNC-031)엔 없는 현재가(current_price)와 출처 정보가 여기 있다.
export const mapFinancialProductDetail = (raw) => ({
  productId: raw.product_id,
  displayName: raw.display_name,
  assetType: raw.asset_type,
  description: raw.description ?? null,
  riskLevel: RISK_LEVEL_LABEL[raw.risk_level] ?? raw.risk_level,
  cycleSummary: formatCycleSummary(raw.simulation_terms, raw.real_terms),
  isTimeCompressionExempt: !raw.simulation_terms && !raw.real_terms,
  unitPrice: raw.current_price != null ? Number(raw.current_price) : null,
  priceReferenceAt: raw.price_reference_at ?? null,
  source: raw.source
    ? { provider: raw.source.provider ?? null, referenceAt: raw.source.reference_at ?? null }
    : null,
})

// ============================================================
// FUNC-035(개정) POST /portfolios/current/trades — 거래 응답
// ============================================================

// 거래 응답 원본 → 화면용 모델. 매수형(주식·펀드)은 요청 금액과 실제 체결 금액이 다를 수 있어
// (수량 내림 처리로 단수 절사) requestedAmount/amount를 둘 다 남겨서 "얼마만큼 체결됐는지" 보여줄 수 있게 한다.
export const mapTradeResult = (raw) => ({
  transactionId: raw.portfolio_transaction_id,
  transactionType: raw.transaction_type,
  productId: raw.product_id,
  requestedAmount: raw.requested_amount != null ? Number(raw.requested_amount) : null,
  amount: Number(raw.amount ?? 0),
  quantity: raw.quantity != null ? Number(raw.quantity) : null,
  unitPrice: raw.unit_price != null ? Number(raw.unit_price) : null,
  status: raw.status,
  cashBalance: Number(raw.cash_balance ?? 0),
})

// ============================================================
// FUNC-034 GET /portfolios/current — 포트폴리오 상세
// ============================================================

// 보유 상품 원본엔 asset_type/cycle_summary가 없어서(product_id만 있음),
// 상품 카탈로그(productsById, FUNC-031로 미리 받아둔 것)와 조인해서 채운다.
// 금액 필드는 전부 문자열("10000000.00")로 오므로 숫자로 변환한다.
const mapHoldingFromApi = (raw, productsById) => {
  const product = productsById[raw.product_id] ?? {}
  const principalAmount = Number(raw.principal_amount ?? 0)
  const valuationAmount = Number(raw.valuation_amount ?? raw.principal_amount ?? 0)
  const quantity = Number(raw.quantity ?? 1)
  // 가입형(예·적금·채권)은 "평균낼 것이 없는 상품"이라 ERD상 average_cost가 NULL이다.
  const isSubscription = getAssetTypeMeta(product.assetType).tradeType === 'SUBSCRIPTION'

  return {
    holdingId: raw.holding_id,
    productId: raw.product_id,
    displayName: raw.display_name ?? product.displayName ?? '',
    assetType: product.assetType ?? null,
    cycleSummary: product.cycleSummary ?? null,
    quantity,
    principalAmount,
    valuationAmount,
    averageCost: isSubscription || quantity <= 0 ? null : principalAmount / quantity,
    unitPrice: quantity > 0 ? valuationAmount / quantity : valuationAmount,
    status: 'ACTIVE', // /portfolios/current는 활성 보유만 내려주는 것으로 보임(문서상 status 필드 자체가 없음)
  }
}

// 자산군별/현금 비중을 holdings + cashBalance로부터 직접 계산한다(백엔드 allocation이 없을 때의 폴백).
// 평가액(valuationAmount) 기준으로 계산 — 원금이 아니라 "지금 얼마짜리인지"가 비중에 맞다.
const computeAllocations = (holdings, cashBalance, totalAssetValue) => {
  if (!totalAssetValue || totalAssetValue <= 0) return []

  const amountByAssetType = new Map()
  holdings
    .filter((holding) => holding.status === 'ACTIVE')
    .forEach((holding) => {
      const amount = holding.valuationAmount ?? holding.principalAmount
      const prev = amountByAssetType.get(holding.assetType) ?? 0
      amountByAssetType.set(holding.assetType, prev + amount)
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

// GET /portfolios/current 원본(raw) → 화면용 모델. productsById는 FUNC-031 카탈로그를 미리 조회해 넘겨야 한다.
export const mapPortfolioDetailResponse = (raw, productsById = {}) => {
  const cashBalance = Number(raw.cash_balance ?? 0)
  const holdings = (raw.holdings ?? []).map((holding) => mapHoldingFromApi(holding, productsById))

  const totalAssetValue =
    raw.summary?.total_assets != null
      ? Number(raw.summary.total_assets)
      : cashBalance + holdings.reduce((sum, h) => sum + (h.valuationAmount ?? h.principalAmount), 0)

  const profitLossAmount = raw.summary?.profit_loss != null ? Number(raw.summary.profit_loss) : 0

  // 백엔드가 준 allocation(자산군별 비중)이 있으면 우선 쓰고, 거기에 현금 비중만 우리가 추가한다.
  // 백엔드 allocation엔 현금 항목이 없어서다(financial_products가 아니므로).
  let allocations
  if (raw.allocation?.length) {
    allocations = raw.allocation.map((item) => {
      const meta = getAssetTypeMeta(item.asset_type)
      return { label: meta.label, color: meta.color, ratio: Math.round(item.ratio) }
    })
    if (cashBalance > 0 && totalAssetValue > 0) {
      allocations.push({
        label: CASH_META.label,
        color: CASH_META.color,
        ratio: Math.round((cashBalance / totalAssetValue) * 100),
      })
    }
  } else {
    allocations = computeAllocations(holdings, cashBalance, totalAssetValue)
  }

  return {
    totalAssetValue,
    cashBalance,
    profitLossAmount,
    goalAchievementRate: null, // ERD/명세에 없는 값
    allocations,
    holdings,
    aiFeedback: null, // ERD/명세에 없는 값
    valuedAt: raw.valued_at ?? null,
  }
}

// ============================================================
// 로컬 전용 — 목데이터 초기화, 판매/구매 후 재계산
// (이미 우리 내부 모델 모양인 데이터를 다룬다. 실제 API 원본 파싱과는 무관.)
// ============================================================

// 목데이터/판매·구매로 바뀐 내부 상태에 빠진 필드가 있으면 기본값을 채운다.
const normalizeLocalHolding = (holding) => ({
  ...holding,
  valuationAmount: holding.valuationAmount ?? holding.principalAmount ?? 0,
  status: holding.status ?? 'ACTIVE',
})

// 내부 모델(summary)을 받아서 totalAssetValue/allocations 같은 파생값을 다시 계산한다.
// 목데이터 최초 로드, 판매/구매 후 재계산 둘 다 여기를 거친다.
export const normalizeLocalSummary = (summary) => {
  const holdings = (summary.holdings ?? []).map(normalizeLocalHolding)
  const cashBalance = summary.cashBalance ?? 0
  const totalAssetValue =
    summary.totalAssetValue ??
    cashBalance +
      holdings
        .filter((holding) => holding.status === 'ACTIVE')
        .reduce((sum, holding) => sum + (holding.valuationAmount ?? holding.principalAmount), 0)

  return {
    totalAssetValue,
    cashBalance,
    profitLossAmount: summary.profitLossAmount ?? 0,
    goalAchievementRate: summary.goalAchievementRate ?? null,
    allocations: computeAllocations(holdings, cashBalance, totalAssetValue),
    holdings,
    aiFeedback: summary.aiFeedback ?? null,
    valuedAt: summary.valuedAt ?? null,
  }
}
