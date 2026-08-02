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
 * @property {number} mainChapterId
 * @property {string} title
 * @property {number} contentVersionId
 * @property {string} schemaVersion
 * @property {string} contentUrl
 * @property {string} expiresAt
 * @property {{ status: LearningProgressStatus, lastPageId: string | null, completedAt: string | null }} progress
 */

/**
 * S3 소단원 JSON 블록 타입
 * - `text`: 명세 기본 블록 (`content`)
 * - `conclusion` | `definition` | `learn_more`: FE 교과서 UI용 확장 (상품 전용 FK 블록 없음)
 * @typedef {'text' | 'conclusion' | 'definition' | 'learn_more'} LessonBlockType
 */

/**
 * 강좌 페이지 블록 (S3 소단원 JSON)
 * @typedef {object} LessonBlock
 * @property {LessonBlockType} type
 * @property {string} [content] text 블록 본문
 * @property {string} [formula] conclusion
 * @property {string} [note] conclusion
 * @property {string} [term] definition
 * @property {string} [body] definition
 * @property {string} [chipLabel] learn_more
 * @property {string} [chipSubtitle] learn_more
 * @property {{ title?: string, example?: string, body?: string, footer?: string }} [modal] learn_more
 */

/**
 * 소단원 강좌 한 페이지
 * @typedef {object} LessonPage
 * @property {string} id
 * @property {number} order
 * @property {string} title
 * @property {LessonBlock[]} blocks
 */

/**
 * 소단원 퀴즈에 포함할 게시된 문항 버전 행 ID 목록
 * @typedef {object} SubChapterQuizRef
 * @property {number[]} questionIds
 */

/**
 * contentUrl로 로드하는 소단원 강좌 JSON (S3)
 * @typedef {object} SubChapterLessonJson
 * @property {string} schemaVersion
 * @property {number} subChapterId
 * @property {LessonPage[]} pages
 * @property {SubChapterQuizRef} subChapterQuiz
 */

/**
 * @typedef {'LEVEL_TEST' | 'SUB_CHAPTER' | 'MAIN_CHAPTER' | 'DAILY_GENERAL' | 'DAILY_NEWS'} QuizUsageType
 */

/**
 * @typedef {'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SCENARIO'} QuizQuestionType
 */

/**
 * @typedef {'EASY' | 'MEDIUM' | 'HARD'} QuizDifficulty
 */

/**
 * @typedef {'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'RETIRED'} QuizQuestionStatus
 */

/**
 * 선택지 (options_json 항목)
 * @typedef {object} QuizOption
 * @property {string} key
 * @property {string} label
 */

/**
 * quiz_questions 행 (MySQL 문항 버전) — FE 카멜케이스
 * @typedef {object} QuizQuestion
 * @property {number} questionId
 * @property {string} questionKey
 * @property {number} versionNo
 * @property {QuizUsageType} usageType
 * @property {number | null} mainChapterId
 * @property {number | null} subChapterId
 * @property {number | null} displayOrder
 * @property {QuizQuestionType} questionType
 * @property {QuizDifficulty | null} difficulty
 * @property {string} prompt
 * @property {object | null} scenarioJson
 * @property {QuizOption[] | null} optionsJson
 * @property {{ key?: string, keys?: string[] }} correctAnswerJson
 * @property {string} explanation
 * @property {object | null} sourceRefsJson
 * @property {QuizQuestionStatus} status
 * @property {number} createdBy
 * @property {string | null} publishedAt
 * @property {string} createdAt
 */

/**
 * 문항별 제출 답안
 * @typedef {object} QuizAnswerItem
 * @property {number} questionId
 * @property {string} selectedKey
 */

/**
 * 오답 이력 항목
 * @typedef {object} QuizWrongAnswer
 * @property {number} questionId
 * @property {string} selectedKey
 * @property {string} correctKey
 */

/**
 * 소단원 퀴즈 제출·채점 결과
 * @typedef {object} QuizAttemptResult
 * @property {number} subChapterId
 * @property {number} totalCount
 * @property {number} correctCount
 * @property {number} quizScore 0–100
 * @property {number} pointsGranted
 * @property {QuizWrongAnswer[]} wrongAnswers
 * @property {{ questionId: number, selectedKey: string, isCorrect: boolean }[]} gradedAnswers
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
