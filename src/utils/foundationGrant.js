/**
 * 포트폴리오 기초 수료 시 모의투자금 지급
 */

export const INITIAL_SIMULATION_CASH = 30_000_000

export const FOUNDATION_GRANT_STORAGE_KEY = 'simulation_cash_granted'

/**
 * @returns {boolean}
 */
export const hasGrantedSimulationCash = () => {
  try {
    return sessionStorage.getItem(FOUNDATION_GRANT_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * @param {boolean} granted
 */
export const setGrantedSimulationCash = (granted) => {
  try {
    if (granted) sessionStorage.setItem(FOUNDATION_GRANT_STORAGE_KEY, '1')
    else sessionStorage.removeItem(FOUNDATION_GRANT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * @param {number} value
 * @returns {string}
 */
export const formatWon = (value) => `${Math.round(value).toLocaleString('ko-KR')}원`
