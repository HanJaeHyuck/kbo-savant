"""
KBO 공식 게임센터 경기 일정/결과 크롤러 (실데이터).

KBO는 투구/타구 트래킹 데이터를 공개하지 않지만, 경기 일정·결과·스코어·
선발/승패세 투수는 게임센터에서 공개한다. 이 크롤러는 그 범위만 수집한다.

실제 DOM 구조 (2026-08 기준 확인):
  li.game-cont[g_id, g_dt, season, s_nm, away_id, home_id, away_nm, home_nm,
               away_p_id, home_p_id, game_sc, result_ck]
    .top ul li          → [구장, 날씨아이콘, 시작시간]
    .middle .broadcasting → 중계 방송사
    .middle p.staus       → 경기예정 / 경기종료 등
    .team.away .score     → 원정 점수 (class에 win 포함 시 승리)
    .team.home .score     → 홈 점수
    .today-pitcher p span.before/.win/.lose/.save → 선발/승/패/세 투수
"""
import asyncio
import logging
import os
from datetime import date, datetime, timedelta
from typing import Optional
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

CRAWL_DELAY = float(os.getenv("CRAWL_DELAY", "1.5"))
KBO_BASE_URL = os.getenv("KBO_BASE_URL", "https://www.koreabaseball.com")
GAME_CENTER_PATH = "/Schedule/GameCenter/Main.aspx"


def _txt(node) -> Optional[str]:
    if node is None:
        return None
    s = node.get_text(strip=True)
    return s or None


def _int(value: Optional[str]) -> Optional[int]:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def _pitcher_by_role(team_div, role_class: str) -> Optional[str]:
    """today-pitcher 안에서 역할(before/win/lose/save)에 해당하는 투수명 추출."""
    if team_div is None:
        return None
    for p in team_div.select(".today-pitcher p"):
        span = p.find("span", class_=role_class)
        if span:
            # <p><span class="win">승</span>박상원</p> → "박상원"
            name = p.get_text(strip=True).replace(span.get_text(strip=True), "", 1)
            return name.strip() or None
    return None


def parse_games(html: str) -> list[dict]:
    """게임센터 HTML에서 당일 경기 목록 파싱."""
    soup = BeautifulSoup(html, "html.parser")
    games: list[dict] = []

    cards = soup.select("li.game-cont")
    if not cards:
        # 구조가 바뀌었거나 경기가 없는 날
        return games

    for c in cards:
        g_id = c.get("g_id")
        g_dt = c.get("g_dt")
        if not g_id or not g_dt:
            continue

        away = c.select_one(".team.away")
        home = c.select_one(".team.home")

        top_items = c.select(".top ul li")
        start_time = _txt(top_items[-1]) if top_items else None

        # 점수 (경기 종료/진행 시에만 존재)
        away_score = _int(_txt(away.select_one(".score"))) if away else None
        home_score = _int(_txt(home.select_one(".score"))) if home else None

        # 승/패/세 투수는 양 팀 어디에나 있을 수 있어 둘 다 확인
        def find_role(role: str) -> Optional[str]:
            return _pitcher_by_role(away, role) or _pitcher_by_role(home, role)

        games.append({
            "game_id":     g_id,
            "game_date":   datetime.strptime(g_dt, "%Y%m%d").date(),
            "season":      _int(c.get("season")) or int(g_dt[:4]),
            "stadium":     c.get("s_nm"),
            "broadcast":   _txt(c.select_one(".broadcasting")),
            "start_time":  start_time,
            "status":      _txt(c.select_one("p.staus")),
            "status_code": _int(c.get("game_sc")),
            "away_code":   c.get("away_id"),
            "home_code":   c.get("home_id"),
            "away_name":   c.get("away_nm"),
            "home_name":   c.get("home_nm"),
            "away_score":  away_score,
            "home_score":  home_score,
            "away_pitcher": _pitcher_by_role(away, "before"),
            "home_pitcher": _pitcher_by_role(home, "before"),
            "win_pitcher":  find_role("win"),
            "lose_pitcher": find_role("lose"),
            "save_pitcher": find_role("save"),
        })

    return games


class KBOScheduleCrawler:
    """Playwright로 게임센터를 렌더링한 뒤 경기 목록을 수집한다."""

    def __init__(self, crawl_delay: float = CRAWL_DELAY):
        self.base_url = KBO_BASE_URL
        self.crawl_delay = crawl_delay

    async def _fetch_html(self, target: date) -> str:
        from playwright.async_api import async_playwright

        url = f"{self.base_url}{GAME_CENTER_PATH}"
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.goto(url, wait_until="networkidle", timeout=30000)

                # 오늘 기준 목표 날짜까지 이전/다음 버튼으로 이동
                today = date.today()
                delta = (target - today).days
                btn = "#lnkNext" if delta > 0 else "#lnkPrev"
                for _ in range(abs(delta)):
                    await page.click(btn)
                    await page.wait_for_timeout(700)

                await page.wait_for_timeout(800)
                return await page.content()
            finally:
                await browser.close()

    async def crawl_date(self, target: date) -> list[dict]:
        """특정 날짜의 경기 일정/결과 수집."""
        logging.info(f"[KBO] {target} 경기 일정 크롤링 시작")
        html = await self._fetch_html(target)
        games = parse_games(html)

        if not games:
            logging.info(f"[KBO] {target} 경기 없음")
        else:
            logging.info(f"[KBO] {target} 경기 {len(games)}건 수집")

        await asyncio.sleep(self.crawl_delay)
        return games

    async def crawl_range(self, start: date, end: date) -> list[dict]:
        """기간 내 경기 수집 (하루씩 순회)."""
        out: list[dict] = []
        cur = start
        while cur <= end:
            try:
                out.extend(await self.crawl_date(cur))
            except Exception as e:
                logging.error(f"[KBO] {cur} 크롤링 실패 - {e}")
            cur += timedelta(days=1)
        return out
