/**
 * 커리큘럼 아이템 status
 * @typedef {'ACTIVE' | 'COMPLETED' | 'LOCKED'} CurriculumItemStatus
 */

/**
 * @typedef {'FOUNDATION' | 'CORE'} ChapterType
 */

/**
 * 개인 커리큘럼 아이템 (커리큘럼 조회 API `data.items[]`)
 * @typedef {object} CurriculumItem
 * @property {number} curriculumItemId
 * @property {number} mainChapterId
 * @property {string} title
 * @property {ChapterType} chapterType
 * @property {number} displayOrder
 * @property {CurriculumItemStatus} status
 * @property {string | null} completedAt
 * @property {number} progressPercent
 */

/**
 * @typedef {'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'} LearningProgressStatus
 */

/**
 * 시간표 UI 상태 (목록 progress.status에서 파생)
 * @typedef {'COMPLETED' | 'IN_PROGRESS' | 'NEXT' | 'LOCKED'} ScheduleStatus
 */

/**
 * @typedef {'LESSON' | 'SCENARIO_QUIZ'} SubChapterEntryType
 */

/**
 * 대단원 내 소단원 진행 목록 아이템 (목록 API 확정 전 목업)
 * @typedef {object} LearningProgressItem
 * @property {number} progressId
 * @property {number} userId
 * @property {number} mainChapterId
 * @property {number | null} subChapterId
 * @property {number | null} contentVersionId
 * @property {string | null} lastPageId
 * @property {LearningProgressStatus} status
 * @property {string | null} startedAt
 * @property {string | null} completedAt
 * @property {string} updatedAt
 * @property {number} order
 * @property {string} title
 * @property {string} shortLabel
 * @property {string} [periodSubtitle]
 * @property {SubChapterEntryType} [entryType]
 * @property {number | null} quizScore
 */

/**
 * 소단원 메타 + 콘텐츠 접근 정보 (GET …/sub-chapters/:id)
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
