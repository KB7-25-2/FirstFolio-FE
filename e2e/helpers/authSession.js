/** @typedef {'LEVEL_TEST' | 'CURRICULUM' | 'HOME'} OnboardingStep */

export const E2E_TOKEN = 'e2e-auth-token'

/**
 * @param {import('@playwright/test').Page} page
 */
export const mockUserProfileApi = async (page) => {
  await page.route('**/users/me', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          user_id: 1,
          email: 'e2e@example.com',
          nickname: 'E2E테스트',
          role_code: 'USER',
          newsletter_opt_in: false,
          point_balance: 0,
          created_at: '2024-01-01T00:00:00Z',
        },
      }),
    })
  })
}

/** 온보딩 화면이 사용하는 레벨 테스트·커리큘럼 API 기본 응답 */
export const mockOnboardingApis = async (page) => {
  const foundation = {
    main_chapter_id: 1,
    title: '포트폴리오 기초',
    source_type: 'FOUNDATION',
    display_order: 1,
    removable: false,
  }
  const recommended = {
    main_chapter_id: 2,
    title: '예·적금',
    source_type: 'LEVEL_TEST_WRONG',
    display_order: 2,
    removable: true,
  }

  await page.route('**/level-tests/attempts', async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          attempt_id: 2001,
          status: 'IN_PROGRESS',
          question_count: 1,
          questions: [
            {
              question_id: 1001,
              display_order: 1,
              main_chapter: { main_chapter_id: 2, asset_type: 'DEPOSIT_SAVINGS' },
              question_type: 'SINGLE_CHOICE',
              generation_type: 'HUMAN',
              prompt: '금리가 오르면 예금 이자는?',
              scenario: null,
              choices: [
                { key: 'A', label: '대체로 늘어난다' },
                { key: 'B', label: '대체로 줄어든다' },
              ],
            },
          ],
          answers: [],
        },
      }),
    })
  })

  await page.route('**/level-tests/attempts/2001/answers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          attempt_id: 2001,
          saved_answer_count: 1,
          answered_count: 1,
          total_count: 1,
          status: 'IN_PROGRESS',
          updated_at: '2026-08-12T05:00:00Z',
        },
      }),
    })
  })

  await page.route('**/level-tests/attempts/2001/submit', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          attempt_id: 2001,
          status: 'GRADED',
          question_results: [
            {
              question_id: 1001,
              main_chapter_id: 2,
              asset_type: 'DEPOSIT_SAVINGS',
              is_correct: false,
            },
          ],
          chapter_results: [
            {
              main_chapter_id: 2,
              asset_type: 'DEPOSIT_SAVINGS',
              total_count: 1,
              correct_count: 0,
              all_correct: false,
            },
          ],
          recommendations: [{ main_chapter_id: 2, source_type: 'LEVEL_TEST_WRONG' }],
          cart_candidates: [],
        },
      }),
    })
  })

  await page.route('**/curriculums/draft', async (route) => {
    const items = [foundation, recommended]
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data:
          route.request().method() === 'GET'
            ? {
                items,
                recommendation_candidates: [{ main_chapter_id: 2, title: '예·적금' }],
                cart_candidates: [],
              }
            : { items },
      }),
    })
  })

  await page.route('**/curriculums/confirm', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { items: [foundation, recommended] } }),
    })
  })
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {OnboardingStep} onboardingStep
 * @param {{ levelTestCompleted?: boolean, curriculumConfirmed?: boolean, token?: string }} [options]
 */
export const seedOnboardingSession = async (page, onboardingStep, options = {}) => {
  const { levelTestCompleted = false, curriculumConfirmed = false, token = E2E_TOKEN } = options

  await mockUserProfileApi(page)
  await mockOnboardingApis(page)
  await page.addInitScript(
    ({ token, step, levelTestCompleted, curriculumConfirmed }) => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('access_token', token)
      sessionStorage.setItem('onboarding_step', step)

      if (levelTestCompleted) {
        localStorage.setItem('level_test_state', JSON.stringify({ completed: true, attempt: null }))
      }

      if (curriculumConfirmed) {
        localStorage.setItem('curriculum_state', JSON.stringify({ confirmed: true }))
      }
    },
    {
      token,
      step: onboardingStep,
      levelTestCompleted,
      curriculumConfirmed,
    },
  )
}

/**
 * 홈 StudyNote용 dashboard만 stub.
 * GET /curriculum · /learning/continue 는 intercept 하지 않는다.
 * 학습 E2E는 studyService in-memory mock(채권 포함, 시나리오 수료 시 상태 갱신)을 써야 한다.
 * @param {import('@playwright/test').Page} page
 */
export const mockHomeStudyApis = async (page) => {
  await page.route('**/dashboard', async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          portfolio: { available: false, reason: 'NOT_STARTED' },
          daily_quest: { status: 'ASSIGNED', answered_count: 0, total_count: 5 },
          learning: {
            main_chapter_id: 2,
            sub_chapter_id: 103,
            progress_percent: 50,
          },
          upcoming_events: [],
          latest_news: [],
        },
      }),
    })
  })
}

/**
 * 온보딩 완료(HOME) 사용자 — /home·학습·뉴스 등 인증 필요 E2E용
 * @param {import('@playwright/test').Page} page
 */
export const seedHomeSession = async (page) => {
  await seedOnboardingSession(page, 'HOME', {
    levelTestCompleted: true,
    curriculumConfirmed: true,
  })
  await mockHomeStudyApis(page)
}

/**
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} [reason]
 */
export const skipUnlessChromium = (testInfo, reason = '세션 시드 — chromium만') => {
  testInfo.skip(testInfo.project.name !== 'chromium', reason)
}

/** 하단 Navbar (닫힌 Drawer의 메뉴 landmark와 구분) */
export const primaryNav = (page) => page.getByRole('navigation', { name: '주요 메뉴' })
