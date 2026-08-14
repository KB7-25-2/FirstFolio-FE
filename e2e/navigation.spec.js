import { test, expect } from '@playwright/test'
import { primaryNav, seedHomeSession, skipUnlessChromium } from './helpers/authSession.js'

test.describe('로그인 · 홈 네비게이션 (UI)', () => {
  test('로그인 화면에 firstfolio 브랜딩이 보인다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/firstfolio|로그인|입장/i).first()).toBeVisible()
  })

  test('홈에서 하단 Navbar 탭이 보인다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedHomeSession(page)
    await page.goto('/home')

    const nav = primaryNav(page)
    await expect(nav.getByRole('button', { name: '데일리', exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: '학습', exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: '홈', exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: '포트폴리오', exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: '상점', exact: true })).toBeVisible()
  })

  test('Navbar로 학습 탭 이동이 된다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedHomeSession(page)
    await page.goto('/home')
    await primaryNav(page).getByRole('button', { name: '학습', exact: true }).click()
    await expect(page).toHaveURL(/\/learning/)
  })

  test('존재하지 않는 경로에서 404 화면이 보인다', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-404')

    await expect(page.getByText('ERROR 404')).toBeVisible()
    await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible()
    await expect(page.getByRole('link', { name: '홈으로 돌아가기' })).toBeVisible()
  })

  test('비로그인 상태에서 404 홈 링크는 로그인으로 보낸다', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-404')
    await page.getByRole('link', { name: '홈으로 돌아가기' }).click()

    await expect(page).toHaveURL(/\/login/)
  })

  test('로그인 상태에서 404 홈 링크는 홈으로 보낸다', async ({ page }, testInfo) => {
    skipUnlessChromium(testInfo)
    await seedHomeSession(page)
    await page.goto('/this-route-does-not-exist-404')
    await page.getByRole('link', { name: '홈으로 돌아가기' }).click()

    await expect(page).toHaveURL(/\/home/)
  })
})
