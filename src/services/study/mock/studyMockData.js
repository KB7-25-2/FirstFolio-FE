/**
 * @typedef {import('@/types/study.js').LearningProgressItem} LearningProgressItem
 * @typedef {import('@/types/study.js').QuizQuestion} QuizQuestion
 * @typedef {import('@/types/study.js').ChapterGame} ChapterGame
 */

/** 개인 커리큘럼 조회 API 목업 — 기초 수료 후 예·적금 진행 중 유저 */
export const MOCK_CURRICULUM_RESPONSE = {
  data: {
    items: [
      {
        curriculum_item_id: 501,
        main_chapter_id: 1,
        title: '포트폴리오 기초',
        chapter_type: 'FOUNDATION',
        display_order: 1,
        status: 'COMPLETED',
        completed_at: '2026-06-20T12:00:00',
        progress_percent: 100,
      },
      {
        curriculum_item_id: 502,
        main_chapter_id: 2,
        title: '예·적금',
        chapter_type: 'CORE',
        display_order: 2,
        status: 'ACTIVE',
        completed_at: null,
        progress_percent: 50,
      },
      {
        curriculum_item_id: 503,
        main_chapter_id: 3,
        title: '채권',
        chapter_type: 'CORE',
        display_order: 3,
        status: 'LOCKED',
        completed_at: null,
        progress_percent: 0,
      },
      {
        curriculum_item_id: 504,
        main_chapter_id: 4,
        title: '주식',
        chapter_type: 'CORE',
        display_order: 4,
        status: 'LOCKED',
        completed_at: null,
        progress_percent: 0,
      },
      {
        curriculum_item_id: 505,
        main_chapter_id: 5,
        title: '펀드',
        chapter_type: 'CORE',
        display_order: 5,
        status: 'LOCKED',
        completed_at: null,
        progress_percent: 0,
      },
    ],
  },
}

/**
 * 시드: 예·적금(2) — 1~2교시 수료, 3교시(103) 진행 중, 시나리오 잠금
 * @type {LearningProgressItem[]}
 */
export const MOCK_LEARNING_PROGRESS = [
  // —— 포트폴리오 기초(1) COMPLETED ——
  {
    progressId: 111,
    userId: 1,
    mainChapterId: 1,
    subChapterId: 11,
    contentVersionId: 211,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-06-10T10:00:00',
    completedAt: '2026-06-11T12:00:00',
    updatedAt: '2026-06-11T12:00:00',
    order: 1,
    title: '포트폴리오란?',
    shortLabel: '기초개념',
    periodSubtitle: '1교시 · 자산 바구니 소개',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 112,
    userId: 1,
    mainChapterId: 1,
    subChapterId: 12,
    contentVersionId: 212,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-06-12T10:00:00',
    completedAt: '2026-06-13T11:00:00',
    updatedAt: '2026-06-13T11:00:00',
    order: 2,
    title: '위험과 수익',
    shortLabel: '위험수익',
    periodSubtitle: '2교시 · 트레이드오프 이해하기',
    entryType: 'LESSON',
    quizScore: 90,
  },
  {
    progressId: 113,
    userId: 1,
    mainChapterId: 1,
    subChapterId: 13,
    contentVersionId: 213,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-06-14T09:00:00',
    completedAt: '2026-06-15T10:00:00',
    updatedAt: '2026-06-15T10:00:00',
    order: 3,
    title: '분산 투자의 힘',
    shortLabel: '분산투자',
    periodSubtitle: '3교시 · 달걀을 한 바구니에?',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 114,
    userId: 1,
    mainChapterId: 1,
    subChapterId: 14,
    contentVersionId: 214,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-06-16T09:00:00',
    completedAt: '2026-06-17T10:00:00',
    updatedAt: '2026-06-17T10:00:00',
    order: 4,
    title: '나만의 목표 설정',
    shortLabel: '목표설정',
    periodSubtitle: '4교시 · 투자 성향 점검',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 115,
    userId: 1,
    mainChapterId: 1,
    subChapterId: null,
    contentVersionId: null,
    lastPageId: null,
    status: 'COMPLETED',
    startedAt: '2026-06-18T09:00:00',
    completedAt: '2026-06-18T10:00:00',
    updatedAt: '2026-06-18T10:00:00',
    order: 5,
    title: '기초 실전 퀴즈',
    shortLabel: '실전퀴즈',
    periodSubtitle: '5교시 · 기초 점검',
    entryType: 'SCENARIO_QUIZ',
    quizScore: 100,
  },
  // —— 예·적금(2) ACTIVE ——
  {
    progressId: 201,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 101,
    contentVersionId: 301,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-07-01T10:00:00',
    completedAt: '2026-07-02T14:30:00',
    updatedAt: '2026-07-02T14:30:00',
    order: 1,
    title: '예금이란?',
    shortLabel: '예금 기초',
    periodSubtitle: '1교시 · 예금의 기본 개념',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 202,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 102,
    contentVersionId: 302,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-07-03T09:00:00',
    completedAt: '2026-07-04T11:00:00',
    updatedAt: '2026-07-04T11:00:00',
    order: 2,
    title: '예금의 종류',
    shortLabel: '예금 종류',
    periodSubtitle: '2교시 · 보통·정기·적금',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 203,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 103,
    contentVersionId: 303,
    lastPageId: 'page-2',
    status: 'IN_PROGRESS',
    startedAt: '2026-07-05T16:00:00',
    completedAt: null,
    updatedAt: '2026-07-05T16:45:00',
    order: 3,
    title: '금리의 이해',
    shortLabel: '금리',
    periodSubtitle: '3교시 · 단리와 복리',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 204,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 104,
    contentVersionId: 304,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 4,
    title: '예금자 보호 제도',
    shortLabel: '예금자보호',
    periodSubtitle: '4교시 · 5천만원 보호한도',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 205,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 105,
    contentVersionId: 305,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 5,
    title: '저축 목표 세우기',
    shortLabel: '저축목표',
    periodSubtitle: '5교시 · 나만의 저축 계획',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 206,
    userId: 1,
    mainChapterId: 2,
    subChapterId: null,
    contentVersionId: null,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 6,
    title: '예금 실전 퀴즈',
    shortLabel: '실전퀴즈',
    periodSubtitle: '6교시 · 배운 내용 점검',
    entryType: 'SCENARIO_QUIZ',
    quizScore: null,
  },
]

/** 이어하기 mock — recomputeContinuePosition / getContinuePosition DEV 폴백 */
export const mockContinueStore = {
  data: {
    curriculum_item_id: 502,
    main_chapter_id: 2,
    sub_chapter_id: 103,
    content_version_id: 303,
    last_page_id: 'page-2',
    progress_percent: 50,
    route: '/learning/sub-chapters/103?page=page-2',
  },
}

/** 소단원별 포인트 지급 여부 (재응시 중복 방지) */
export const MOCK_QUIZ_POINT_GRANTED = new Set()

/** @type {QuizWrongAnswer[]} */
export const MOCK_WRONG_ANSWER_LOG = []

/**
 * @param {number} questionId
 * @param {number} subChapterId
 * @param {string} questionKey
 * @param {string} prompt
 * @param {string[]} labels
 * @param {string} correctKey
 * @param {string} explanation
 * @param {'SINGLE_CHOICE' | 'TRUE_FALSE'} [questionType]
 * @returns {QuizQuestion}
 */
const buildSubChapterQuestion = (
  questionId,
  subChapterId,
  questionKey,
  prompt,
  labels,
  correctKey,
  explanation,
  questionType = 'SINGLE_CHOICE',
) => ({
  questionId,
  questionKey,
  versionNo: 1,
  usageType: 'SUB_CHAPTER',
  mainChapterId: 2,
  subChapterId,
  displayOrder: null,
  questionType,
  difficulty: 'MEDIUM',
  prompt,
  scenarioJson: null,
  optionsJson: labels.map((label, i) => ({
    key: String(i + 1),
    label,
  })),
  correctAnswerJson: { key: correctKey },
  explanation,
  sourceRefsJson: null,
  status: 'PUBLISHED',
  createdBy: 1,
  publishedAt: '2026-07-01T00:00:00',
  createdAt: '2026-06-15T00:00:00',
})

/** quiz_questions 목업 — question_id 키, 소단원 JSON questionIds와 대응 */
export const MOCK_QUIZ_QUESTIONS = {
  1001: buildSubChapterQuestion(
    1001,
    101,
    'deposit-vs-savings',
    '예금과 적금의 차이로 올바른 것은?',
    [
      '예금은 나눠 넣고 적금은 한 번에 맡긴다',
      '예금은 목돈을 한 번에, 적금은 나눠 넣는다',
      '둘 다 원금이 보장되지 않는다',
      '적금만 이자가 붙는다',
    ],
    '2',
    '정기 예금은 목돈을 한 번에 맡기고, 정기 적금은 매월 나눠 넣는 방식입니다.',
  ),
  1002: buildSubChapterQuestion(
    1002,
    101,
    'deposit-check-items',
    '금융상품을 볼 때 확인할 항목이 아닌 것은?',
    ['금리', '만기', '좋아하는 색', '위험도'],
    '3',
    '금리, 만기, 지급 주기, 위험도 등을 확인합니다. 선호 색은 상품 선택 기준이 아닙니다.',
  ),
  1003: buildSubChapterQuestion(
    1003,
    101,
    'deposit-interest-period',
    '적금 이자가 예금보다 적어 보이는 이유로 적절한 것은?',
    [
      '적금은 이자가 붙지 않아서',
      '돈이 통장에 머무는 기간이 평균적으로 짧아서',
      '은행이 적금만 손해를 봐서',
      '예금만 복리여서',
    ],
    '2',
    '적금은 나중에 넣는 돈일수록 예치 기간이 짧아 평균 이자가 작아질 수 있습니다.',
  ),
  1011: buildSubChapterQuestion(
    1011,
    102,
    'deposit-types-1',
    '보통예금의 특징으로 맞는 것은?',
    ['만기가 고정된다', '자유롭게 입출금할 수 있다', '이자가 없다', '주식과 같다'],
    '2',
    '보통예금은 필요할 때 자유롭게 입출금할 수 있는 예금입니다.',
  ),
  1012: buildSubChapterQuestion(
    1012,
    102,
    'deposit-types-2',
    '정기예금에 대한 설명으로 옳은 것은?',
    [
      '매일 나눠 넣어야 한다',
      '약정한 기간 동안 목돈을 맡겨 둔다',
      '정부가 발행한다',
      '원금이 항상 줄어든다',
    ],
    '2',
    '정기예금은 약정 기간 동안 목돈을 맡겨 두고 이자를 받는 상품입니다.',
  ),
  1013: buildSubChapterQuestion(
    1013,
    102,
    'deposit-types-3',
    '적금의 특징으로 맞는 것은?',
    ['한 번에만 입금한다', '정해진 주기로 나눠 넣는다', '주식 배당이다', '만기가 없다'],
    '2',
    '적금은 매월 등 정해진 주기로 나눠 넣는 저축 방식입니다.',
  ),
  1021: buildSubChapterQuestion(
    1021,
    103,
    'stock-basics-1',
    '다음 중 주식에 대한 설명으로\n올바른 것은?',
    [
      '주식은 원금이 보장됩니다',
      '주식을 사면 회사의 주주가 됩니다',
      '주식 수익률은 항상 예금보다 낮습니다',
      '주식은 정부가 발행합니다',
    ],
    '2',
    '주식을 매수하면 해당 회사의 주주가 됩니다. 원금 보장·정부 발행은 일반적인 주식의 특성이 아닙니다.',
  ),
  1022: buildSubChapterQuestion(
    1022,
    103,
    'deposit-protection-limit',
    '예금자 보호 한도로 올바른 것은?',
    ['1천만 원', '3천만 원', '5천만 원', '한도 없음'],
    '3',
    '예금자보호제도는 금융기관당 원금과 이자를 합쳐 5천만 원까지 보호합니다.',
  ),
  1023: buildSubChapterQuestion(
    1023,
    103,
    'real-interest-formula',
    '실질 금리의 계산으로 맞는 것은?',
    [
      '명목 금리 − 물가 상승률',
      '명목 금리 + 물가 상승률',
      '명목 금리 × 물가 상승률',
      '명목 금리 ÷ 물가 상승률',
    ],
    '1',
    '실질 금리 = 명목 금리 − 물가 상승률 입니다.',
  ),
  1031: buildSubChapterQuestion(
    1031,
    104,
    'protection-1',
    '예금자 보호 제도의 목적으로 적절한 것은?',
    ['주가 부양', '예금자 보호와 금융 안정', '세금 감면', '대출 금리 인하'],
    '2',
    '금융기관 파산 시 예금자를 보호하고 금융 안정을 돕습니다.',
  ),
  1032: buildSubChapterQuestion(
    1032,
    104,
    'protection-2',
    '예금자 보호 대상이 아닌 것은?',
    ['은행 예금', '일부 저축은행 예금', '주식', '보험금 일부'],
    '3',
    '주식 등 투자 상품은 예금자 보호 대상이 아닙니다.',
  ),
  1033: buildSubChapterQuestion(
    1033,
    104,
    'protection-3',
    '보호 한도 적용 단위로 맞는 것은?',
    ['계좌마다', '금융기관마다', '상품마다', '국가마다 매일'],
    '2',
    '일반적으로 금융기관당 합산하여 한도가 적용됩니다.',
  ),
  1041: buildSubChapterQuestion(
    1041,
    105,
    'saving-goal-1',
    '저축 목표를 세울 때 먼저 할 일로 적절한 것은?',
    [
      '목표 금액과 기간을 정한다',
      '아무 상품이나 가입한다',
      '대출부터 받는다',
      '주식을 전액 매수한다',
    ],
    '1',
    '목표 금액·기간을 정한 뒤 맞는 저축 방법을 고릅니다.',
  ),
  1042: buildSubChapterQuestion(
    1042,
    105,
    'saving-goal-2',
    '단기 목표에 더 잘 맞는 상품 성향은?',
    ['장기 묶임·고위험', '유동성이 높은 예금·적금', '부동산만', '암호화폐만'],
    '2',
    '단기 목표는 꺼내 쓰기 쉬운 예·적금이 유리한 경우가 많습니다.',
  ),
  1043: buildSubChapterQuestion(
    1043,
    105,
    'saving-goal-3',
    '목표 달성 점검으로 좋은 습관은?',
    [
      '아예 확인하지 않는다',
      '주기적으로 잔액·진행률을 본다',
      '매일 전액 출금한다',
      '목표를 숨긴다',
    ],
    '2',
    '주기적으로 진행률을 보면 계획을 조정하기 쉽습니다.',
  ),
}

/** @type {Map<number, ChapterGame>} mainChapterId → chapter game
 * unlocked는 시드 false — 전체 LESSON 수료 시 submitQuizAttempt / getChapterGame에서 해금
 */
export const MOCK_CHAPTER_GAMES = new Map([
  [
    1,
    {
      chapterGameId: 40,
      mainChapterId: 1,
      title: '기초 실전 퀴즈',
      unlocked: false,
      scenarios: [
        {
          scenarioId: 401,
          title: '첫 모의 포트폴리오를 짜는 친구',
          completed: false,
        },
      ],
    },
  ],
  [
    2,
    {
      chapterGameId: 50,
      mainChapterId: 2,
      title: '예금 실전 퀴즈',
      unlocked: false,
      scenarios: [
        {
          scenarioId: 501,
          title: '첫 월급을 받은 사회초년생',
          completed: false,
        },
      ],
    },
  ],
])

/** scenarioId → detail */
export const MOCK_SCENARIOS = {
  401: {
    scenarioId: 401,
    title: '첫 모의 포트폴리오를 짜는 친구',
    rewardStar: 30,
    content: {
      scenarioKey: 'foundation-first-portfolio',
      chapterTitle: '포트폴리오 기초',
      chapterSubtitle: '모의투자 전 필수 선행',
      opening: {
        documentTitle: '공 문 서',
        docNo: '제 2026-기초-001 호',
        docDate: '2026. 06. 01',
        orgName: '금융 상담 교육원',
        title: '포트폴리오 기초 실전 점검',
        mission:
          '친구가 모의투자금을 받아 첫 포트폴리오를 구성하려 합니다. 분산과 위험의 기본을 떠올리며 가장 알맞은 조언을 고르세요.',
        issuerLabel: '발행처',
        issuerName: '투자 상담 교육원장',
        startLabel: '게임 시작',
      },
      conditions: {
        persona: {
          name: '펭귄',
          age: '17세',
          job: '고등학생',
          monthlyIncome: '용돈 5만원',
          monthlySaving: '2만원',
        },
        requirements: {
          assets: '모의투자금 3천만원(가상)',
          risk: '중위험 이하 선호',
          goal: '첫 분산 포트폴리오 구성',
        },
        marketTitle: '기초 점검 시황',
        marketDate: '2026. 06. 01',
        marketBullets: [
          '한 자산에만 몰빵하면 위험이 커져요',
          '현금·예금·주식·펀드를 나눠 담아보세요',
        ],
        constraints: ['교육용 모의투자이며 실제 거래가 아닙니다'],
      },
      steps: [
        {
          stepId: 4011,
          order: 1,
          paperTitle: '첫 포트폴리오 조언',
          prompt: '친구가 “주식만 사면 빨리 부자 되지 않아?”라고 물었습니다. 가장 알맞은 대답은?',
          options: [
            {
              key: 'A',
              label: '한 자산에만 몰아넣는 게 최고야',
              description: '수익만 보고 위험을 무시하는 조언',
            },
            {
              key: 'B',
              label: '분산해서 위험을 나눠 담아보자',
              description: '포트폴리오 기초의 핵심',
            },
            {
              key: 'C',
              label: '현금만 들고 있으면 돼',
              description: '기회 비용을 전혀 고려하지 않음',
            },
          ],
          correctKey: 'B',
          explanation: '분산 투자는 위험을 한곳에 몰지 않고 자산 역할을 나누는 기본 원칙입니다.',
        },
      ],
    },
  },
  501: {
    scenarioId: 501,
    title: '첫 월급을 받은 사회초년생',
    rewardStar: 50,
    content: {
      scenarioKey: 'first-salary-portfolio',
      chapterTitle: '예·적금',
      chapterSubtitle: '안전한 자산관리의 시작',
      opening: {
        documentTitle: '공 문 서',
        docNo: '제 2024-시나-001 호',
        docDate: '2024. 06. 10',
        orgName: '금융 상담 교육원',
        title: '금융 상담사 역량 평가(가명)',
        mission:
          '실전 고객 상담 시나리오를 통해 귀하의 포트폴리오 추천 역량을 평가합니다. 고객 프로필과 금융 시황을 참고하여 최적의 포트폴리오를 선택하십시오.',
        issuerLabel: '발행처',
        issuerName: '투자 상담 교육원장',
        startLabel: '게임 시작',
      },
      conditions: {
        persona: {
          name: '펭귄',
          age: '28세',
          job: '직장인',
          monthlyIncome: '300만',
          monthlySaving: '50만',
        },
        requirements: {
          assets: '800만원',
          risk: '중위험 선호',
          goal: '안정+성장',
        },
        marketTitle: '오늘의 금융 시황',
        marketDate: '2024.06.10',
        marketBullets: [
          '시중은행 정기예금 금리 연 3.2% 수준',
          '적금 우대금리 조건이 까다로워지는 추세',
          '단기 유동성 수요가 늘어난 달',
        ],
        constraints: ['원금 손실은 원하지 않음', '안정과 성장을 함께 추구'],
      },
      steps: [
        {
          stepId: 9001,
          order: 1,
          paperTitle: '포트폴리오 추천서',
          prompt:
            '첫 직장 3년 차, 월급의 일부를 꾸준히 모아두었지만 어디에 투자해야 할지 막막합니다. 안정적인 수익을 원하면서도 성장 기회를 놓치고 싶지 않아, 오늘 포트폴리오 구성 조언을 받으러 왔습니다.',
          options: [
            {
              key: '1',
              label: '예금 80%, 주식 20%',
              description: '안정적인 자산 비중을 높인 포트폴리오입니다.',
            },
            {
              key: '2',
              label: '주식 100%',
              description: '성장 가능성은 높지만 주식에만 투자합니다.',
            },
            {
              key: '3',
              label: '예금 40%, 주식 40%, 채권 20%',
              description: '안정성과 성장의 균형을 갖춘 최적의 포트폴리오입니다.',
            },
            {
              key: '4',
              label: '채권 100%',
              description: '안정적인 수익을 목표로 채권에만 투자합니다.',
            },
          ],
          correctKey: '3',
          explanation:
            '중위험·안정+성장 목표에는 예금·주식·채권을 고루 담은 포트폴리오가 가장 잘 맞습니다.',
        },
        {
          stepId: 9002,
          order: 2,
          paperTitle: '포트폴리오 추천서',
          prompt:
            '승진으로 수입이 늘었습니다. 여유 자금이 생겼지만 주식·채권·예금에 얼마나 넣을지 고민이라 전문가의 포트폴리오 추천을 원합니다.',
          options: [
            {
              key: '1',
              label: '예금 80%, 주식 20%',
              description: '안정적인 자산 비중을 높인 포트폴리오입니다.',
            },
            {
              key: '2',
              label: '주식 100%',
              description: '성장 가능성은 높지만 주식에만 투자합니다.',
            },
            {
              key: '3',
              label: '예금 40%, 주식 40%, 채권 20%',
              description: '안정성과 성장의 균형을 갖춘 최적의 포트폴리오입니다.',
            },
            {
              key: '4',
              label: '채권 100%',
              description: '안정적인 수익을 목표로 채권에만 투자합니다.',
            },
          ],
          correctKey: '3',
          explanation: '소득이 늘어도 리스크 성향이 그대로라면 균형형 배분이 더 적절합니다.',
        },
        {
          stepId: 9003,
          order: 3,
          paperTitle: '포트폴리오 추천서',
          prompt:
            '비상금은 어느 정도 모였고, 남은 돈을 조금 더 적극적으로 굴리고 싶습니다. 그래도 크게 흔들리는 건 싫어요.',
          options: [
            {
              key: '1',
              label: '예금 80%, 주식 20%',
              description: '안정적인 자산 비중을 높인 포트폴리오입니다.',
            },
            {
              key: '2',
              label: '주식 100%',
              description: '성장 가능성은 높지만 주식에만 투자합니다.',
            },
            {
              key: '3',
              label: '예금 40%, 주식 40%, 채권 20%',
              description: '안정성과 성장의 균형을 갖춘 최적의 포트폴리오입니다.',
            },
            {
              key: '4',
              label: '채권 100%',
              description: '안정적인 수익을 목표로 채권에만 투자합니다.',
            },
          ],
          correctKey: '3',
          explanation: '적극적이되 흔들림을 싫어한다면 균형형이 적합합니다.',
        },
      ],
    },
  },
}

/** 시나리오 포인트 중복 지급 방지 — scenarioId */

export const MOCK_SCENARIO_POINT_GRANTED = new Set()
