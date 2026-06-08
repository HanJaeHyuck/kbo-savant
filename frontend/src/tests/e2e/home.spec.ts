import { test, expect } from '@playwright/test'

const MOCK_SEARCH_RESULT = [
  { id: 1, name: '이정후', team: '키움 히어로즈', position: 'CF' },
]

test.describe('홈 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 선수 검색 API 모킹
    await page.route('**/api/players/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SEARCH_RESULT),
      })
    })
    // 리더보드 API 모킹
    await page.route('**/api/leaderboard**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: 0, page: 1, per_page: 5, data: [] }),
      })
    })
  })

  test('검색창에 "이정" 입력 → 드롭다운 표시', async ({ page }) => {
    await page.goto('/')
    const input = page.getByPlaceholder(/선수명을 입력/)
    await input.fill('이정')
    await expect(page.getByText('이정후')).toBeVisible({ timeout: 3000 })
  })

  test('선수 클릭 → /players/:id 이동', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder(/선수명을 입력/).fill('이정')
    await page.getByText('이정후').click()
    await expect(page).toHaveURL('/players/1')
  })

  test('모바일(375px) 레이아웃 가로 스크롤 없음', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('모바일(375px) 하단 탭바 표시', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator('nav.fixed.bottom-0')).toBeVisible()
  })

  test('주목 선수 카드 3개 표시', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('highlight-card')).toHaveCount(3)
  })
})
