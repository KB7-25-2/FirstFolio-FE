// ERD의 financial_products.asset_type과 1:1로 대응.
// 라벨/색상/매매 액션 명칭/수량 단위는 백엔드가 내려줄 필요 없는 순수 프레젠테이션 값이라 여기서만 관리한다.
//
// tradeType: API 변경 제안(POST /portfolios 제거, amount 기반 통합) 기준.
//   'SUBSCRIPTION'(가입형) — 예·적금, 채권. 금액 그대로 원금이 되고, 이미 보유 중이면 재가입 불가(422).
//   'MARKET'(매수형) — 주식, 펀드. 서버가 수량=내림(금액÷현재가)으로 환산, 추가 매수 가능.
// sellActionLabel: 예·적금은 "해지", 주식·채권은 "매도", 펀드는 "환매" — 금융 도메인 관례 용어.
// buyActionLabel: 예·적금은 "가입", 나머지는 "매수".
// quantityUnit: 매수형(주식 "주", 펀드 "좌")만 사용. 가입형(예·적금, 채권)은 좌수 개념이 없어 null.
export const ASSET_TYPE_META = {
  DEPOSIT_SAVINGS: {
    label: '예금',
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
    tradeType: 'SUBSCRIPTION', // 실제로는 단가×수량 거래지만 1차는 가입형으로 단순화(2차에 전환 예정)
    sellActionLabel: '해지',
    buyActionLabel: '가입',
    quantityUnit: null,
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
