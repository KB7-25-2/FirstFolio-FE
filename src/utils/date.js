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

const WEEKDAY_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

/**
 * Date를 `2026년 7월 21일 화요일` 형식으로 변환
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export const formatKoreanDate = (date = new Date()) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAY_KO[date.getDay()]
  return `${year}년 ${month}월 ${day}일 ${weekday}`
}
