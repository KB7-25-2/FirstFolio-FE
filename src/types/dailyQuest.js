/**
 * 일일 퀘스트 도메인 타입
 * — DB: daily_quests / daily_quest_items / quiz_questions
 * — API: GET /daily-quests/today · PUT /daily-quests/today/answers
 *
 * 소단원·대단원·일일 퀘스트는 동일 quiz_questions 모델을 쓴다.
 * question_type 으로 UI 분기 (SINGLE_CHOICE 등 ↔ SCENARIO).
 * 풀이 전 INTRO에서 배정된 question_type 구성을 먼저 보여 준다.
 *
 * @typedef {import('@/types/study.js').QuizOption} QuizOption
 * @typedef {import('@/types/study.js').QuizQuestionType} QuizQuestionType
 * @typedef {import('@/types/study.js').QuizUsageType} QuizUsageType
 * @typedef {import('@/types/study.js').QuizDifficulty} QuizDifficulty
 *
 * @typedef {'GENERAL' | 'WRONG_RETRY' | 'NEWS'} DailyQuestSourceType
 *   daily_quest_items.source_type
 *
 * @typedef {'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED'} DailyQuestStatus
 *   daily_quests.status
 *
 * @typedef {'INTRO' | 'PLAY' | 'RESULT'} DailyQuestPhase
 *   FE 화면 단계 (INTRO = 유형 안내 → PLAY = 풀이 → RESULT = 결과)
 *
 * @typedef {object} DailyQuestSourceRef
 * @property {string} [title]
 * @property {string} [url]
 * @property {string} [publisher]
 * @property {string} [referenceAt] ISO datetime — 뉴스·시장 자료 기준 시점
 *
 * @typedef {object} DailyQuestScenarioJson
 *   quiz_questions.scenario_json — question_type=SCENARIO 일 때 필수
 * @property {string} [title]
 * @property {object} [persona] 캐릭터·고객 상황
 * @property {object} [market] 금융시장 상황
 * @property {string[]} [constraints] 제약 조건
 * @property {string} [paperTitle] 클립보드 서류 제목 등 UI 보조
 *
 * 배정 당시 문항 스냅샷 (question_snapshot_json)
 * — quiz_questions 특정 version 행 전체 사본
 * — GET today(제출 전) 응답에서는 correctAnswerJson·explanation 미포함
 *
 * @typedef {object} DailyQuestQuestionSnapshot
 * @property {number} questionId
 * @property {string} questionKey
 * @property {number} versionNo
 * @property {QuizUsageType} usageType
 * @property {number | null} mainChapterId
 * @property {number | null} subChapterId
 * @property {QuizQuestionType} questionType
 * @property {QuizDifficulty | null} [difficulty]
 * @property {string} prompt 시나리오를 읽은 뒤 답할 질문문
 * @property {DailyQuestScenarioJson | null} scenarioJson SCENARIO면 필수, 그 외 null
 * @property {QuizOption[] | null} optionsJson
 * @property {DailyQuestSourceRef[] | null} [sourceRefs] source_refs_json
 * @property {{ key?: string, keys?: string[] } | null} [correctAnswerJson] 채점 후·내부용
 * @property {string | null} [explanation] 채점 후·내부용
 *
 * 사용자 답안 (user_answer_json)
 * @typedef {object} DailyQuestUserAnswer
 * @property {string} [selectedKey] SINGLE_CHOICE | TRUE_FALSE | SCENARIO
 * @property {string[]} [selectedKeys] MULTIPLE_CHOICE
 *
 * daily_quest_items 행 (FE)
 * @typedef {object} DailyQuestItem
 * @property {number} dailyQuestItemId
 * @property {number} questionId
 * @property {DailyQuestSourceType} sourceType
 * @property {number} displayOrder 1~5
 * @property {DailyQuestQuestionSnapshot} questionSnapshot
 * @property {DailyQuestUserAnswer | null} userAnswer
 * @property {boolean | null} isCorrect 채점 전 null
 * @property {string | null} answeredAt
 *
 * INTRO용 question_type 집계
 * @typedef {object} DailyQuestQuestionTypeSummary
 * @property {QuizQuestionType} questionType
 * @property {string} label
 * @property {number} count
 *
 * daily_quests + items (GET /daily-quests/today data)
 * @typedef {object} DailyQuest
 * @property {number} dailyQuestId
 * @property {string} questDate YYYY-MM-DD
 * @property {DailyQuestStatus} status
 * @property {number} totalCount
 * @property {number} correctCount
 * @property {number} score 리더보드 반영 점수
 * @property {number} answeredCount userAnswer 있는 문항 수 (FE·응답 보조)
 * @property {string | null} completedAt
 * @property {DailyQuestItem[]} items displayOrder 순
 * @property {QuizQuestionType[]} questionTypes 배정된 유형 유니크(등장 순)
 * @property {DailyQuestQuestionTypeSummary[]} questionTypeSummary INTRO용
 *
 * PUT /daily-quests/today/answers body (camelCase 입력)
 * @typedef {object} DailyQuestSaveAnswerInput
 * @property {number} dailyQuestItemId
 * @property {DailyQuestUserAnswer} answer
 *
 * PUT 응답 data
 * @typedef {object} DailyQuestSaveAnswerResult
 * @property {number} dailyQuestId
 * @property {DailyQuestStatus} status
 * @property {number} answeredCount
 * @property {number} totalCount
 * @property {number} dailyQuestItemId
 * @property {DailyQuestUserAnswer} userAnswer
 */

export {}
