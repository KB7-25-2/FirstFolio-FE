/**
 * 학습 E2E — BE 없이 roadmap / continue / 강좌 / 퀴즈 stub
 *
 * - roadmap / continue: in-memory 진도로 응답 (목업 서비스 제거 대응)
 * - sub-chapters: 강좌 JSON + 진도 (page-1, page-2, page-final)
 * - quiz-attempts: 소단원·대단원 응시·채점
 */

/** @typedef {{ status: string, last_page_id: string | null, content_version_id: number }} ProgressRow */

/** @type {Record<number, { sub_chapter_id: number, main_chapter_id: number, title: string, content_version_id: number, questionIds: number[], progress: ProgressRow }>} */
const SUB_CHAPTER_FIXTURES = {
  103: {
    sub_chapter_id: 103,
    main_chapter_id: 2,
    title: '금리의 이해',
    content_version_id: 303,
    questionIds: [1021, 1022, 1023],
    progress: { status: 'IN_PROGRESS', last_page_id: 'page-2', content_version_id: 303 },
  },
  104: {
    sub_chapter_id: 104,
    main_chapter_id: 2,
    title: '예금자 보호 제도',
    content_version_id: 304,
    questionIds: [1031, 1032, 1033],
    progress: { status: 'NOT_STARTED', last_page_id: null, content_version_id: 304 },
  },
  105: {
    sub_chapter_id: 105,
    main_chapter_id: 2,
    title: '저축 목표 세우기',
    content_version_id: 305,
    questionIds: [1041, 1042, 1043],
    progress: { status: 'NOT_STARTED', last_page_id: null, content_version_id: 305 },
  },
  201: {
    sub_chapter_id: 201,
    main_chapter_id: 3,
    title: '채권이란',
    content_version_id: 401,
    questionIds: [2011, 2012, 2013],
    progress: { status: 'NOT_STARTED', last_page_id: null, content_version_id: 401 },
  },
}

/** chapter 2 선행 완료 교시 (강좌 stub 없이 로드맵만) */
const CHAPTER2_PRIOR = [
  { sub_chapter_id: 101, title: '예금이란', content_version_id: 301 },
  { sub_chapter_id: 102, title: '예금의 종류', content_version_id: 302 },
]

/** 소단원 퀴즈 정답 key (E2E mock 문항 choices[0]과 동기) */
export const QUIZ_ANSWER_KEYS = {
  103: ['2', '3', '1'],
  104: ['2', '3', '2'],
  105: ['1', '2', '2'],
}

const PAGE_TITLES = {
  'page-1': '개념 정리',
  'page-2': '핵심 포인트',
  'page-final': '마무리',
}

const MAIN_CHAPTER_QUIZ_ATTEMPT_ID = 9201
const MAIN_CHAPTER_QUIZ_QUESTION_COUNT = 3
const SUB_CHAPTER_QUIZ_ATTEMPT_BASE = 8100

/** E2E 대단원 시나리오 퀴즈 mock 정답 key (buildMainChapterQuizQuestions choices[0]) */
export const MAIN_CHAPTER_SCENARIO_CORRECT_KEY = '1'
export const MAIN_CHAPTER_SCENARIO_QUESTION_COUNT = MAIN_CHAPTER_QUIZ_QUESTION_COUNT

const buildMainChapterQuizQuestions = (mainChapterId) =>
  Array.from({ length: MAIN_CHAPTER_QUIZ_QUESTION_COUNT }, (_, index) => ({
    question_id: 9200 + index,
    question_type: 'SINGLE_CHOICE',
    generation_type: 'MAIN_CHAPTER',
    prompt: `E2E 대단원 퀴즈 ${index + 1}번`,
    choices: [
      { key: '1', label: '예금 40%, 주식 40%, 채권 20%' },
      { key: '2', label: '주식 100%' },
    ],
    display_order: index + 1,
    main_chapter_id: mainChapterId,
  }))

/**
 * @param {number} subChapterId
 * @param {number[]} questionIds
 * @param {string[]} answerKeys
 */
const buildSubChapterQuizQuestions = (subChapterId, questionIds, answerKeys) =>
  questionIds.map((questionId, index) => ({
    question_id: questionId,
    question_type: 'SINGLE_CHOICE',
    generation_type: 'SUB_CHAPTER',
    prompt: `E2E 소단원 ${subChapterId} 퀴즈 ${index + 1}번`,
    choices: [
      { key: '1', label: '선택지 1' },
      { key: '2', label: '선택지 2' },
      { key: '3', label: '선택지 3' },
      { key: '4', label: '선택지 4' },
    ],
    display_order: index + 1,
    sub_chapter_id: subChapterId,
    _correct_key: answerKeys[index] ?? '1',
  }))

/**
 * @param {number} subChapterId
 * @param {number[]} questionIds
 */
const buildLessonJson = (subChapterId, questionIds) => ({
  schemaVersion: 1,
  pages: ['page-1', 'page-2', 'page-final'].map((id, index) => ({
    id,
    title: PAGE_TITLES[id],
    blocks: [
      {
        type: 'text',
        content: `E2E ${subChapterId} · ${PAGE_TITLES[id]} (${index + 1}/3)`,
      },
    ],
    order: index + 1,
  })),
  subChapterQuiz: { questionIds },
})

/**
 * @param {number} subChapterId
 */
const getFixture = (subChapterId) => SUB_CHAPTER_FIXTURES[subChapterId] ?? null

/**
 * @param {import('@playwright/test').Request} request
 */
const readJsonBody = (request) => {
  try {
    return request.postDataJSON?.() ?? {}
  } catch {
    const raw = request.postData()
    if (!raw) return {}
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
}

/**
 * @param {string} url
 */
const parseSubChapterRoute = (url) => {
  const pathname = new URL(url).pathname
  const progressMatch = pathname.match(/\/learning\/sub-chapters\/(\d+)\/progress$/)
  if (progressMatch) {
    return { subChapterId: Number(progressMatch[1]), kind: 'progress' }
  }
  const lessonMatch = pathname.match(/\/learning\/sub-chapters\/(\d+)$/)
  if (lessonMatch) {
    return { subChapterId: Number(lessonMatch[1]), kind: 'lesson' }
  }
  return null
}

/**
 * @param {ProgressRow} progress
 * @param {boolean} isCurrent
 */
const toScheduleStatus = (progress, isCurrent) => {
  if (progress.status === 'COMPLETED') return 'COMPLETED'
  if (!isCurrent) return 'LOCKED'
  return progress.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NEXT'
}

/**
 * @param {import('@playwright/test').Page} page
 */
export const mockLearningApis = async (page) => {
  /** @type {Record<number, ProgressRow>} */
  const progressBySubChapter = {
    101: { status: 'COMPLETED', last_page_id: 'page-final', content_version_id: 301 },
    102: { status: 'COMPLETED', last_page_id: 'page-final', content_version_id: 302 },
    ...Object.fromEntries(
      Object.entries(SUB_CHAPTER_FIXTURES).map(([id, row]) => [Number(id), { ...row.progress }]),
    ),
  }

  let chapter2ScenarioCompleted = false
  /** @type {{ attemptId: number, quizType: 'SUB_CHAPTER' | 'MAIN_CHAPTER', subChapterId?: number, mainChapterId?: number, answered: number, total: number, correctKeys: string[], questionIds: number[] } | null} */
  let activeAttempt = null

  const chapter2LessonIds = [...CHAPTER2_PRIOR.map((r) => r.sub_chapter_id), 103, 104, 105]

  const allChapter2LessonsCompleted = () =>
    chapter2LessonIds.every((id) => progressBySubChapter[id]?.status === 'COMPLETED')

  const findContinueTarget = () => {
    if (chapter2ScenarioCompleted) {
      return {
        curriculum_item_id: 503,
        main_chapter_id: 3,
        sub_chapter_id: 201,
        content_version_id: 401,
        last_page_id: null,
        progress_percent: 0,
        route: '/learning/sub-chapters/201',
      }
    }

    for (const id of [103, 104, 105]) {
      const progress = progressBySubChapter[id]
      if (progress?.status !== 'COMPLETED') {
        const fixture = SUB_CHAPTER_FIXTURES[id]
        const pageId = progress?.last_page_id ?? 'page-1'
        return {
          curriculum_item_id: 502,
          main_chapter_id: 2,
          sub_chapter_id: id,
          content_version_id: fixture.content_version_id,
          last_page_id: progress?.last_page_id ?? null,
          progress_percent: progress?.status === 'IN_PROGRESS' ? 50 : 0,
          route: `/learning/sub-chapters/${id}?page=${pageId}`,
        }
      }
    }

    return {
      curriculum_item_id: 502,
      main_chapter_id: 2,
      sub_chapter_id: null,
      content_version_id: null,
      last_page_id: null,
      progress_percent: 100,
      route: '/learning?mainChapterId=2',
    }
  }

  const buildRoadmapItems = () => {
    let currentAssigned = false
    const chapter2Subs = [
      ...CHAPTER2_PRIOR.map((row) => ({
        ...row,
        progress: progressBySubChapter[row.sub_chapter_id],
      })),
      ...[103, 104, 105].map((id) => ({
        sub_chapter_id: id,
        title: SUB_CHAPTER_FIXTURES[id].title,
        content_version_id: SUB_CHAPTER_FIXTURES[id].content_version_id,
        progress: progressBySubChapter[id],
      })),
    ].map((row, index) => {
      const progress = row.progress
      const isCurrent = !currentAssigned && progress.status !== 'COMPLETED'
      if (isCurrent) currentAssigned = true
      return {
        sub_chapter_id: row.sub_chapter_id,
        title: row.title,
        display_order: index + 1,
        description: `${index + 1}교시`,
        progress_status: progress.status,
        schedule_status: toScheduleStatus(progress, isCurrent),
        last_page_id: progress.last_page_id,
        progress_content_version_id: progress.content_version_id,
        content_available: true,
        completed_at: progress.status === 'COMPLETED' ? '2026-07-06T12:00:00' : null,
        started_at: progress.status === 'NOT_STARTED' ? null : '2026-07-05T16:00:00',
      }
    })

    const quizAvailable = allChapter2LessonsCompleted() && !chapter2ScenarioCompleted

    return [
      {
        curriculum_item_id: 501,
        main_chapter_id: 1,
        title: '포트폴리오 기초',
        chapter_type: 'FOUNDATION',
        display_order: 1,
        status: 'COMPLETED',
        completed_at: '2026-06-20T12:00:00',
        progress_percent: 100,
        sub_chapters: [],
        main_chapter_quiz: { available: false, status: 'COMPLETED' },
      },
      {
        curriculum_item_id: 502,
        main_chapter_id: 2,
        title: '예·적금',
        chapter_type: 'ASSET',
        display_order: 2,
        status: chapter2ScenarioCompleted
          ? 'COMPLETED'
          : allChapter2LessonsCompleted()
            ? 'IN_PROGRESS'
            : 'ACTIVE',
        completed_at: chapter2ScenarioCompleted ? '2026-07-10T12:00:00' : null,
        progress_percent: chapter2ScenarioCompleted
          ? 100
          : Math.round(
              (chapter2LessonIds.filter((id) => progressBySubChapter[id]?.status === 'COMPLETED')
                .length /
                chapter2LessonIds.length) *
                100,
            ),
        sub_chapters: chapter2Subs,
        main_chapter_quiz: {
          available: quizAvailable || chapter2ScenarioCompleted,
          status: chapter2ScenarioCompleted ? 'COMPLETED' : 'NOT_STARTED',
        },
      },
      {
        curriculum_item_id: 503,
        main_chapter_id: 3,
        title: '채권',
        chapter_type: 'ASSET',
        display_order: 3,
        status: chapter2ScenarioCompleted ? 'ACTIVE' : 'LOCKED',
        completed_at: null,
        progress_percent: 0,
        sub_chapters: chapter2ScenarioCompleted
          ? [
              {
                sub_chapter_id: 201,
                title: '채권이란',
                display_order: 1,
                description: '1교시',
                progress_status: progressBySubChapter[201].status,
                schedule_status:
                  progressBySubChapter[201].status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
                last_page_id: progressBySubChapter[201].last_page_id,
                progress_content_version_id: progressBySubChapter[201].content_version_id,
                content_available: true,
                completed_at: null,
                started_at: null,
              },
            ]
          : [],
        main_chapter_quiz: { available: false, status: 'NOT_STARTED' },
      },
    ]
  }

  await page.route(
    (url) => url.pathname === '/api/learning/roadmap',
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { items: buildRoadmapItems() } }),
      })
    },
  )

  await page.route(
    (url) => url.pathname === '/api/learning/continue',
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: findContinueTarget() }),
      })
    },
  )

  await page.route(
    (url) => url.pathname === '/api/curriculum',
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            items: buildRoadmapItems().map(
              ({
                curriculum_item_id,
                main_chapter_id,
                title,
                chapter_type,
                display_order,
                status,
                completed_at,
                progress_percent,
              }) => ({
                curriculum_item_id,
                main_chapter_id,
                title,
                chapter_type,
                display_order,
                status,
                completed_at,
                progress_percent,
              }),
            ),
          },
        }),
      })
    },
  )

  await page.route(/\/api\/learning\/main-chapters\/\d+\/quiz-attempts$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }

    const mainChapterId = Number(
      route
        .request()
        .url()
        .match(/main-chapters\/(\d+)/)?.[1],
    )
    activeAttempt = {
      attemptId: MAIN_CHAPTER_QUIZ_ATTEMPT_ID,
      quizType: 'MAIN_CHAPTER',
      mainChapterId,
      answered: 0,
      total: MAIN_CHAPTER_QUIZ_QUESTION_COUNT,
      correctKeys: Array(MAIN_CHAPTER_QUIZ_QUESTION_COUNT).fill(MAIN_CHAPTER_SCENARIO_CORRECT_KEY),
      questionIds: Array.from({ length: MAIN_CHAPTER_QUIZ_QUESTION_COUNT }, (_, i) => 9200 + i),
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          attempt_id: MAIN_CHAPTER_QUIZ_ATTEMPT_ID,
          quiz_type: 'MAIN_CHAPTER',
          main_chapter_id: mainChapterId,
          status: 'IN_PROGRESS',
          question_count: MAIN_CHAPTER_QUIZ_QUESTION_COUNT,
          questions: buildMainChapterQuizQuestions(mainChapterId),
        },
      }),
    })
  })

  await page.route(
    (url) => /\/api\/learning\/sub-chapters\/\d+\/quiz-attempts$/.test(url.pathname),
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }

      const subChapterId = Number(
        route
          .request()
          .url()
          .match(/sub-chapters\/(\d+)/)?.[1],
      )
      const fixture = getFixture(subChapterId)
      if (!fixture) {
        await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not found' }) })
        return
      }

      const answerKeys = QUIZ_ANSWER_KEYS[subChapterId] ?? ['1', '1', '1']
      const questions = buildSubChapterQuizQuestions(subChapterId, fixture.questionIds, answerKeys)
      const attemptId = SUB_CHAPTER_QUIZ_ATTEMPT_BASE + subChapterId
      activeAttempt = {
        attemptId,
        quizType: 'SUB_CHAPTER',
        subChapterId,
        answered: 0,
        total: questions.length,
        correctKeys: answerKeys,
        questionIds: fixture.questionIds,
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            attempt_id: attemptId,
            quiz_type: 'SUB_CHAPTER',
            sub_chapter_id: subChapterId,
            content_version_id: fixture.content_version_id,
            status: 'IN_PROGRESS',
            question_count: questions.length,
            questions: questions.map(({ _correct_key, ...q }) => q),
          },
        }),
      })
    },
  )

  await page.route(/\/api\/learning\/quiz-attempts\/\d+\/answers\/\d+$/, async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue()
      return
    }

    const questionId = Number(
      route
        .request()
        .url()
        .match(/answers\/(\d+)/)?.[1],
    )
    const body = readJsonBody(route.request())
    const selectedKey = String(body?.answer?.key ?? body?.selected_key ?? '1')

    if (!activeAttempt) {
      await route.fulfill({
        status: 404,
        body: JSON.stringify({ message: 'No active attempt' }),
      })
      return
    }

    const qIndex = activeAttempt.questionIds.indexOf(questionId)
    const correctKey =
      qIndex >= 0 ? activeAttempt.correctKeys[qIndex] : MAIN_CHAPTER_SCENARIO_CORRECT_KEY
    const isCorrect = selectedKey === String(correctKey)
    activeAttempt.answered += 1
    const isFinalAnswer = activeAttempt.answered >= activeAttempt.total
    const isMainFinal = activeAttempt.quizType === 'MAIN_CHAPTER' && isFinalAnswer && isCorrect

    if (isMainFinal) {
      chapter2ScenarioCompleted = true
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          attempt_id: activeAttempt.attemptId,
          question_id: questionId,
          selected_key: selectedKey,
          is_correct: isCorrect,
          correct_answer: { key: correctKey },
          explanation: 'E2E 채점 해설입니다.',
          attempt: {
            status: isFinalAnswer ? 'GRADED' : 'IN_PROGRESS',
            answered_count: activeAttempt.answered,
            total_count: activeAttempt.total,
            correct_count: activeAttempt.answered,
            completed: isFinalAnswer,
            score: isFinalAnswer ? 100 : null,
          },
          reward: isFinalAnswer ? { points: 10 } : null,
          main_chapter_completed: isMainFinal,
          next_action: isMainFinal ? 'OPEN_NEXT_MAIN_CHAPTER' : null,
        },
      }),
    })
  })

  await page.route(/\/api\/learning\/sub-chapters\/\d+(?:\/progress)?$/, async (route) => {
    const parsed = parseSubChapterRoute(route.request().url())
    if (!parsed) {
      await route.continue()
      return
    }

    const fixture = getFixture(parsed.subChapterId)
    if (!fixture) {
      await route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not found' }) })
      return
    }

    const method = route.request().method()
    const progress = progressBySubChapter[parsed.subChapterId] ?? fixture.progress

    if (parsed.kind === 'progress' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sub_chapter_id: parsed.subChapterId,
            content_version_id: progress.content_version_id,
            last_page_id: progress.last_page_id,
            status: progress.status,
            started_at: progress.status === 'NOT_STARTED' ? null : '2026-07-05T16:00:00',
            completed_at: progress.status === 'COMPLETED' ? '2026-07-06T12:00:00' : null,
          },
        }),
      })
      return
    }

    if (parsed.kind === 'progress' && method === 'PUT') {
      const body = readJsonBody(route.request())
      progressBySubChapter[parsed.subChapterId] = {
        content_version_id:
          body.content_version_id ?? body.contentVersionId ?? progress.content_version_id,
        last_page_id: body.last_page_id ?? body.lastPageId ?? progress.last_page_id,
        status: body.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
      }
      const next = progressBySubChapter[parsed.subChapterId]
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sub_chapter_id: parsed.subChapterId,
            content_version_id: next.content_version_id,
            last_page_id: next.last_page_id,
            status: next.status,
            updated: true,
            completed_at: next.status === 'COMPLETED' ? '2026-07-06T12:00:00' : null,
          },
        }),
      })
      return
    }

    if (parsed.kind === 'lesson' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            sub_chapter_id: fixture.sub_chapter_id,
            main_chapter_id: fixture.main_chapter_id,
            title: fixture.title,
            content_version_id: fixture.content_version_id,
            schema_version: 1,
            lesson: buildLessonJson(fixture.sub_chapter_id, fixture.questionIds),
            progress: {
              status: progress.status,
              last_page_id: progress.last_page_id,
              completed_at: progress.status === 'COMPLETED' ? '2026-07-06T12:00:00' : null,
            },
          },
        }),
      })
      return
    }

    await route.continue()
  })
}

/**
 * @param {import('@playwright/test').Page} page
 */
export const resolveQuizAnswerKeys = async (page) => {
  const match = page.url().match(/\/learning\/sub-chapters\/(\d+)/)
  const subChapterId = match ? Number(match[1]) : 103
  return QUIZ_ANSWER_KEYS[subChapterId] ?? QUIZ_ANSWER_KEYS[103]
}
