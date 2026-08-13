/**
 * Axios 응답에서 `{ data: T }` 래퍼를 벗겨낸다.
 * — BE 공통 성공 포맷: `{ data, error? }`
 * @param {{ data?: unknown }} response
 * @returns {unknown}
 */
export const unwrapData = (response) => {
  const body = response?.data
  if (body && typeof body === 'object' && 'data' in body && body.data != null) {
    return body.data
  }
  return body
}

/**
 * snake_case / camelCase 혼용 응답에서 첫 존재하는 필드를 고른다.
 * @param {object | null | undefined} obj
 * @param {...string} keys
 * @returns {unknown}
 */
export const pickField = (obj, ...keys) => {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return undefined
}
