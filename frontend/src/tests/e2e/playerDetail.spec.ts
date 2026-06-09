import { test, expect } from '@playwright/test'

const MOCK_PLAYER = {
  id: 6,
  kbo_id: '11001',
  name: '김광현',
  team: 'SSG 랜더스',
  position: 'P',
  throws: 'L',
  bats: 'L',
}

const MOCK_PITCHING = {
  player_id: 6,
  season: 2024,
  classic: { games: 30, gs: 30, ip: 195.2, wins: 15, losses: 7, era: 2.84 },
  sabermetrics: {
    fip: 3.12, xfip: 3.08, era_minus: 72, fip_minus: 78,
    k_pct: 28.4, bb_pct: 7.1, babip: 0.281, war: 6.2,
  },
  tracking: {
    avg_ev_allowed: 141.3, hard_hit_pct: 28.1, barrel_pct: 4.2,
    csw_pct: 31.8, whiff_pct: 29.4, chase_pct: 34.7,
  },
  percentiles: {
    era_minus: 91, fip: 88, hard_hit_pct: 85, csw_pct: 92, war: 95,
  },
}

const MOCK_PITCHES = {
  player_id: 6,
  season: 2024,
  total_pitches: 2847,
  pitch_mix: [
    { pitch_type: '직구',    count: 1081, pct: 38.0, avg_velocity: 148.2 },
    { pitch_type: '슬라이더', count: 797,  pct: 28.0, avg_velocity: 132.5 },
    { pitch_type: '체인지업', count: 569,  pct: 20.0, avg_velocity: 128.8 },
    { pitch_type: '커브',    count: 400,  pct: 14.0, avg_velocity: 118.3 },
  ],
  zone_data: [
    { zone: 1, pitches: 120, batting_avg: 0.198, whiff_pct: 18.2 },
    { zone: 5, pitches: 340, batting_avg: 0.250, whiff_pct: 22.1 },
  ],
  velocity_trend: [
    { game_date: '2024-04-01', avg_velocity: 147.1 },
    { game_date: '2024-04-07', avg_velocity: 148.4 },
    { game_date: '2024-04-13', avg_velocity: 149.0 },
    { game_date: '2024-04-20', avg_velocity: 147.8 },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/players/6', route =>
    route.fulfill({ json: MOCK_PLAYER })
  )
  await page.route('**/api/players/6/pitching**', route =>
    route.fulfill({ json: MOCK_PITCHING })
  )
  await page.route('**/api/players/6/pitches**', route =>
    route.fulfill({ json: MOCK_PITCHES })
  )
})

test('투수 상세 접속 → 스트라이크존 맵 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/6')
  await expect(page.locator('[data-testid="zone-map-container"]')).toBeVisible()
  await expect(page.locator('[data-testid="strike-zone-map"]')).toBeVisible()
})

test('투수 상세 접속 → 구속 트렌드 차트 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/6')
  await expect(page.locator('[data-testid="velo-trend-chart"]')).toBeVisible()
})

test('투수 상세 접속 → Whiff%/CSW%/Chase% 수치 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/6')

  // StatRow testid로 확인
  await expect(page.locator('[data-testid="stat-csw_pct"]')).toBeVisible()
  await expect(page.locator('[data-testid="stat-whiff_pct"]')).toBeVisible()
  await expect(page.locator('[data-testid="stat-chase_pct"]')).toBeVisible()

  // 실제 수치 확인 (stat-csw_pct testid 내부에서 수치 찾기)
  await expect(page.locator('[data-testid="stat-csw_pct"]').getByText('31.8%')).toBeVisible()
  await expect(page.locator('[data-testid="stat-whiff_pct"]').getByText('29.4%')).toBeVisible()
  await expect(page.locator('[data-testid="stat-chase_pct"]').getByText('34.7%')).toBeVisible()
})

test('투수 상세 접속 → 구종 구성 바 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/6')
  await expect(page.locator('[data-testid="pitch-mix"]')).toBeVisible()
})

test('투수 상세 접속 → 퍼센타일 섹션 표시', async ({ page }) => {
  await page.goto('http://localhost:5173/players/6')
  await expect(page.locator('[data-testid="percentile-section"]')).toBeVisible()
})

test('모바일(375px) 차트 1열 배치', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('http://localhost:5173/players/6')

  // 1열 레이아웃에서 차트들이 세로로 쌓여 있어야 함
  // lg:grid-cols-3 → 모바일에서는 grid-cols-1
  const main = page.locator('main').first()
  await expect(main).toBeVisible()

  // 가로 스크롤 없음 확인
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  const viewportWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)

  // zone-map-container는 여전히 보여야 함 (스크롤하면 도달 가능)
  await expect(page.locator('[data-testid="zone-map-container"]')).toBeAttached()
})
