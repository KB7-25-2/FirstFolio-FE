// 아래 필드는 실제 ERD 컬럼과 대응된다.
// - holdings[].status        → portfolio_holdings.status (ACTIVE | MATURED | SOLD)
// - holdings[].averageCost   → portfolio_holdings.average_cost (평균 매입 단가)
// - holdings[].quantity      → portfolio_holdings.quantity (예·적금은 좌수 개념이 없어 1 고정)
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
      averageCost: 15000000,
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
      quantity: 4,
      averageCost: 1000000,
      unitPrice: 1000000,
      principalAmount: 4000000,
      status: 'ACTIVE',
    },
  ],
  aiFeedback:
    '예금 비중 50%로 높아요. 서비스 내 6일 만기(실제 6개월)인 예금을 일부 조정하고, 6시간마다 배당·이자가 반영되는 상품으로 분산을 넣어보세요. — 시간 압축 시뮬레이션에서 더 정확한 경로를 확인할 수 있어요.',
}

// 구매 탭에서 보여줄 모의 상품 카탈로그 (financial_products 발췌).
// quantityFixed=true인 상품(예·적금)은 좌수 개념이 없어 항상 1개만 구매 가능하다 — ERD 컬럼은 아니고 FE에서만 쓰는 구매 UI 제약이다.
export const mockPurchasableProducts = [
  {
    productId: 101,
    displayName: '프리미엄 정기예금 36개월형',
    assetType: 'DEPOSIT_SAVINGS',
    riskLevel: '저위험',
    cycleSummary: '서비스 6일 만기 · 실제 6개월',
    unitPrice: 15000000,
    quantityFixed: true,
    isActive: true,
  },
  {
    productId: 104,
    displayName: '글로벌 성장주 액티브펀드',
    assetType: 'STOCK',
    riskLevel: '위험 중상',
    cycleSummary: '1~2시간마다 가격 · 실제 장중 실시간',
    unitPrice: 500000,
    quantityFixed: false,
    isActive: true,
  },
  {
    productId: 102,
    displayName: '블루칩 배당 포트폴리오',
    assetType: 'STOCK',
    riskLevel: '위험 중',
    cycleSummary: '6시간마다 배당 · 실제 분기 1회',
    unitPrice: 500000,
    quantityFixed: false,
    isActive: true,
  },
  {
    productId: 105,
    displayName: '코스피 200 인덱스 ETF',
    assetType: 'FUND',
    riskLevel: '위험 중하',
    cycleSummary: '1~2시간마다 가격 · 실제 장중 실시간',
    unitPrice: 250000,
    quantityFixed: false,
    isActive: true,
  },
  {
    productId: 103,
    displayName: '안정형 국채혼합펀드',
    assetType: 'BOND',
    riskLevel: '저위험',
    cycleSummary: '6시간마다 이자 · 실제 월 1회',
    unitPrice: 1000000,
    quantityFixed: false,
    isActive: true,
  },
]

export const mockTimeCompressionRules = [
  {
    productId: 101,
    productName: '프리미엄 정기예금 36개월형',
    assetType: 'DEPOSIT_SAVINGS',
    compressedCycle: '서비스 내 6일 만기',
    realCycle: '실제 6개월 만기',
    headline: '서비스 6일 ≈ 실제 6개월',
    description:
      '만기까지의 기다림을 빠르게 경험하도록 압축했어요. 이자는 만기 시점에 한 번에 반영돼요.',
    expectedReturn: '+2.1%',
    volatility: '±0.3%',
    points: [
      { label: 'D0', value: 20 },
      { label: 'D1', value: 22 },
      { label: 'D2', value: 24 },
      { label: 'D3', value: 27 },
      { label: 'D4', value: 29 },
      { label: 'D5', value: 32 },
      { label: 'D6', value: 35 },
    ],
  },
  {
    productId: 103,
    productName: '안정형 국채혼합펀드',
    assetType: 'BOND',
    compressedCycle: '6시간마다 이자',
    realCycle: '실제 월 1회',
    headline: '6시간 ≈ 실제 1개월',
    description: '채권 이자 지급 주기를 압축했어요. 6시간마다 이자가 반영돼요.',
    expectedReturn: '+3.5%',
    volatility: '±1.2%',
    points: [
      { label: 'D0', value: 20 },
      { label: 'D1', value: 25 },
      { label: 'D2', value: 23 },
      { label: 'D3', value: 28 },
      { label: 'D4', value: 26 },
      { label: 'D5', value: 31 },
      { label: 'D6', value: 34 },
    ],
  },
  {
    productId: 102,
    productName: '블루칩 배당 포트폴리오',
    assetType: 'STOCK',
    compressedCycle: '6시간마다 배당',
    realCycle: '실제 분기 1회',
    headline: '6시간 ≈ 실제 분기(3개월)',
    description: '배당 지급 주기를 압축했어요. 6시간마다 배당이 반영돼요.',
    expectedReturn: '+4.8%',
    volatility: '±2.4%',
    points: [
      { label: 'D0', value: 20 },
      { label: 'D1', value: 32 },
      { label: 'D2', value: 28 },
      { label: 'D3', value: 45 },
      { label: 'D4', value: 40 },
      { label: 'D5', value: 58 },
      { label: 'D6', value: 66 },
    ],
  },
  {
    productId: 104,
    productName: '글로벌 성장주 액티브펀드',
    assetType: 'STOCK',
    compressedCycle: '1~2시간마다 가격',
    realCycle: '실제 장중 실시간',
    headline: '1~2시간 ≈ 실제 장중 실시간',
    description:
      '성장주 가격 변동을 빠르게 경험하도록 압축했어요. 1~2시간마다 가격이 갱신돼요. 변동성이 큰 만큼 등락 폭도 커요.',
    expectedReturn: '+6.2%',
    volatility: '±3.8%',
    points: [
      { label: 'D0', value: 20 },
      { label: 'D1', value: 38 },
      { label: 'D2', value: 30 },
      { label: 'D3', value: 55 },
      { label: 'D4', value: 42 },
      { label: 'D5', value: 70 },
      { label: 'D6', value: 60 },
    ],
  },
  {
    productId: 105,
    productName: '코스피 200 인덱스 ETF',
    assetType: 'FUND',
    compressedCycle: '1~2시간마다 가격',
    realCycle: '실제 장중 실시간',
    headline: '1~2시간 ≈ 실제 장중 실시간',
    description:
      '지수 추종 ETF 가격 변동을 빠르게 경험하도록 압축했어요. 개별 종목보다 변동 폭이 완만한 편이에요.',
    expectedReturn: '+4.0%',
    volatility: '±2.0%',
    points: [
      { label: 'D0', value: 20 },
      { label: 'D1', value: 30 },
      { label: 'D2', value: 33 },
      { label: 'D3', value: 42 },
      { label: 'D4', value: 38 },
      { label: 'D5', value: 52 },
      { label: 'D6', value: 58 },
    ],
  },
]
