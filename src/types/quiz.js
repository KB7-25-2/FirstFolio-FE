/**
 * 공통 퀴즈 문항 타입
 * — DB: quiz_questions
 * — 스키마: `.cursor/rules/JSON_SCHEMA.md` 퀴즈 섹션
 *
 * 소단원·대단원·레벨테스트·일일 퀘스트가 동일 모델을 쓴다.
 * 문항 본문·선택지·정답·해설은 강좌 JSON이 아니라 이 모델에 둔다.
 */

/**
 * @typedef {'LEVEL_TEST' | 'SUB_CHAPTER' | 'MAIN_CHAPTER' | 'DAILY_GENERAL' | 'DAILY_NEWS'} QuizUsageType
 */

/**
 * @typedef {'SINGLE_CHOICE' | 'TRUE_FALSE' | 'SCENARIO'} QuizQuestionType
 *   MULTIPLE_CHOICE 는 지원하지 않는다.
 */

/**
 * @typedef {'EASY' | 'MEDIUM' | 'HARD'} QuizDifficulty
 */

/**
 * @typedef {'HUMAN' | 'AI'} QuizGenerationType
 */

/**
 * @typedef {'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'RETIRED'} QuizQuestionStatus
 */

/**
 * 선택지 (options_json 항목)
 * @typedef {object} QuizOption
 * @property {string} key
 * @property {string} label
 * @property {string | null} [description]
 */

/**
 * 정답 (correct_answer_json) — 단일 정답만 허용
 * @typedef {object} QuizCorrectAnswer
 * @property {string} key
 */

/**
 * SCENARIO persona
 * @typedef {object} QuizScenarioPersona
 * @property {string} [name]
 * @property {string} [age]
 * @property {string} [job]
 */

/**
 * SCENARIO requirements
 * @typedef {object} QuizScenarioRequirements
 * @property {string} [assets]
 * @property {string} [risk]
 * @property {string} [goal]
 */

/**
 * SCENARIO market
 * @typedef {object} QuizScenarioMarket
 * @property {string} [title]
 * @property {string} [referenceAt]
 * @property {string[]} [bullets]
 */

/**
 * scenario_json — question_type=SCENARIO 일 때 필수
 * @typedef {object} QuizScenarioJson
 * @property {string} [title]
 * @property {string} [narrative]
 * @property {QuizScenarioPersona} [persona]
 * @property {QuizScenarioRequirements} [requirements]
 * @property {QuizScenarioMarket} [market]
 * @property {string[]} [constraints]
 * @property {string} [paperTitle]
 */

/**
 * AI 근거 자료 (source_refs_json 항목)
 * @typedef {object} QuizSourceRef
 * @property {string} [title]
 * @property {string} [url]
 * @property {string} [publisher]
 * @property {string} [referenceAt]
 */

/**
 * quiz_questions 행 (MySQL 문항 버전)
 * @typedef {object} QuizQuestion
 * @property {number} questionId
 * @property {string} questionKey
 * @property {number} versionNo
 * @property {QuizUsageType} usageType
 * @property {number | null} mainChapterId
 * @property {number | null} subChapterId
 * @property {number | null} [displayOrder]
 * @property {QuizQuestionType} questionType
 * @property {QuizDifficulty | null} difficulty
 * @property {string} prompt
 * @property {QuizScenarioJson | null} scenarioJson
 * @property {QuizOption[]} optionsJson
 * @property {QuizCorrectAnswer} correctAnswerJson
 * @property {string} explanation
 * @property {QuizGenerationType} generationType
 * @property {QuizSourceRef[] | null} sourceRefsJson
 * @property {QuizQuestionStatus} status
 * @property {number | null} [createdBy]
 * @property {string | null} [publishedAt]
 * @property {string | null} [createdAt]
 */

/**
 * 사용자 조회용 (정답·해설 제외)
 * @typedef {object} QuizQuestionView
 * @property {number} questionId
 * @property {string} questionKey
 * @property {QuizQuestionType} questionType
 * @property {string} prompt
 * @property {QuizScenarioJson | null} [scenarioJson]
 * @property {QuizOption[]} optionsJson
 */

/**
 * @typedef {object} QuizSubmitRequest
 * @property {string} selectedKey
 */

/**
 * @typedef {object} QuizGradeResult
 * @property {number} questionId
 * @property {boolean} isCorrect
 * @property {string} correctKey
 * @property {string} [explanation]
 */

export {}
