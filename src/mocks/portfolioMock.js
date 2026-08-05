// 아래 필드는 실제 ERD 컬럼과 대응된다.
// - holdings[].status        → portfolio_holdings.status (ACTIVE | MATURED | SOLD)
// - holdings[].averageCost   → portfolio_holdings.average_cost (평균 매입 단가, NULL 허용)
//   ERD상 "평균낼 것이 없는 상품"은 NULL이 맞다 — 가입형(예·적금·채권)은 quantity=1이라
//   averageCost도 null로 둔다. 매수형(주식·펀드)만 실제 평균단가를 가진다.
// - holdings[].quantity      → portfolio_holdings.quantity
//   가입형(예·적금·채권)은 좌수 개념이 없어 1 고정, 매수형(주식·펀드)만 실제 수량.
// - holdings[].principalAmount → portfolio_holdings.principal_amount
// - products[].isActive      → financial_products.is_active
// - products[].assetType     → financial_products.asset_type (DEPOSIT_SAVINGS | BOND | STOCK | FUND)
// - products[].riskLevel     → financial_products.risk_level
//
// ERD에는 있지만 목데이터에 안 넣는 것: source_provider, source_product_code,
// source_product_name, source_reference_at → 사용자 API 응답에서 제외되는 내부 전용 필드.
//
// ERD에 없는 것: cycleSummary(백엔드가 real_terms_json/simulation_terms_json을 조합해
// 완성 문자열로 내려주기로 합의된 필드), unitPrice(실제로는 상품 JSON/product_prices에
// 들어있는 값을 단순화한 것), aiFeedback·goalAchievementRate(스펙/ERD 어디에도 없는
// UI 전용 값, 백엔드 미지원 시 null로 처리됨 — portfolioMapper.js 참고).
//
// 가입형/매수형 구분(tradeType)은 constants/assetType.js에서 관리한다.
// 채권은 API 변경 제안(2026-08-05)에 따라 가입형으로 재분류됨 — 개수(좌) 기반이 아니다.

export const mockPortfolioSummary = {
  totalAssetValue: 30000000,
  cashBalance: 6000000,
  profitLossAmount: 0,
  goalAchievementRate: 80,
  holdings: [
    {
      holdingId: 1,
      productId: 101,
      displayName: '프리미엄 정기예금 36개월형',
      assetType: 'DEPOSIT_SAVINGS',
      cycleSummary: '예금 · 서비스 6일 만기 · 실제 6개월',
      quantity: 1,
      averageCost: null,
      unitPrice: 15000000,
      principalAmount: 15000000,
      status: 'ACTIVE',
    },
    {
      holdingId: 2,
      productId: 102,
      displayName: '블루칩 배당 포트폴리오',
      assetType: 'STOCK',
      cycleSummary: '주식 · 6시간마다 배당 · 실제 분기 1회',
      quantity: 10,
      averageCost: 500000,
      unitPrice: 500000,
      principalAmount: 5000000,
      status: 'ACTIVE',
    },
    {
      holdingId: 3,
      productId: 103,
      displayName: '안정형 국채혼합펀드',
      assetType: 'BOND',
      cycleSummary: '채권 · 6시간마다 이자 · 실제 월 1회',
      quantity: 1,
      averageCost: null,
      unitPrice: 4000000,
      principalAmount: 4000000,
      status: 'ACTIVE',
    },
  ],
  aiFeedback:
    '예금 비중 50%로 높아요. 서비스 내 6일 만기(실제 6개월)인 예금을 일부 조정하고, 6시간마다 배당·이자가 반영되는 상품으로 분산을 넣어보세요. — 시간 압축 시뮬레이션에서 더 정확한 경로를 확인할 수 있어요.',
}

// 구매 탭에서 보여줄 모의 상품 카탈로그 (financial_products 발췌).
// quantityFixed 필드는 제거했다 — 가입형/매수형 구분은 constants/assetType.js의
// tradeType(assetType 기반)이 담당하므로, 상품마다 따로 들고 다닐 필요가 없다.
export const mockPurchasableProducts = [
  {
    productId: 101,
    displayName: '프리미엄 정기예금 36개월형',
    assetType: 'DEPOSIT_SAVINGS',
    riskLevel: '저위험',
    cycleSummary: '서비스 6일 만기 · 실제 6개월',
    unitPrice: 15000000,
    isActive: true,
  },
  {
    productId: 104,
    displayName: '글로벌 성장주 액티브펀드',
    assetType: 'STOCK',
    riskLevel: '위험 중상',
    cycleSummary: '1~2시간마다 가격 · 실제 장중 실시간',
    unitPrice: 500000,
    isActive: true,
  },
  {
    productId: 102,
    displayName: '블루칩 배당 포트폴리오',
    assetType: 'STOCK',
    riskLevel: '위험 중',
    cycleSummary: '6시간마다 배당 · 실제 분기 1회',
    unitPrice: 500000,
    isActive: true,
  },
  {
    productId: 105,
    displayName: '코스피 200 인덱스 ETF',
    assetType: 'FUND',
    riskLevel: '위험 중하',
    cycleSummary: '1~2시간마다 가격 · 실제 장중 실시간',
    unitPrice: 250000,
    isActive: true,
  },
  {
    productId: 103,
    displayName: '안정형 국채혼합펀드',
    assetType: 'BOND',
    riskLevel: '저위험',
    cycleSummary: '6시간마다 이자 · 실제 월 1회',
    unitPrice: 1000000,
    isActive: true,
  },
]
