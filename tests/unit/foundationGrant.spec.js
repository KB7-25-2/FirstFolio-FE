import { afterEach, describe, expect, it } from 'vitest'
import {
  FOUNDATION_GRANT_STORAGE_KEY,
  INITIAL_SIMULATION_CASH,
  formatWon,
  hasGrantedSimulationCash,
  setGrantedSimulationCash,
} from '@/utils/foundationGrant.js'
import {
  __resetGrantedSimulationCash,
  getCurrentPortfolio,
  grantInitialSimulationCash,
} from '@/services/portfolioTradeService.js'

describe('foundationGrant utils', () => {
  afterEach(() => {
    setGrantedSimulationCash(false)
  })

  it('INITIAL_SIMULATION_CASH는 3천만원이다', () => {
    expect(INITIAL_SIMULATION_CASH).toBe(30_000_000)
  })

  it('formatWon이 원화 표기를 만든다', () => {
    expect(formatWon(30_000_000)).toBe('30,000,000원')
  })

  it('지급 플래그를 저장·조회한다', () => {
    expect(hasGrantedSimulationCash()).toBe(false)
    setGrantedSimulationCash(true)
    expect(hasGrantedSimulationCash()).toBe(true)
    expect(sessionStorage.getItem(FOUNDATION_GRANT_STORAGE_KEY)).toBe('1')
    setGrantedSimulationCash(false)
    expect(hasGrantedSimulationCash()).toBe(false)
  })
})

describe('grantInitialSimulationCash (mock)', () => {
  afterEach(() => {
    __resetGrantedSimulationCash()
  })

  it('현금 3천만원·보유 없음 포트폴리오를 만든다', async () => {
    const summary = await grantInitialSimulationCash()
    expect(summary.cashBalance).toBe(30_000_000)
    expect(summary.totalAssetValue).toBe(30_000_000)
    expect(summary.holdings).toEqual([])
    expect(hasGrantedSimulationCash()).toBe(true)
  })

  it('지급 후에는 getCurrentPortfolio가 지급분을 반환한다', async () => {
    await grantInitialSimulationCash()
    const summary = await getCurrentPortfolio()
    expect(summary.cashBalance).toBe(30_000_000)
    expect(summary.holdings).toHaveLength(0)
  })
})
