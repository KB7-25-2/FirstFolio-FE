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
// 백엔드 DepositSavingCollector에서 실제로 확인된 값은 MATURITY뿐이다(예금은 만기 시 일괄 지급만
// 구현돼 있음). DAILY/QUARTERLY/YEARLY는 다른 상품에서 쓰일 수 있어 추정치로 남겨둔다.
const INTEREST_INTERVAL_LABEL = {
  MATURITY: '만기 시 일괄',
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
// 시간압축 예외는 STOCK·FUND 둘 다다 — 백엔드 AssetType.isTimeCompressed()가 진짜 기준이며
// DEPOSIT_SAVINGS/BOND만 true를 반환한다. API_DOCS.md 텍스트가 "STOCK인 경우만"이라고 된 건
// 문서가 아직 최신화 안 된 상태(펀드를 ETF로 대체하기로 한 뒤 만기가 없어져 압축 대상에서
// 빠졌는데 문서 프로즈는 그 결정 이전 버전으로 보임) — 코드가 진실이라 코드 기준으로 되돌림.

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
  // 예·적금: interest_interval이 문자열 enum("MATURITY" 등). 채권: BondRealTerms 기준
  // interest_interval_months가 숫자(개월)로 온다 — 필드명 자체가 다르다. 복리채는 중간 지급이
  // 없어 이 필드가 아예 null이라(백엔드 주석 확인), 그 경우는 문구를 안 붙인다.
  if (realTerms.interest_interval != null) {
    const label =
      INTEREST_INTERVAL_LABEL[realTerms.interest_interval] ?? realTerms.interest_interval
    parts.push(`실제 ${label} 이자`)
  } else if (realTerms.interest_interval_months != null) {
    parts.push(`실제 ${realTerms.interest_interval_months}개월마다 이자`)
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
  // 시간 압축 타임라인 그래프용 raw 숫자값. cycleSummary는 이미 문구로 뭉쳐놨지만,
  // 그래프는 숫자가 그대로 필요해서 따로 노출한다.
  simulationTerms: raw.simulation_terms
    ? {
        maturityHours: raw.simulation_terms.service_maturity_hours ?? null,
        intervalHours: raw.simulation_terms.service_interest_interval_hours ?? null,
      }
    : null,
  realTerms: raw.real_terms
    ? {
        maturityMonths: raw.real_terms.maturity_months ?? null,
        // 예·적금은 enum(interest_interval), 채권은 개월 수(interest_interval_months) —
        // 필드명 자체가 다르다(formatCycleSummary 주석 참고).
        interestInterval: raw.real_terms.interest_interval ?? null,
        intervalMonths: raw.real_terms.interest_interval_months ?? null,
        // 성장 곡선(시간 압축 그래프)용. 예·적금은 interest_rate, 채권은 coupon_rate로
        // 필드명이 다르지만 둘 다 "연이율(%)"이라 하나로 합쳐 노출한다.
        rate:
          raw.real_terms.interest_rate != null
            ? Number(raw.real_terms.interest_rate)
            : raw.real_terms.coupon_rate != null
              ? Number(raw.real_terms.coupon_rate)
              : null,
        // SIMPLE(단리)/COMPOUND(복리) — 채권엔 이 필드가 없고 interestIntervalMonths 유무로
        // 이표채(주기 지급)/복리채(만기 일시불)를 구분한다.
        rateType: raw.real_terms.interest_rate_type ?? null,
        // 채권 복리 판정은 rateType이 아니라 interest_type 문자열에 "복리"가 들어있는지로 한다
        // (백엔드 AssetEventTerms.of(BondRealTerms...) 기준 — 채권엔 interest_rate_type
        // 필드 자체가 없어서 이걸로만 판별 가능하다. 원본: "이표채"/"복리채"/"할인채" 등).
        interestType: raw.real_terms.interest_type ?? null,
      }
    : null,
  // 목록 API(FUNC-031)엔 가격이 없다. 매수형(주식·펀드)은 store.hydrateProductPrices()가
  // 상세 조회(FUNC-032)로 따로 채워 넣기 전까지 null — ProductListItem은 이 상태를
  // "가격 정보 준비 중"으로 보여준다.
  unitPrice: null,
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
//
// 2026-08-12 수수료·증권거래세 반영(#75·#76): fee_amount/tax_amount/net_cash_amount가 새로 붙었다.
// "얼마 나갔는지/들어왔는지" 화면에 쓸 값은 amount(체결액)가 아니라 netCashAmount다 —
// amount만 보여주면 cashBalance와 비교했을 때 수수료·세금만큼 안 맞는 것처럼 보인다.
// fee_amount/tax_amount는 비용이 없는 거래에서도 null이 아니라 "0.00"으로 온다.
export const mapTradeResult = (raw) => ({
  transactionId: raw.portfolio_transaction_id,
  transactionType: raw.transaction_type,
  productId: raw.product_id,
  requestedAmount: raw.requested_amount != null ? Number(raw.requested_amount) : null,
  amount: Number(raw.amount ?? 0),
  feeAmount: Number(raw.fee_amount ?? 0),
  taxAmount: Number(raw.tax_amount ?? 0),
  netCashAmount: Number(raw.net_cash_amount ?? raw.amount ?? 0),
  quantity: raw.quantity != null ? Number(raw.quantity) : null,
  unitPrice: raw.unit_price != null ? Number(raw.unit_price) : null,
  status: raw.status,
  cashBalance: Number(raw.cash_balance ?? 0),
})

// ============================================================
// FUNC-034 GET /portfolios/current — 포트폴리오 상세
// ============================================================

// 보유 상품 원본엔 asset_type이 이미 들어있다(PortfolioDetailResponse.Holding 기준) — 그걸
// 우선 쓴다. cycle_summary(만기·이자주기 문구)만 이 API엔 없어서 상품 카탈로그(productsById,
// FUNC-031로 미리 받아둔 것)와 조인해서 채운다. 카탈로그는 어디까지나 보조 수단이라 raw에 값이
// 있으면 절대 덮어쓰지 않는다 — 카탈로그 페이지에 없는(판매중지 등) 상품이어도 자산군 판정이
// 깨지지 않게 하기 위함이다. 금액 필드는 전부 문자열("10000000.00")로 오므로 숫자로 변환한다.
const mapHoldingFromApi = (raw, productsById) => {
  const product = productsById[raw.product_id] ?? {}
  const assetType = raw.asset_type ?? product.assetType ?? null
  const principalAmount = Number(raw.principal_amount ?? 0)
  const valuationAmount = Number(raw.valuation_amount ?? raw.principal_amount ?? 0)
  const quantity = Number(raw.quantity ?? 1)
  // 가입형(예·적금·채권)은 "평균낼 것이 없는 상품"이라 ERD상 average_cost가 NULL이다.
  const isSubscription = getAssetTypeMeta(assetType).tradeType === 'SUBSCRIPTION'

  return {
    holdingId: raw.holding_id,
    productId: raw.product_id,
    displayName: raw.display_name ?? product.displayName ?? '',
    assetType,
    cycleSummary: product.cycleSummary ?? null,
    quantity,
    principalAmount,
    valuationAmount,
    averageCost: isSubscription || quantity <= 0 ? null : principalAmount / quantity,
    unitPrice: quantity > 0 ? valuationAmount / quantity : valuationAmount,
    status: 'ACTIVE', // /portfolios/current는 활성 보유만 내려주는 것으로 보임(문서상 status 필드 자체가 없음)
    // 평가액을 무엇으로 구했는지 — PRICE_UNAVAILABLE이면 "시세 정보 없음 · 매입 원금 기준" 배지를 반드시 띄워야 한다.
    // (FE_CHANGE_GUIDE 3-1: 안 띄우면 원금을 현재 시세로 착각하게 만드는, 투자 학습 앱에서 가장 나쁜 오류)
    valuationBasis: raw.valuation_basis ?? null,
    isPriceUnavailable: raw.valuation_basis === 'PRICE_UNAVAILABLE',
    // 상품별 가격 기준 시각. PRICE_UNAVAILABLE/PRINCIPAL이면 null(문서 기준).
    valuedAt: raw.valued_at ?? null,
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
  // 서버가 계산한 값을 그대로 쓴다 — 프론트에서 다시 계산하면 반올림 방식이 달라 화면마다 숫자가 어긋난다.
  const profitRate = raw.summary?.profit_rate ?? null

  // 백엔드가 준 allocation(자산군별 비중)이 있으면 우선 쓰고, 거기에 현금 비중만 우리가 추가한다.
  // 백엔드 allocation엔 현금 항목이 없어서다(financial_products가 아니므로).
  // ratio의 분모는 총자산이라 합이 100%가 안 된다 — 나머지가 현금 비중(문서 기준).
  let allocations
  if (raw.allocation?.length) {
    allocations = raw.allocation.map((item) => {
      const meta = getAssetTypeMeta(item.asset_type)
      return {
        label: meta.label,
        color: meta.color,
        ratio: Math.round(item.ratio),
        valuationAmount: item.valuation_amount != null ? Number(item.valuation_amount) : null,
      }
    })
    if (cashBalance > 0 && totalAssetValue > 0) {
      allocations.push({
        label: CASH_META.label,
        color: CASH_META.color,
        ratio: Math.round((cashBalance / totalAssetValue) * 100),
        valuationAmount: cashBalance,
      })
    }
  } else {
    allocations = computeAllocations(holdings, cashBalance, totalAssetValue)
  }

  return {
    totalAssetValue,
    cashBalance,
    profitLossAmount,
    profitRate, // 서버 계산값 그대로 — 화면에서 재계산하지 않는다.
    goalAchievementRate: null, // ERD/명세에 없는 값
    allocations,
    holdings,
    aiFeedback: null, // ERD/명세에 없는 값
    valuedAt: raw.valued_at ?? null, // 이 응답을 계산한 시각(각 holding의 valuedAt과 의미가 다름)
  }
}

// ============================================================
// FUNC-034 GET /portfolios/current/transactions — 거래·자산 이벤트 이력
// ============================================================

// amount는 이력 종류마다 의미가 다르다(2026-08-12 명세 정정, FE_CHANGE_GUIDE 4번):
//   INTEREST — 이자소득세를 뗀 세후 지급액(= 현금 증감). 세전은 detail.gross_amount.
//   MATURITY — 원금 그대로(비과세, = 현금 증감).
//   BUY/SELL — 체결 금액일 뿐이다. 수수료·거래세가 안 빠져 있어 현금 증감과 다르다 —
//              정확한 현금 증감이 필요하면 detail.net_cash_amount를 봐야 한다.
// 이 목록의 amount를 그대로 합산해서 현금 변화를 재구성하면 안 된다.
//
// detail은 자유 형식 JSON이라(배당소득세·체결 대기 등 키가 계속 늘어날 예정) 그대로 통과시킨다 —
// 여기서 특정 키를 꺼내 스키마를 강제하면 새 키가 추가될 때마다 깨진다.
export const mapTransaction = (raw) => ({
  transactionId: raw.portfolio_transaction_id,
  transactionType: raw.transaction_type,
  displayName: raw.display_name ?? null, // 지급·초기화 이력엔 null
  amount: Number(raw.amount ?? 0),
  quantity: raw.quantity != null ? Number(raw.quantity) : null, // 매수·매도 이력에만 값 있음
  unitPrice: raw.unit_price != null ? Number(raw.unit_price) : null,
  status: raw.status,
  isScheduled: raw.status === 'SCHEDULED', // 아직 반영 안 된 예정 이벤트(이자·배당·만기)
  scheduledAt: raw.scheduled_at ?? null,
  processedAt: raw.processed_at ?? null,
  detail: raw.detail ?? null,
})

export const mapTransactionsResponse = (raw) => ({
  items: (raw.items ?? []).map(mapTransaction),
  nextCursor: raw.next_cursor ?? null,
})
