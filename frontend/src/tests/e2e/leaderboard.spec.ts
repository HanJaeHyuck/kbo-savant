import { test, expect } from '@playwright/test'

const BATTING_DATA = {
  total: 2, page: 1, per_page: 30,
  data: [
    { rank: 1, player_id: 1, name: '이정후', team: '키움', position: 'CF', war: 7.2, wrc_plus: 158, ops: 0.951, hard_hit_pct: 42.3, barrel_pct: 8.7, avg_ev: 148.2 },
    { rank: 2, player_id: 2, name: '김도영', team: 'KIA', position: '3B', war: 6.8, wrc_plus: 145, ops: 0.920, hard_hit_pct: 38.1, barrel_pct: 7.2, avg_ev: 145.8 },
  ],
}

const PITCHING_DATA = {
  total: 2, page: 1, per_page: 30,
  data: [
    { rank: 1, player_id: 3, name: '양현종', team: 'KIA', position: 'P', war: 6.2, fip: 3.12, era_minus: 72, csw_pct: 31.8, whiff_pct: 29.4, hard_hit_pct: 28.1 },
    { rank: 2, player_id: 4, name: '원태인', team: '삼성', position: 'P', war: 5.8, fip: 3.45, era_minus: 78, csw_pct: 28.5, whiff_pct: 27.1, hard_hit_pct: 30.2 },
  ],
}

const KIA_ONLY_DATA = {
  total: 1, page: 1, per_page: 30,
  data: [
    { rank: 1, player_id: 2, name: '김도영', team: 'KIA', position: '3B', war: 6.8, wrc_plus: 145, ops: 0.920, hard_hit_pct: 38.1, barrel_pct: 7.2, avg_ev: 145.8 },
  ],
}

test.describe('리더보드', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/leaderboard**', (route) => {
      const url = new URL(route.request().url())
      const type = url.searchParams.get('type')
      const team = url.searchParams.get('team')

      if (type === 'pitching') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PITCHING_DATA) })
      } else if (team === 'KIA') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(KIA_ONLY_DATA) })
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(BATTING_DATA) })
      }
    })
  })

  test('기본 타자 리더보드 로딩', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.getByText('이정후')).toBeVisible()
    await expect(page.getByText('김도영')).toBeVisible()
  })

  test('투수 탭 클릭 → FIP 컬럼 표시', async ({ page }) => {
    await page.goto('/leaderboard')
    await page.getByTestId('tab-pitching').click()
    await expect(page.getByTestId('header-fip')).toBeVisible()
    await expect(page.getByText('양현종')).toBeVisible()
  })

  test('WAR 헤더 클릭 → 내림차순 정렬 표시', async ({ page }) => {
    // wrc_plus로 정렬된 상태에서 시작
    await page.goto('/leaderboard?sort=wrc_plus&dir=desc')
    await page.getByTestId('header-war').click()
    // URL에 sort=war&dir=desc 반영
    await expect(page).toHaveURL(/sort=war/)
    await expect(page).toHaveURL(/dir=desc/)
    // WAR 헤더에 ▼ 표시
    await expect(page.getByTestId('header-war')).toContainText('▼')
  })

  test('WAR 헤더 재클릭 → 오름차순 정렬 표시', async ({ page }) => {
    // war desc 상태에서 시작
    await page.goto('/leaderboard?sort=war&dir=desc')
    await page.getByTestId('header-war').click()
    // 토글 → dir=asc
    await expect(page).toHaveURL(/dir=asc/)
    await expect(page.getByTestId('header-war')).toContainText('▲')
  })

  test('팀 필터 → KIA 선택 시 KIA 선수만 표시', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.getByText('이정후')).toBeVisible()
    // KIA 팀 선택
    await page.selectOption('select:nth-of-type(2)', 'KIA')
    // KIA 선수만
    await expect(page.getByText('김도영')).toBeVisible()
    await expect(page.getByText('이정후')).not.toBeVisible()
  })

  test('선수 클릭 → 상세 페이지 이동', async ({ page }) => {
    await page.goto('/leaderboard')
    await page.getByText('이정후').click()
    await expect(page).toHaveURL('/players/1')
  })

  test('모바일(375px) 주요 컬럼만 표시', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/leaderboard')
    // WAR 헤더는 보여야 함 (mobileHidden: false)
    await expect(page.getByTestId('header-war')).toBeVisible()
    // OPS 헤더는 숨겨져야 함 (mobileHidden: true)
    await expect(page.getByTestId('header-ops')).toBeHidden()
  })
})
