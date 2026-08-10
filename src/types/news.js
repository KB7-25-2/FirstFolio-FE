/**
 * 금융 뉴스 요약 아이템
 * @typedef {object} FinancialNewsItem
 * @property {number} financial_news_id
 * @property {string} title
 * @property {string} summary
 * @property {string} image_url
 * @property {string} source_name
 * @property {string} source_url
 * @property {string} source_published_at
 * @property {string} published_at
 */

/**
 * GET /financial-news 응답
 * @typedef {object} FinancialNewsListResponse
 * @property {{ items: FinancialNewsItem[] }} data
 */

export {}
