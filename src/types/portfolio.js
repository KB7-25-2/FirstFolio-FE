/**
 * 자산군 유형
 * @typedef {'DEPOSIT_SAVINGS' | 'STOCK' | 'BOND' | 'OTHER'} AssetType
 */

/**
 * 자산군 비중
 * @typedef {object} AssetAllocation
 * @property {AssetType} assetType
 * @property {number} ratio
 */

/**
 * 대시보드 포트폴리오 섹션 (부분 장애 가능)
 * @typedef {object} DashboardPortfolioSection
 * @property {boolean} available
 * @property {string} [reason]
 * @property {string} [totalAssets] 금액 문자열
 * @property {string} [profitLoss] 금액 문자열
 * @property {AssetAllocation[]} [allocation]
 */

/**
 * 일일 퀘스트 섹션
 * @typedef {object} DashboardDailyQuest
 * @property {'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'} status
 * @property {number} answeredCount
 * @property {number} totalCount
 */

/**
 * 학습 요약 섹션
 * @typedef {object} DashboardLearning
 * @property {number} mainChapterId
 * @property {number} subChapterId
 * @property {number} progressPercent
 */

/**
 * 다가오는 이벤트
 * @typedef {object} DashboardUpcomingEvent
 * @property {string} type
 * @property {string} scheduledAt
 */

/**
 * 최신 뉴스 요약
 * @typedef {object} DashboardLatestNews
 * @property {number} knowledgeContentId
 * @property {string} title
 * @property {string} referenceAt
 */

/**
 * GET /dashboard 응답 data
 * @typedef {object} DashboardSummary
 * @property {DashboardPortfolioSection} portfolio
 * @property {DashboardDailyQuest} dailyQuest
 * @property {DashboardLearning} learning
 * @property {DashboardUpcomingEvent[]} upcomingEvents
 * @property {DashboardLatestNews[]} latestNews
 */

/**
 * 보유 상품
 * @typedef {object} PortfolioHolding
 * @property {number} holdingId
 * @property {number} productId
 * @property {string} displayName
 * @property {string} quantity
 * @property {string} principalAmount
 * @property {string} valuationAmount
 */

/**
 * 포트폴리오 요약 금액
 * @typedef {object} PortfolioSummaryAmounts
 * @property {string} holdingsValue
 * @property {string} totalAssets
 * @property {string} profitLoss
 */

/**
 * GET 활성 포트폴리오 상세 응답 data
 * @typedef {object} ActivePortfolio
 * @property {number} portfolioId
 * @property {number} generationNo
 * @property {string} cashBalance
 * @property {PortfolioHolding[]} holdings
 * @property {PortfolioSummaryAmounts} summary
 * @property {AssetAllocation[]} allocation
 * @property {string} valuedAt
 */

export {}
