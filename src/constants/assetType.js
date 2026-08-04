// ERD의 financial_products.asset_type과 1:1로 대응.
// 라벨/색상은 백엔드가 내려줄 필요 없는 순수 프레젠테이션 값이라 여기서만 관리한다.
export const ASSET_TYPE_META = {
  DEPOSIT_SAVINGS: {
    label: '예금',
    dotClass: 'bg-[var(--pf-asset-deposit)]',
    color: 'var(--pf-asset-deposit)',
  },
  BOND: { label: '채권', dotClass: 'bg-[var(--pf-asset-bond)]', color: 'var(--pf-asset-bond)' },
  STOCK: { label: '주식', dotClass: 'bg-[var(--pf-asset-stock)]', color: 'var(--pf-asset-stock)' },
  FUND: { label: '펀드', dotClass: 'bg-[var(--pf-asset-stock)]', color: 'var(--pf-asset-stock)' },
}

export const CASH_META = {
  label: '현금',
  dotClass: 'bg-[var(--pf-asset-cash)]',
  color: 'var(--pf-asset-cash)',
}

export const getAssetTypeMeta = (assetType) => ASSET_TYPE_META[assetType] ?? CASH_META
