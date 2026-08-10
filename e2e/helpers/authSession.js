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

/**
 * @param {import('@playwright/test').Page} page
 * @param {OnboardingStep} onboardingStep
 * @param {{ levelTestCompleted?: boolean, curriculumConfirmed?: boolean, token?: string }} [options]
 */
export const seedOnboardingSession = async (page, onboardingStep, options = {}) => {
  const { levelTestCompleted = false, curriculumConfirmed = false, token = E2E_TOKEN } = options

  await mockUserProfileApi(page)
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
 * 온보딩 완료(HOME) 사용자 — /home·학습·뉴스 등 인증 필요 E2E용
 * @param {import('@playwright/test').Page} page
 */
export const seedHomeSession = async (page) => {
  await seedOnboardingSession(page, 'HOME', {
    levelTestCompleted: true,
    curriculumConfirmed: true,
  })
}

/**
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {string} [reason]
 */
export const skipUnlessChromium = (testInfo, reason = '세션 시드 — chromium만') => {
  testInfo.skip(testInfo.project.name !== 'chromium', reason)
}
