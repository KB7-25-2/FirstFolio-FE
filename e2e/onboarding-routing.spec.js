import { test, expect } from '@playwright/test'

/**
 * 온보딩 라우팅 E2E
 * — POST /auth/login onboarding_step(LEVEL_TEST | CURRICULUM | HOME) 기준 가드 분기 검증
 * — Pinia 패치 없이 sessionStorage + access_token으로 세션 시드
 */

const E2E_TOKEN = 'e2e-onboarding-routing-token'

/**
 * @param {import('@playwright/test').Page} page
 */
const mockUserProfileApi = async (page) => {
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
 * @param {'LEVEL_TEST' | 'CURRICULUM' | 'HOME'} onboardingStep
 * @param {{ levelTestCompleted?: boolean, curriculumConfirmed?: boolean }} [options]
 */
const seedOnboardingSession = async (page, onboardingStep, options = {}) => {
  const { levelTestCompleted = false, curriculumConfirmed = false } = options

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
      token: E2E_TOKEN,
      step: onboardingStep,
      levelTestCompleted,
      curriculumConfirmed,
    },
  )
}

const skipUnlessChromium = (testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', '세션 시드 — chromium만')
}

test.describe('온보딩 라우팅 · 인증 가드', () => {
  test('미인증 사용자가 /home 접근 시 로그인으로 보낸다', async ({ page }) => {
    await page.goto('/home')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/redirect=\/home/)
  })

  test('LEVEL_TEST 사용자가 /home 접근 시 intro로 보낸다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedOnboardingSession(page, 'LEVEL_TEST')
    await page.goto('/home')

    await expect(page).toHaveURL(/\/onboarding\/intro/, { timeout: 15_000 })
    await expect(page.getByText('금융 공부, 이렇게 시작해요')).toBeVisible()
  })

  test('LEVEL_TEST 사용자가 result 직접 접근 시 quiz로 보낸다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedOnboardingSession(page, 'LEVEL_TEST')
    await page.goto('/onboarding/result')

    await expect(page).toHaveURL(/\/onboarding\/quiz/, { timeout: 15_000 })
    await expect(page.getByText('금융 기초 진단 시험')).toBeVisible()
  })

  test('LEVEL_TEST 사용자는 intro·quiz 온보딩 화면에 머무를 수 있다', async ({
    page,
  }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedOnboardingSession(page, 'LEVEL_TEST')

    await page.goto('/onboarding/intro')
    await expect(page).toHaveURL(/\/onboarding\/intro/)
    await expect(page.getByText('금융 공부, 이렇게 시작해요')).toBeVisible()

    await page.goto('/onboarding/quiz')
    await expect(page).toHaveURL(/\/onboarding\/quiz/)
    await expect(page.getByText('금융 기초 진단 시험')).toBeVisible()
  })

  test('CURRICULUM 사용자가 /home 접근 시 curriculum으로 보낸다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedOnboardingSession(page, 'CURRICULUM', { levelTestCompleted: true })
    await page.goto('/home')

    await expect(page).toHaveURL(/\/onboarding\/curriculum/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: '학습 순서를 정해보세요' })).toBeVisible()
  })

  test('CURRICULUM 사용자가 intro 접근 시 result로 보낸다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedOnboardingSession(page, 'CURRICULUM', { levelTestCompleted: true })
    await page.goto('/onboarding/intro')

    await expect(page).toHaveURL(/\/onboarding\/result/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: '금융 기초 진단 결과' })).toBeVisible()
  })

  test('HOME 사용자가 온보딩 접근 시 /home으로 보낸다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedOnboardingSession(page, 'HOME', {
      levelTestCompleted: true,
      curriculumConfirmed: true,
    })
    await page.goto('/onboarding/intro')

    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 })
    await expect(
      page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }),
    ).toBeVisible()
  })

  test('HOME 사용자는 /home에 머무를 수 있다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedOnboardingSession(page, 'HOME', {
      levelTestCompleted: true,
      curriculumConfirmed: true,
    })
    await page.goto('/home')

    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 })
    await expect(
      page.getByRole('navigation').getByRole('button', { name: '학습', exact: true }),
    ).toBeVisible()
  })

  test('HOME 사용자가 /login 접근 시 /home으로 보낸다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedOnboardingSession(page, 'HOME', {
      levelTestCompleted: true,
      curriculumConfirmed: true,
    })
    await page.goto('/login')

    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 })
  })
})

test.describe('온보딩 라우팅 · 로그인 redirect', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.goto('/login')
  })

  test('로그인 성공(HOME) 시 /home으로 이동한다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await mockUserProfileApi(page)
    await expect(page.locator('#login-email')).toBeVisible()

    await page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__
      const pinia = app?.config?.globalProperties?.$pinia
      const store = pinia?._s?.get('auth')
      if (!store) throw new Error('auth store를 찾을 수 없습니다.')

      store.loginWithEmail = async () => {
        localStorage.setItem('access_token', 'e2e-home-step-token')
        store.setOnboardingStep('HOME')
        return {
          user: { userId: 1, nickname: '완료유저', roleCode: 'USER' },
          onboardingStep: 'HOME',
        }
      }
    })

    await page.locator('#login-email').fill('done@example.com')
    await page.locator('#login-password').fill('password123')
    await page.getByRole('button', { name: /입장하기/ }).click()

    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 })
    await expect(page.evaluate(() => sessionStorage.getItem('onboarding_step'))).resolves.toBe(
      'HOME',
    )
  })
})
