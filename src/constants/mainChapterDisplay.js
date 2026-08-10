/**
 * 로드맵 UI용 대단원 표시 메타 (API에 없는 FE 전용)
 * 키: mainChapterId
 */
export const MAIN_CHAPTER_DISPLAY = {
  1: {
    description: '모의투자 전에 꼭 알아야 할 포트폴리오의 기초',
    accent: 'cream',
    icon: '📋',
  },
  2: {
    description: '안전한 자산관리의 시작',
    accent: 'yellow',
    icon: '🏦',
  },
  3: {
    description: '안정적인 수익을 위한 채권 이해',
    accent: 'mint',
    icon: '📜',
  },
  4: {
    description: '기업과 시장을 읽는 투자 기초',
    accent: 'blue',
    icon: '📈',
  },
  5: {
    description: '분산투자로 시작하는 자산관리',
    accent: 'purple',
    icon: '💼',
  },
}

/**
 * @param {number} mainChapterId
 */
export const getMainChapterDisplay = (mainChapterId) =>
  MAIN_CHAPTER_DISPLAY[mainChapterId] ?? {
    description: '',
    accent: 'cream',
    icon: '',
  }
