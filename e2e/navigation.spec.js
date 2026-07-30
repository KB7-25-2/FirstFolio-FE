import { test, expect } from '@playwright/test'

test.describe('로그인 · 홈 네비게이션 (UI)', () => {
  test('로그인 화면에 firstfolio 브랜딩이 보인다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/firstfolio|로그인|입장/i).first()).toBeVisible()
  })

  test('홈에서 하단 Navbar 탭이 보인다', async ({ page }) => {
    await page.goto('/home')

    const nav = page.getByRole('navigation')
    await expect(nav.getByRole('button', { name: '홈', exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: '학습', exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: '포트폴리오', exact: true })).toBeVisible()
    await expect(nav.getByRole('button', { name: '상점', exact: true })).toBeVisible()
  })

  test('Navbar로 학습 탭 이동이 된다', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('navigation').getByRole('button', { name: '학습', exact: true }).click()
    await expect(page).toHaveURL(/\/learning/)
  })
})
