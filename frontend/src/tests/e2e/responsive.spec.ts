import { test, expect } from '@playwright/test'

test.describe('반응형 레이아웃', () => {
  test('데스크탑(1280px) → 상단 NavBar 표시', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    // 상단 NavBar: md:flex 클래스 — 데스크탑에서 표시
    const navBar = page.locator('nav.hidden.md\\:flex')
    await expect(navBar).toBeVisible()
    await expect(navBar.getByText('KBO Savant')).toBeVisible()
  })

  test('데스크탑(1280px) → 하단 탭바 미표시', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    // 하단 탭바: md:hidden — 데스크탑에서 숨김
    const bottomNav = page.locator('nav.fixed.bottom-0.md\\:hidden')
    await expect(bottomNav).toBeHidden()
  })

  test('모바일(375px) → 하단 탭바 표시', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    const bottomNav = page.locator('nav.fixed.bottom-0')
    await expect(bottomNav).toBeVisible()
    await expect(bottomNav.getByText('홈')).toBeVisible()
    await expect(bottomNav.getByText('리더보드')).toBeVisible()
  })

  test('모바일(375px) → 상단 NavBar 미표시', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    const topNav = page.locator('nav.hidden.md\\:flex')
    await expect(topNav).toBeHidden()
  })

  test('홈 페이지 기본 렌더링', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/KBO Savant|Vite/)
    await expect(page.getByPlaceholder(/선수명을 입력/)).toBeVisible()
  })

  test('리더보드 페이지 이동', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.getByRole('heading', { name: '리더보드' })).toBeVisible()
  })
})
