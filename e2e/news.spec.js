import { test, expect } from '@playwright/test'

test.describe('홈 금융 뉴스 스크랩 (UI)', () => {
  test('홈에 뉴스 스크랩 섹션이 보인다', async ({ page }) => {
    await page.goto('/home')
    await expect(page.getByText('오늘의 금융 뉴스 스크랩')).toBeVisible()
  })

  test('뉴스 카드 제목과 이미지가 보인다', async ({ page }) => {
    await page.goto('/home')

    const section = page.getByRole('region', { name: '오늘의 금융 뉴스 스크랩' })
    await expect(section).toBeVisible()

    const firstCard = section.getByRole('button').first()
    await expect(firstCard.locator('h3')).not.toBeEmpty()
    await expect(firstCard.locator('img')).toBeVisible()
  })

  test('뉴스 카드를 클릭할 수 있다', async ({ page }) => {
    await page.goto('/home')

    const firstCard = page
      .getByRole('region', { name: '오늘의 금융 뉴스 스크랩' })
      .getByRole('button')
      .first()

    await expect(firstCard).toBeVisible()
    await firstCard.click()
  })
})
