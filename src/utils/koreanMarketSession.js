const KOREAN_TIME_ZONE = 'Asia/Seoul'
const OPEN_MINUTE = 9 * 60
const CLOSE_MINUTE = 15 * 60 + 30

/**
 * 한국 거래소 정규장 상태를 반환한다.
 * 공휴일 정보는 포함하지 않으므로 현재는 주말과 정규장 시간만 판단한다.
 *
 * @param {Date} [date]
 */
export const getKoreanMarketSession = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KOREAN_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const value = (type) => parts.find((part) => part.type === type)?.value ?? ''
  const minuteOfDay = Number(value('hour')) * 60 + Number(value('minute'))
  const isWeekday = !['Sat', 'Sun'].includes(value('weekday'))
  const isOpen = isWeekday && minuteOfDay >= OPEN_MINUTE && minuteOfDay < CLOSE_MINUTE

  return {
    isOpen,
    label: isOpen ? '장중' : '장외 시간',
    scheduleLabel: '평일 09:00 ~ 15:30 (한국 시간)',
  }
}
