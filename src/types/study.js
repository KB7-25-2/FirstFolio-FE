/**
 * 커리큘럼 아이템 status
 * @typedef {'ACTIVE' | 'COMPLETED' | 'LOCKED'} CurriculumItemStatus
 */

/**
 * @typedef {'FOUNDATION' | 'CORE'} ChapterType
 */

/**
 * @typedef {object} CurriculumItem
 * @property {number} curriculumItemId
 * @property {number} mainChapterId
 * @property {string} title
 * @property {ChapterType} chapterType
 * @property {number} displayOrder
 * @property {CurriculumItemStatus} status
 * @property {string | null} completedAt
 * @property {number} progressPercent
 * @property {string} [description]
 * @property {number} [subChapterCount]
 * @property {string} [accent]
 * @property {string} [icon]
 */

/**
 * @typedef {'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'} LearningProgressStatus
 */

/**
 * StudyNote 체크리스트용 소단원 진행 (목록 API 확정 전 목업)
 * @typedef {object} LearningProgressItem
 * @property {number} progressId
 * @property {number} userId
 * @property {number} mainChapterId
 * @property {number} subChapterId
 * @property {number} contentVersionId
 * @property {string | null} lastPageId
 * @property {LearningProgressStatus} status
 * @property {string | null} startedAt
 * @property {string | null} completedAt
 * @property {string} updatedAt
 * @property {number} order
 * @property {string} title
 * @property {string} shortLabel
 * @property {number | null} quizScore
 */

/**
 * 소단원 학습 콘텐츠 조회 응답
 * @typedef {object} SubChapterContent
 * @property {number} subChapterId
 * @property {string} title
 * @property {number} contentVersionId
 * @property {string} schemaVersion
 * @property {string} contentUrl
 * @property {string} expiresAt
 * @property {{ status: LearningProgressStatus, lastPageId: string | null, completedAt: string | null }} progress
 */

/**
 * 학습 이어하기 위치
 * @typedef {object} ContinuePosition
 * @property {number} curriculumItemId
 * @property {number} mainChapterId
 * @property {number} subChapterId
 * @property {number} contentVersionId
 * @property {string | null} lastPageId
 * @property {number} progressPercent
 * @property {string} route
 */

export {}
