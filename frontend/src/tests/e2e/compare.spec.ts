import { test, expect } from '@playwright/test'

const SEARCH_RESPONSE_A = [
  { id: 1, name: '이정후', team: '키움', position: 'CF' },
]
const SEARCH_RESPONSE_B = [
  { id: 2, name: '김도영', team: 'KIA', position: '3B' },
]

const COMPARE_RESPONSE = [
  {
    player_id: 1,
    name: '이정후',
    team: '키움',
    position: 'CF',
    batting: {
      classic: { games: 144, pa: 620, avg: 0.349, obp: 0.421, slg: 0.530, ops: 0.951, hr: 23, rbi: 87, sb: 18 },
      sabermetrics: { woba: 0.412, wrc_plus: 158, babip: 0.361, war: 7.2 },
      tracking: { hard_hit_pct: 42.3, barrel_pct: 8.7, sweet_spot_pct: 38.1, avg_ev: 148.2, chase_pct: 21.4, whiff_pct: 18.9 },
      percentiles: { war: 97, wrc_plus: 95, hard_hit_pct: 88, barrel_pct: 82, avg_ev: 91, chase_pct: 70 },
    },
    pitching: null,
  },
  {
    player_id: 2,
    name: '김도영',
    team: 'KIA',
    position: '3B',
    batting: {
      classic: { games: 140, pa: 580, avg: 0.328, obp: 0.401, slg: 0.501, ops: 0.902, hr: 18, rbi: 75, sb: 30 },
      sabermetrics: { woba: 0.390, wrc_plus: 142, babip: 0.341, war: 6.1 },
      tracking: { hard_hit_pct: 38.1, barrel_pct: 7.2, sweet_spot_pct: 35.4, avg_ev: 144.8, chase_pct: 24.1, whiff_pct: 21.3 },
      percentiles: { war: 85, wrc_plus: 90, hard_hit_pct: 75, barrel_pct: 70, avg_ev: 80, chase_pct: 60 },
    },
    pitching: null,
  },
]

const SINGLE_COMPARE_RESPONSE = [COMPARE_RESPONSE[0]]

// URL predicate: only intercept real API calls (not Vite source file module loads)
async function setupRoutes(page: import('@playwright/test').Page) {
  // search: /api/players/search?q=...
  await page.route((url) => url.pathname.startsWith('/api/players/search'), async (route) => {
    const q = new URL(route.request().url()).searchParams.get('q') ?? ''
    if (q.includes('이정') || q.includes('%EC%9D%B4%EC%A0%95')) {
      await route.fulfill({ json: SEARCH_RESPONSE_A })
    } else if (q.includes('김도') || q.includes('%EA%B9%80%EB%8F%84')) {
      await route.fulfill({ json: SEARCH_RESPONSE_B })
    } else {
      await route.fulfill({ json: [] })
    }
  })

  // compare: /api/compare?ids=...  (NOT /src/api/compare.ts)
  await page.route((url) => url.pathname === '/api/compare', async (route) => {
    const ids = new URL(route.request().url()).searchParams.get('ids') ?? ''
    if (ids.includes('1,2') || ids.includes('1%2C2')) {
      await route.fulfill({ json: COMPARE_RESPONSE })
    } else {
      await route.fulfill({ json: SINGLE_COMPARE_RESPONSE })
    }
  })

  // leaderboard (used by NavBar/Home if any)
  await page.route((url) => url.pathname.startsWith('/api/leaderboard'), async (route) => {
    await route.fulfill({ json: { total: 0, page: 1, per_page: 30, data: [] } })
  })
}

test.describe('선수 비교 페이지', () => {

  test('선수A 검색 → 선택', async ({ page }) => {
    await setupRoutes(page)
    await page.goto('/compare')
    await page.waitForLoadState('networkidle')

    const searchA = page.getByPlaceholder('선수 A 검색...')
    await searchA.fill('이정')
    await expect(page.getByText('이정후').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('이정후').first().click()

    await expect(page.locator('[data-testid="search-a"]')).toContainText('이정후')
  })

  test('선수A, 선수B 모두 선택 → 레이더차트 표시', async ({ page }) => {
    await setupRoutes(page)
    await page.goto('/compare')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('선수 A 검색...').fill('이정')
    await expect(page.getByText('이정후').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('이정후').first().click()

    await page.getByPlaceholder('선수 B 검색...').fill('김도')
    await expect(page.getByText('김도영').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('김도영').first().click()

    await expect(page.locator('[data-testid="radar-chart"]')).toBeVisible({ timeout: 8000 })
  })

  test('스탯 비교 테이블 렌더링', async ({ page }) => {
    await setupRoutes(page)
    await page.goto('/compare')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('선수 A 검색...').fill('이정')
    await page.getByText('이정후').first().click()

    await page.getByPlaceholder('선수 B 검색...').fill('김도')
    await page.getByText('김도영').first().click()

    await expect(page.locator('[data-testid="compare-stats-table"]')).toBeVisible({ timeout: 8000 })
  })

  test('퍼센타일 비교 섹션 표시', async ({ page }) => {
    await setupRoutes(page)
    await page.goto('/compare')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('선수 A 검색...').fill('이정')
    await page.getByText('이정후').first().click()

    await page.getByPlaceholder('선수 B 검색...').fill('김도')
    await page.getByText('김도영').first().click()

    await expect(page.locator('[data-testid="compare-percentile-section"]')).toBeVisible({ timeout: 8000 })
  })

  test('초기화 버튼 클릭 → 선수 선택 초기화', async ({ page }) => {
    await setupRoutes(page)
    await page.goto('/compare')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('선수 A 검색...').fill('이정')
    await page.getByText('이정후').first().click()

    const resetBtn = page.locator('[data-testid="reset-btn"]')
    await expect(resetBtn).toBeVisible({ timeout: 5000 })
    await resetBtn.click()

    await expect(page.locator('[data-testid="search-a"]')).not.toContainText('이정후')
  })

  test('모바일(375px) 비교 레이아웃 확인', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await setupRoutes(page)
    await page.goto('/compare')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('선수 A 검색...').fill('이정')
    await expect(page.getByText('이정후').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('이정후').first().click()

    await page.getByPlaceholder('선수 B 검색...').fill('김도')
    await expect(page.getByText('김도영').first()).toBeVisible({ timeout: 5000 })
    await page.getByText('김도영').first().click()

    await expect(page.locator('[data-testid="compare-view"]')).toBeVisible({ timeout: 8000 })

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })
})
