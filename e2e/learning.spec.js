import { test, expect } from '@playwright/test'
import { seedHomeSession } from './helpers/authSession.js'

/**
 * 학습 플로우 E2E (이슈 G 수동 스모크 대응)
 *
 * studyService mock은 브라우저 모듈 상태라 full reload(page.goto) 시 초기화된다.
 * 같은 page에서 client-side 이동만 하며 chromium serial로 돌린다.
 */
test.describe('학습 플로우 (이어하기 · 수료)', () => {
  test.describe.configure({ mode: 'serial' })
  /** @type {import('@playwright/test').Page} */
  let page

  test.beforeAll(async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', '공유 mock 오염 방지 — chromium만')
    page = await browser.newPage()
    await seedHomeSession(page)
    await page.goto('/home')
    await expect(page.getByRole('button', { name: '이어서 →' })).toBeVisible({ timeout: 15_000 })
  })

  test.afterAll(async () => {
    await page?.close()
  })

  test('홈 StudyNote「이어서 →」가 강좌 page 쿼리로 진입한다', async () => {
    await page.getByRole('button', { name: '이어서 →' }).click()
    await expect(page).toHaveURL(/\/learning\/sub-chapters\/103/)
    await expect(page).toHaveURL(/page=page-2/)
    await expect(page.getByText('학습 화면')).toBeVisible()
  })

  test('강좌에서 이전·다음 컷 이동이 된다', async () => {
    await expect(page.getByRole('button', { name: '다음 컷 →' })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: '← 이전 컷' }).click()
    await expect(page).toHaveURL(/page=page-1/)

    await page.getByRole('button', { name: '다음 컷 →' }).click()
    await expect(page).toHaveURL(/page=page-2/)
  })

  test('퀴즈 수료 후 시간표에 완료·다음 교시가 반영된다', async () => {
    await finishLessonToQuiz(page)
    await completeSubChapterQuiz(page)

    await expect(page).toHaveURL(/\/learning\/main-chapters\/2/)
    await expect(page.getByRole('heading', { name: '학습 시간표' })).toBeVisible()

    const interestRow = page.locator('button').filter({ hasText: '금리의 이해' })
    await expect(interestRow).toContainText('완료')

    const nextLesson = page.locator('button').filter({ hasText: '예금자 보호 제도' })
    await expect(nextLesson).toContainText('다음')
    await expect(nextLesson).toBeEnabled()
  })

  test('남은 LESSON 수료 후 실전 퀴즈 CTA로 시나리오에 진입한다', async () => {
    test.setTimeout(120_000)

    for (const title of ['예금자 보호 제도', '저축 목표 세우기']) {
      await page.locator('button').filter({ hasText: title }).click()
      await expect(page).toHaveURL(/\/learning\/sub-chapters\//)
      await finishLessonToQuiz(page)
      await completeSubChapterQuiz(page)
      await expect(page).toHaveURL(/\/learning\/main-chapters\/2/)
    }

    const scenarioCta = page.locator('button').filter({ hasText: '예금 실전 퀴즈' })
    await expect(scenarioCta).toBeVisible({ timeout: 10_000 })
    await expect(scenarioCta).toContainText('시작')
    await scenarioCta.click()

    await expect(page).toHaveURL(/\/learning\/main-chapters\/2\/scenario-quiz/)
    await expect(page.getByRole('button', { name: /게임 시작/ })).toBeVisible({ timeout: 15_000 })
  })

  test('시나리오 수료 후 로드맵·이어하기가 다음 학습으로 갱신된다', async () => {
    test.setTimeout(90_000)
    await completeScenarioQuiz(page)

    await expect(page).toHaveURL(/\/learning\/?$/)
    await expect(page.getByRole('heading', { name: '학습 로드맵' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '예·적금' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '채권' })).toBeVisible()
    await expect(page.getByRole('button', { name: /진행 중.*채권/ })).toBeVisible()

    await page.getByRole('navigation').getByRole('button', { name: '홈', exact: true }).click()
    await expect(page).toHaveURL(/\/home/)

    const continueBtn = page.getByRole('button', { name: '이어서 →' })
    await expect(continueBtn).toBeVisible({ timeout: 15_000 })
    await continueBtn.click()
    await expect(page).toHaveURL(/\/learning\/main-chapters\/3/)
  })
})

/** 강좌 마지막 페이지까지 이동 후 퀴즈 진입 */
async function finishLessonToQuiz(page) {
  await expect(page.getByText('학습 화면')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('불러오는 중…')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByText('선행 학습이 필요합니다.')).toHaveCount(0)

  const primary = page.getByRole('button', { name: /다음 컷 →|퀴즈 풀기 →/ })
  await expect(primary).toBeEnabled({ timeout: 15_000 })

  for (let i = 0; i < 12; i += 1) {
    const quizBtn = page.getByRole('button', { name: '퀴즈 풀기 →' })
    if (await quizBtn.isVisible()) {
      await expect(quizBtn).toBeEnabled()
      await quizBtn.click()
      await expect(page).toHaveURL(/\/quiz/)
      return
    }
    const nextBtn = page.getByRole('button', { name: '다음 컷 →' })
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()
  }
  throw new Error('퀴즈 진입에 실패했다')
}

/** 소단원 퀴즈 전 문항 응시·결과 모달 → 시간표 */
async function completeSubChapterQuiz(page) {
  await expect(page.getByRole('heading', { name: '시험지' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('불러오는 중…')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByRole('button', { name: /①|②|③|④/ }).first()).toBeVisible({
    timeout: 15_000,
  })

  for (let q = 0; q < 8; q += 1) {
    const resultDialog = page.getByRole('dialog', { name: '시험 결과' })
    if (await resultDialog.isVisible()) break

    await answerUntilCorrect(page)
    const next = page.getByRole('button', { name: /다음 문항|결과 보기/ })
    await expect(next).toBeEnabled()
    await next.click()
  }

  const dialog = page.getByRole('dialog', { name: '시험 결과' })
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  await dialog.getByRole('button', { name: '학습 목록으로' }).click()
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function answerUntilCorrect(page) {
  for (let i = 0; i < 4; i += 1) {
    const retry = page.getByRole('button', { name: '다시 풀기' })
    if (await retry.isVisible()) {
      await retry.click()
      await expect(page.getByRole('button', { name: '정답 제출' })).toBeDisabled()
    }

    const option = page.getByRole('button', { name: new RegExp(`^[①②③④]`) }).nth(i)
    await expect(option).toBeVisible()
    await option.click()
    await page.getByRole('button', { name: '정답 제출' }).click()

    if (await page.getByRole('button', { name: /다음 문항|결과 보기/ }).isVisible()) {
      return
    }
  }
  throw new Error('퀴즈 정답을 찾지 못했다')
}

/** 시나리오 인트로 → 전 스텝 정답 → 수료증 → 로드맵 */
async function completeScenarioQuiz(page) {
  await page.getByRole('button', { name: /게임 시작/ }).click()

  for (let step = 0; step < 6; step += 1) {
    if (await page.getByRole('button', { name: '학습 로드맵으로' }).isVisible()) break

    const balanced = page.getByRole('button', { name: /예금 40%.*주식 40%.*채권 20%/ })
    await expect(balanced).toBeVisible({ timeout: 10_000 })
    await balanced.click()

    await page.getByRole('button', { name: /결과 확인/ }).click()

    const next = page.getByRole('button', { name: /다음 문항|결과 확인/ })
    await expect(next).toBeEnabled()
    await next.click()
  }

  await expect(page.getByRole('button', { name: '학습 로드맵으로' })).toBeVisible({
    timeout: 10_000,
  })
  await page.getByRole('button', { name: '학습 로드맵으로' }).click()
}
