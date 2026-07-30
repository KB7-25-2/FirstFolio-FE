import { test, expect } from '@playwright/test'

test.describe('로그인 · 홈 네비게이션 (UI)', () => {
  test('로그인 화면에 firstfolio 브랜딩이 보인다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/firstfolio|로그인|입장/i).first()).toBeVisible()
  })

  test('홈에서 하단 Navbar 탭이 보인다', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByRole('button', { name: '홈' })).toBeVisible()
    await expect(page.getByRole('button', { name: '학습' })).toBeVisible()
    await expect(page.getByRole('button', { name: '포트폴리오' })).toBeVisible()
    await expect(page.getByRole('button', { name: '상점' })).toBeVisible()
  })

  test('Navbar로 학습 탭 이동이 된다', async ({ page }) => {
    await page.goto('/home')
    await page.getByRole('button', { name: '학습' }).click()
    await expect(page).toHaveURL(/\/learning/)
  })
})
