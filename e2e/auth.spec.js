import { test, expect } from '@playwright/test'

/**
 * 인증 플로우 E2E
 * — Google 실제 OAuth 팝업은 CI에서 재현이 어려워 UI·에러 경로·이메일 목업·스토어 목을 검증한다.
 */

const clearAuthAndOpenLogin = async (page) => {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/login')
  await expect(page.locator('#login-email')).toBeVisible()
}

/**
 * Pinia auth 스토어의 loginWithGoogle만 교체한다.
 * @param {import('@playwright/test').Page} page
 * @param {'success-level-test' | 'success-curriculum' | 'signup-required'} scenario
 */
const mockGoogleLoginOnStore = async (page, scenario) => {
  await page.evaluate((scenarioName) => {
    const app = document.querySelector('#app')?.__vue_app__
    const pinia = app?.config?.globalProperties?.$pinia
    const store = pinia?._s?.get('auth')

    if (!store) {
      throw new Error('auth store를 찾을 수 없습니다.')
    }

    const tokenKey = 'access_token'

    if (scenarioName === 'success-level-test') {
      store.loginWithGoogle = async () => {
        localStorage.setItem(tokenKey, 'e2e-google-id-token')
        return {
          user: { userId: 1, nickname: '테스트', roleCode: 'USER' },
          onboardingStep: 'LEVEL_TEST',
        }
      }
      return
    }

    if (scenarioName === 'success-curriculum') {
      store.loginWithGoogle = async () => {
        localStorage.setItem(tokenKey, 'e2e-google-id-token')
        return {
          user: { userId: 1, nickname: '테스트', roleCode: 'USER' },
          onboardingStep: 'CURRICULUM',
        }
      }
      return
    }

    if (scenarioName === 'signup-required') {
      store.loginWithGoogle = async () => {
        const err = new Error('FirstFolio 회원 정보가 없습니다. 회원가입을 진행해 주세요.')
        err.code = 'SIGNUP_REQUIRED'
        err.status = 409
        throw err
      }
    }
  }, scenario)
}

test.describe('인증 · 로그인/회원가입 (UI)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthAndOpenLogin(page)
  })

  test('로그인 화면에 회원 확인 신청서와 Google 로그인 카드가 보인다', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '회원 확인 신청서' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Google로 로그인하기/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /입장하기/ })).toBeVisible()
    await expect(page.locator('#login-email')).toBeVisible()
    await expect(page.locator('#login-password')).toBeVisible()
  })

  test('회원가입 탭에서 Google·이메일 등록 방식을 선택할 수 있다', async ({ page }) => {
    await page.getByRole('button', { name: '회원가입', exact: true }).click()

    await expect(page.getByRole('heading', { name: '등록 방식 선택' })).toBeVisible()
    await expect(page.getByRole('button', { name: /외부 계정 연동 \(Google\)/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /이메일로 계속하기/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /다음 장으로/ })).toBeVisible()
  })

  test('이메일 방식 선택 후 회원 등록 신청서 폼이 보인다', async ({ page }) => {
    await page.getByRole('button', { name: '회원가입', exact: true }).click()
    await page.getByRole('button', { name: /이메일로 계속하기/ }).click()
    await page.getByRole('button', { name: /다음 장으로/ }).click()

    await expect(page.getByRole('heading', { name: '회원 등록 신청서' })).toBeVisible()
    await expect(page.locator('#signup-nickname')).toBeVisible()
    await expect(page.locator('#signup-email')).toBeVisible()
    await expect(page.locator('#signup-password')).toBeVisible()
    await expect(page.locator('#signup-password-confirm')).toBeVisible()
  })

  test('비밀번호 찾기 클릭 시 준비 중 메시지가 보인다', async ({ page }) => {
    await page.getByRole('button', { name: /비밀번호를 잊으셨습니까/ }).click()
    await expect(page.getByText('비밀번호 찾기는 준비 중입니다.')).toBeVisible()
  })
})

test.describe('이메일 로그인 (목업)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthAndOpenLogin(page)
  })

  test('이메일·비밀번호 입력 후 입장하면 온보딩 또는 홈으로 이동한다', async ({ page }) => {
    await page.locator('#login-email').fill('student@example.com')
    await page.locator('#login-password').fill('password123')
    await page.getByRole('button', { name: /입장하기/ }).click()

    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/(home|onboarding)/)
  })

  test('이메일 없이 입장하면 로그인 화면에 머무른다', async ({ page }) => {
    await page.locator('#login-password').fill('password123')
    await page.getByRole('button', { name: /입장하기/ }).click()

    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Google 로그인 (에러 경로)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthAndOpenLogin(page)
  })

  test('Firebase 인증 요청이 실패하면 에러 메시지가 보인다', async ({ page }) => {
    await page.route('**/identitytoolkit.googleapis.com/**', (route) => route.abort())
    await page.route('**/securetoken.googleapis.com/**', (route) => route.abort())
    await page.route('**/accounts.google.com/**', (route) => route.abort())

    await page.getByRole('button', { name: /Google로 로그인하기/ }).click()

    await expect(page.locator('p.text-red-400')).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Google 로그인 API 목 (성공·SIGNUP_REQUIRED)', () => {
  test.describe.configure({ mode: 'serial' })

  test('성공(LEVEL_TEST) 시 온보딩 intro로 이동한다', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Pinia 스토어 패치 — chromium만')
    await clearAuthAndOpenLogin(page)
    await mockGoogleLoginOnStore(page, 'success-level-test')

    await page.getByRole('button', { name: /Google로 로그인하기/ }).click()
    await expect(page).toHaveURL(/\/onboarding\/intro/, { timeout: 15_000 })
  })

  test('성공(CURRICULUM) 시 커리큘럼 온보딩으로 이동한다', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Pinia 스토어 패치 — chromium만')
    await clearAuthAndOpenLogin(page)
    await page.evaluate(() => {
      localStorage.setItem('level_test_state', JSON.stringify({ completed: true, attempt: null }))
    })
    await mockGoogleLoginOnStore(page, 'success-curriculum')

    await page.getByRole('button', { name: /Google로 로그인하기/ }).click()
    await expect(page).toHaveURL(/\/onboarding\/curriculum/, { timeout: 15_000 })
  })

  test('SIGNUP_REQUIRED 시 회원가입 탭으로 전환된다', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Pinia 스토어 패치 — chromium만')
    await clearAuthAndOpenLogin(page)
    await mockGoogleLoginOnStore(page, 'signup-required')

    await page.getByRole('button', { name: /Google로 로그인하기/ }).click()

    await expect(page.getByRole('heading', { name: '등록 방식 선택' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/회원 정보가 없습니다/)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
