// ERD의 financial_products.asset_type과 1:1로 대응.
// 라벨/색상/매매 액션 명칭/수량 단위는 백엔드가 내려줄 필요 없는 순수 프레젠테이션 값이라 여기서만 관리한다.
//
// POST /portfolios/current/trades 문서(2026-08-06 확정) 기준:
//   매수(BUY)는 전 자산군 공통으로 amount(금액)만 보낸다.
//   매도(SELL)는 자산군별로 완전히 다르다 — 이게 tradeType이 가리키는 것.
//     'MARKET'(주식·펀드)   — quantity(수량)를 보낸다. 부분 매도 가능.
//     'SUBSCRIPTION'(예·적금·채권) — 아무 파라미터도 안 보낸다(product_id만). 항상 전액 자동 해지/매도.
//       채권도 매도는 예·적금과 동일하게 전액만 가능하지만, 보유 개수(좌) 자체는 있어서
//       quantityUnit은 채권에 한해 표시용으로 남겨둔다(구매 예상수량 미리보기 등).
// sellActionLabel: 예·적금은 "해지", 채권·주식은 "매도", 펀드는 "환매" — 금융 도메인 관례 용어.
// buyActionLabel: 예·적금은 "가입", 나머지는 "매수".
//
// 2026-08-12(#75): 매매 수수료 0.015%. 주식·펀드(MARKET)만 붙고, 예·적금·채권(SUBSCRIPTION)은 0.
// 매수 수수료는 체결액 "밖"에서 추가로 나간다(현금 차감 = 체결액 + 수수료) — 그래서 "전액 매수"
// 버튼이 잔액을 그대로 채우면 수수료분만큼 모자라 422 INSUFFICIENT_SIMULATION_CASH가 날 수 있다.
// (FE_CHANGE_GUIDE_TRADE_COSTS 2번, API_DOCS "잔액을 전부 넣는 매수는 거부될 수 있다")
export const MARKET_BUY_FEE_RATE = 0.00015
export const ASSET_TYPE_META = {
  DEPOSIT_SAVINGS: {
    label: '예·적금',
    dotClass: 'bg-[var(--pf-asset-deposit)]',
    color: 'var(--pf-asset-deposit)',
    tradeType: 'SUBSCRIPTION',
    sellActionLabel: '해지',
    buyActionLabel: '가입',
    quantityUnit: null,
  },
  BOND: {
    label: '채권',
    dotClass: 'bg-[var(--pf-asset-bond)]',
    color: 'var(--pf-asset-bond)',
    tradeType: 'SUBSCRIPTION',
    sellActionLabel: '해지',
    buyActionLabel: '가입',
    quantityUnit: '좌', // 매도엔 안 쓰이지만, 보유 개수 표시·구매 예상수량 미리보기엔 필요.
  },
  STOCK: {
    label: '주식',
    dotClass: 'bg-[var(--pf-asset-stock)]',
    color: 'var(--pf-asset-stock)',
    tradeType: 'MARKET',
    sellActionLabel: '매도',
    buyActionLabel: '매수',
    quantityUnit: '주',
  },
  FUND: {
    label: '펀드',
    dotClass: 'bg-[var(--pf-asset-stock)]',
    color: 'var(--pf-asset-stock)',
    tradeType: 'MARKET',
    sellActionLabel: '환매',
    buyActionLabel: '매수',
    quantityUnit: '좌',
  },
}

export const CASH_META = {
  label: '현금',
  dotClass: 'bg-[var(--pf-asset-cash)]',
  color: 'var(--pf-asset-cash)',
  sellActionLabel: '매도',
  buyActionLabel: '매수',
  quantityUnit: null,
}

export const getAssetTypeMeta = (assetType) => ASSET_TYPE_META[assetType] ?? CASH_META
