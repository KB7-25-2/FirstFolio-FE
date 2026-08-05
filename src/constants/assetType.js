// ERD의 financial_products.asset_type과 1:1로 대응.
// 라벨/색상/매도 액션 명칭/수량 단위는 백엔드가 내려줄 필요 없는 순수 프레젠테이션 값이라 여기서만 관리한다.
// sellActionLabel: 예·적금은 "해지", 주식·채권은 "매도", 펀드는 "환매" — 금융 도메인 관례 용어.
// quantityUnit: 주식은 "주", 채권·펀드는 "좌". 예·적금은 좌수 개념이 없어 null(표시 안 함).
export const ASSET_TYPE_META = {
  DEPOSIT_SAVINGS: {
    label: '예금',
    dotClass: 'bg-[var(--pf-asset-deposit)]',
    color: 'var(--pf-asset-deposit)',
    sellActionLabel: '해지',
    quantityUnit: null,
  },
  BOND: {
    label: '채권',
    dotClass: 'bg-[var(--pf-asset-bond)]',
    color: 'var(--pf-asset-bond)',
    sellActionLabel: '매도',
    quantityUnit: '좌',
  },
  STOCK: {
    label: '주식',
    dotClass: 'bg-[var(--pf-asset-stock)]',
    color: 'var(--pf-asset-stock)',
    sellActionLabel: '매도',
    quantityUnit: '주',
  },
  FUND: {
    label: '펀드',
    dotClass: 'bg-[var(--pf-asset-stock)]',
    color: 'var(--pf-asset-stock)',
    sellActionLabel: '환매',
    quantityUnit: '좌',
  },
}

export const CASH_META = {
  label: '현금',
  dotClass: 'bg-[var(--pf-asset-cash)]',
  color: 'var(--pf-asset-cash)',
  sellActionLabel: '매도',
  quantityUnit: null,
}

export const getAssetTypeMeta = (assetType) => ASSET_TYPE_META[assetType] ?? CASH_META
