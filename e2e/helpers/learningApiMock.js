/**
 * 학습 E2E — BE 없이 studyService mock과 맞춘 API stub
 *
 * - roadmap / continue: abort → DEV in-memory mock (퀴즈·시나리오 수료 후 상태 반영)
 * - sub-chapters: 강좌 JSON + 진도 (page-1, page-2, page-final)
 * - quiz-attempts: abort → mock 문항 폴백
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
}

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
 * @param {import('@playwright/test').Page} page
 */
export const mockLearningApis = async (page) => {
  /** @type {Record<number, ProgressRow>} */
  const progressBySubChapter = Object.fromEntries(
    Object.entries(SUB_CHAPTER_FIXTURES).map(([id, row]) => [Number(id), { ...row.progress }]),
  )
  let answeredMainChapterQuizCount = 0

  await page.route(
    (url) => url.pathname === '/api/learning/roadmap',
    (route) => route.abort('failed'),
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
    answeredMainChapterQuizCount = 0
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

  await page.route(/\/api\/learning\/quiz-attempts\/\d+\/answers\/\d+$/, async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.continue()
      return
    }

    answeredMainChapterQuizCount += 1
    const isFinalAnswer = answeredMainChapterQuizCount === MAIN_CHAPTER_QUIZ_QUESTION_COUNT
    const questionId = Number(
      route
        .request()
        .url()
        .match(/answers\/(\d+)/)?.[1],
    )
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          attempt_id: MAIN_CHAPTER_QUIZ_ATTEMPT_ID,
          question_id: questionId,
          selected_key: '1',
          is_correct: true,
          correct_answer: { key: '1' },
          explanation: '균형 잡힌 포트폴리오입니다.',
          attempt: {
            status: isFinalAnswer ? 'GRADED' : 'IN_PROGRESS',
            answered_count: answeredMainChapterQuizCount,
            total_count: MAIN_CHAPTER_QUIZ_QUESTION_COUNT,
            correct_count: answeredMainChapterQuizCount,
            completed: isFinalAnswer,
          },
          main_chapter_completed: isFinalAnswer,
          next_action: isFinalAnswer ? 'OPEN_NEXT_MAIN_CHAPTER' : null,
        },
      }),
    })
  })
  await page.route(
    (url) => url.pathname === '/api/learning/continue',
    (route) => route.abort('failed'),
  )
  await page.route(
    (url) => /\/api\/learning\/sub-chapters\/\d+\/quiz-attempts$/.test(url.pathname),
    (route) => route.abort('failed'),
  )

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
      const body = route.request().postDataJSON?.() ?? {}
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
