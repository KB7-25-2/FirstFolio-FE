/**
 * ISO 날짜를 상대 시간 문자열로 변환
 * @param {string} isoString
 * @returns {string}
 */
export const formatRelativeTime = (isoString) => {
  const diffMs = Date.now() - new Date(isoString).getTime()
  if (Number.isNaN(diffMs) || diffMs < 0) return ''

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `${Math.max(1, minutes)}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  return `${days}일 전`
}
