/**
 * 자산 비중으로 투자 성향 라벨을 추정한다.
 * (프로필 API에 성향 필드가 생기기 전 홈 카드용)
 *
 * @param {{ label?: string, ratio?: number }[]} allocations
 * @returns {string}
 */
const RISK_BY_LABEL = {
  현금: 0,
  예금: 8,
  채권: 35,
  펀드: 60,
  주식: 82,
  기타: 45,
}

export const resolveInvestmentStyle = (allocations = []) => {
  if (!Array.isArray(allocations) || allocations.length === 0) {
    return '안정형'
  }

  const totalRatio = allocations.reduce((sum, item) => sum + (Number(item.ratio) || 0), 0)
  if (totalRatio <= 0) return '안정형'

  const score = allocations.reduce((sum, item) => {
    const ratio = Number(item.ratio) || 0
    const risk = RISK_BY_LABEL[item.label] ?? 40
    return sum + (risk * ratio) / totalRatio
  }, 0)

  if (score < 20) return '안정형'
  if (score < 40) return '안정추구형'
  if (score < 60) return '위험중립형'
  if (score < 80) return '적극투자형'
  return '공격투자형'
}
