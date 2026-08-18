const CURRICULUM_STORAGE_KEY = 'curriculum_state'

/**
 * 커리큘럼 확정 여부 (localStorage)
 * 라우트 가드 등 서비스 계층에 의존하지 않는 경로에서 사용
 * @returns {boolean}
 */
export const isCurriculumConfirmed = () => {
  try {
    const raw = localStorage.getItem(CURRICULUM_STORAGE_KEY)
    if (!raw) return false
    return Boolean(JSON.parse(raw).confirmed)
  } catch {
    return false
  }
}

/**
 * @param {boolean} [confirmed=true]
 */
export const setCurriculumConfirmed = (confirmed = true) => {
  localStorage.setItem(CURRICULUM_STORAGE_KEY, JSON.stringify({ confirmed: Boolean(confirmed) }))
}

export const clearCurriculumConfirmed = () => {
  localStorage.removeItem(CURRICULUM_STORAGE_KEY)
}

export { CURRICULUM_STORAGE_KEY }
