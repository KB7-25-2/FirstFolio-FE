/**
 * @typedef {import('@/types/portfolio.js').AssetType} AssetType
 * @typedef {import('@/types/portfolio.js').AssetAllocation} AssetAllocation
 * @typedef {import('@/types/portfolio.js').ActivePortfolio} ActivePortfolio
 * @typedef {import('@/types/portfolio.js').DashboardSummary} DashboardSummary
 */

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export class PortfolioApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'PortfolioApiError'
    this.code = code
    this.status = status
    this.requestId = `req-mock-${Date.now()}`
  }
}

/** UI 표시용 자산군 라벨 */
export const ASSET_TYPE_LABELS = /** @type {Record<AssetType, string>} */ ({
  DEPOSIT_SAVINGS: '예금',
  STOCK: '주식',
  BOND: '채권',
  OTHER: '기타',
})

/** Figma PortfolioMemo AllocBar 색상 */
export const ASSET_TYPE_COLORS = /** @type {Record<AssetType, string>} */ ({
  DEPOSIT_SAVINGS: '#c17f24',
  STOCK: '#6b4a2b',
  BOND: '#7a6b33',
  OTHER: '#a89980',
})

/**
 * @param {object} item
 * @returns {AssetAllocation}
 */
const mapAllocation = (item) => ({
  assetType: item.asset_type,
  ratio: item.ratio,
})

/**
 * @param {object} holding
 * @returns {import('@/types/portfolio.js').PortfolioHolding}
 */
const mapHolding = (holding) => ({
  holdingId: holding.holding_id,
  productId: holding.product_id,
  displayName: holding.display_name,
  quantity: holding.quantity,
  principalAmount: holding.principal_amount,
  valuationAmount: holding.valuation_amount,
})

/**
 * @param {object} raw
 * @returns {ActivePortfolio}
 */
const mapActivePortfolio = (raw) => ({
  portfolioId: raw.portfolio_id,
  generationNo: raw.generation_no,
  cashBalance: raw.cash_balance,
  holdings: (raw.holdings ?? []).map(mapHolding),
  summary: {
    holdingsValue: raw.summary.holdings_value,
    totalAssets: raw.summary.total_assets,
    profitLoss: raw.summary.profit_loss,
  },
  allocation: (raw.allocation ?? []).map(mapAllocation),
  valuedAt: raw.valued_at,
})

/**
 * 활성 포트폴리오 상세 목업 (API snake_case)
 * Figma 홈 카드(1,000만 원 / 예금40·주식30·채권20·기타10)에 맞춤
 */
const MOCK_ACTIVE_PORTFOLIO_RESPONSE = {
  data: {
    portfolio_id: 8001,
    generation_no: 1,
    cash_balance: '1000000.00',
    holdings: [
      {
        holding_id: 8101,
        product_id: 25,
        display_name: '푸른나무 정기예금',
        quantity: '1.000000',
        principal_amount: '4000000.00',
        valuation_amount: '4000000.00',
      },
      {
        holding_id: 8102,
        product_id: 31,
        display_name: '성장형 주식형 펀드',
        quantity: '120.000000',
        principal_amount: '2800000.00',
        valuation_amount: '3000000.00',
      },
      {
        holding_id: 8103,
        product_id: 42,
        display_name: '국고채 ETF',
        quantity: '50.000000',
        principal_amount: '1900000.00',
        valuation_amount: '2000000.00',
      },
      {
        holding_id: 8104,
        product_id: 55,
        display_name: '단기 유동성 상품',
        quantity: '1.000000',
        principal_amount: '1000000.00',
        valuation_amount: '1000000.00',
      },
    ],
    summary: {
      holdings_value: '10000000.00',
      total_assets: '10000000.00',
      profit_loss: '200000.00',
    },
    allocation: [
      { asset_type: 'DEPOSIT_SAVINGS', ratio: 40 },
      { asset_type: 'STOCK', ratio: 30 },
      { asset_type: 'BOND', ratio: 20 },
      { asset_type: 'OTHER', ratio: 10 },
    ],
    valued_at: '2026-07-29T03:00:00Z',
  },
}

/**
 * 현재 활성 포트폴리오 상세 조회 (목업)
 * TODO: API 연동 시 apiClient.get('/portfolios/active') 등으로 교체
 * @returns {Promise<{ data: ActivePortfolio }>}
 */
export const getActivePortfolio = async () => {
  await delay()
  const raw = structuredClone(MOCK_ACTIVE_PORTFOLIO_RESPONSE)
  if (!raw?.data) {
    throw new PortfolioApiError('ACTIVE_PORTFOLIO_NOT_FOUND', '활성 포트폴리오가 없다.', 404)
  }
  return { data: mapActivePortfolio(raw.data) }
}
