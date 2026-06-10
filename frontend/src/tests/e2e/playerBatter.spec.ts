import { test, expect } from '@playwright/test'

const MOCK_BATTER = {
  id: 1,
  kbo_id: '73912',
  name: '이정후',
  team: '키움 히어로즈',
  position: 'CF',
  throws: 'R',
  bats: 'L',
}

const MOCK_BATTING = {
  player_id: 1,
  season: 2024,
  classic: {
    games: 144, pa: 620, avg: 0.349, obp: 0.421,
    slg: 0.530, ops: 0.951, hr: 23, rbi: 87, sb: 18,
  },
  sabermetrics: {
    woba: 0.412, wrc_plus: 158, babip: 0.361, war: 7.2,
  },
  tracking: {
    hard_hit_pct: 42.3, barrel_pct: 8.7, sweet_spot_pct: 38.1,
    avg_ev: 148.2, chase_pct: 21.4, whiff_pct: 18.9,
  },
  percentiles: {
    hard_hit_pct: 88, barrel_pct: 82, avg_ev: 91,
    wrc_plus: 95, war: 97, ops: 93, chase_pct: 72, whiff_pct: 68,
  },
}

const MOCK_BATTED_BALLS = {
  player_id: 1,
  season: 2024,
  total: 5,
  spray_data: [
    { spray_x: -45.2, spray_y: 120.3, result: '안타',  exit_velocity: 152.1, launch_angle: 18.4 },
    { spray_x:  12.8, spray_y:  95.7, result: '아웃',  exit_velocity: 138.2, launch_angle: -3.2 },
    { spray_x: -80.3, spray_y: 145.2, result: '홈런',  exit_velocity: 162.1, launch_angle: 27.5 },
    { spray_x:   2.1, spray_y: 110.8, result: '아웃',  exit_velocity: 138.4, launch_angle: 45.2 },
    { spray_x:  60.4, spray_y: 135.6, result: '2루타', exit_velocity: 151.7, launch_angle: 12.8 },
  ],
  zone_avg: [
    { zone: 1, avg: 0.198, attempts: 48 },
    { zone: 2, avg: 0.280, attempts: 62 },
    { zone: 3, avg: 0.220, attempts: 41 },
    { zone: 4, avg: 0.310, attempts: 55 },
    { zone: 5, avg: 0.388, attempts: 76 },
    { zone: 6, avg: 0.240, attempts: 50 },
    { zone: 7, avg: 0.180, attempts: 38 },
    { zone: 8, avg: 0.270, attempts: 60 },
    { zone: 9, avg: 0.210, attempts: 44 },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/players/1', route =>
    route.fulfill({ json: MOCK_BATTER })
  )
  await page.route('**/api/players/1/batting**', route =>
    route.fulfill({ json: MOCK_BATTING })
  )
  await page.route('**/api/players/1/batted-balls**', route =>
    route.fulfill({ json: MOCK_BATTED_BALLS })
  )
})

test('타자 상세 접속 → 스프레이 차트 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/1')
  await expect(page.locator('[data-testid="spray-chart-container"]')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[data-testid="spray-chart"]')).toBeVisible({ timeout: 10000 })
})

test('타자 상세 접속 → 존별 히트맵 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/1')
  await expect(page.locator('[data-testid="batter-zone-map-container"]')).toBeVisible()
  await expect(page.locator('[data-testid="strike-zone-map"]')).toBeVisible()
})

test('타자 상세 접속 → 하드힛%/배럴%/EV 수치 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/1')

  await expect(page.locator('[data-testid="stat-hard_hit_pct"]')).toBeVisible()
  await expect(page.locator('[data-testid="stat-barrel_pct"]')).toBeVisible()
  await expect(page.locator('[data-testid="stat-avg_ev"]')).toBeVisible()

  // 실제 수치 확인
  await expect(page.locator('[data-testid="stat-hard_hit_pct"]').getByText('42.3%')).toBeVisible()
  await expect(page.locator('[data-testid="stat-barrel_pct"]').getByText('8.7%')).toBeVisible()
  await expect(page.locator('[data-testid="stat-avg_ev"]').getByText('148.2')).toBeVisible()
})

test('타자 상세 접속 → 레이더 차트 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/1')
  await expect(page.locator('[data-testid="radar-chart"]')).toBeVisible()
})

test('타자 상세 접속 → 퍼센타일 섹션 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/1')
  await expect(page.locator('[data-testid="batter-percentile-section"]')).toBeVisible()
})

test('모바일(375px) 스프레이차트 렌더링 확인', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('http://localhost:5173/players/1')

  // 스프레이 차트가 DOM에 있어야 함
  await expect(page.locator('[data-testid="spray-chart"]')).toBeAttached()

  // 가로 스크롤 없음 확인
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)
})
