export const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export const unwrap = (response) => response?.data?.data ?? response?.data

export const pickField = (obj, ...keys) => {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return undefined
}

/**
 * DEV mock 폴백 정책 — GET /learning/continue 등 API 실패 시 in-memory mock 사용
 * - PROD: 항상 false
 * - DEV: 비즈니스 4xx(리소스 없음·선행 미충족 등)는 throw, 네트워크/5xx만 mock
 */
export const shouldFallbackStudyMock = (error) => {
  if (!import.meta.env.DEV) return false
  const code = error?.code
  if (
    code === 'CONTINUE_POSITION_NOT_FOUND' ||
    code === 'SUB_CHAPTER_NOT_FOUND' ||
    code === 'CONTENT_NOT_PUBLISHED' ||
    code === 'PREREQUISITE_REQUIRED' ||
    code === 'QUIZ_NOT_AVAILABLE' ||
    code === 'SUB_CHAPTERS_INCOMPLETE' ||
    code === 'CONTENT_VERSION_MISMATCH' ||
    code === 'INVALID_PAGE_ID' ||
    code === 'CONTENT_UNAVAILABLE'
  ) {
    return false
  }
  return true
}
