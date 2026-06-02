import asyncio
import logging
import os
from typing import Optional
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from crawlers.kbo_game_crawler import retry

load_dotenv()

CRAWL_DELAY = float(os.getenv("CRAWL_DELAY", "1.5"))

# 스탯티즈 컬럼명 → 내부 필드명 매핑
BATTING_COL_MAP = {
    "선수명": "name", "팀": "team",
    "G": "games", "PA": "pa", "AB": "ab", "H": "hits",
    "2B": "doubles", "3B": "triples", "HR": "hr",
    "RBI": "rbi", "SB": "sb", "BB": "bb", "SO": "k",
    "AVG": "avg", "OBP": "obp", "SLG": "slg", "OPS": "ops",
    "wOBA": "woba", "wRC+": "wrc_plus", "BABIP": "babip", "WAR": "war",
}

PITCHING_COL_MAP = {
    "선수명": "name", "팀": "team",
    "G": "games", "GS": "gs", "W": "wins", "L": "losses", "S": "saves",
    "IP": "ip", "ERA": "era", "FIP": "fip", "xFIP": "xfip",
    "ERA-": "era_minus", "FIP-": "fip_minus",
    "K%": "k_pct", "BB%": "bb_pct", "HR9": "hr9",
    "BABIP": "babip", "LOB%": "lob_pct", "WAR": "war",
}


def _to_float(val: str) -> Optional[float]:
    try:
        return float(val.strip().replace("%", "").replace(",", ""))
    except (ValueError, AttributeError):
        return None


def _to_int(val: str) -> Optional[int]:
    try:
        return int(val.strip().replace(",", ""))
    except (ValueError, AttributeError):
        return None


def _parse_stat_table(html: str, col_map: dict) -> list[dict]:
    """
    스탯티즈 공통 테이블 파서.
    id='mytable'인 테이블에서 헤더를 읽어 컬럼 위치를 동적으로 파악한다.
    """
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id="mytable")
    if table is None:
        return []

    # 헤더에서 컬럼 인덱스 매핑
    headers = [th.get_text(strip=True) for th in table.select("thead tr th")]
    col_index: dict[str, int] = {}
    for i, h in enumerate(headers):
        if h in col_map:
            col_index[col_map[h]] = i

    results = []
    for row in table.select("tbody tr"):
        cells = row.find_all("td")
        if not cells:
            continue

        record: dict = {}
        for field, idx in col_index.items():
            if idx >= len(cells):
                continue
            raw = cells[idx].get_text(strip=True)

            # 선수명은 링크 안 텍스트
            if field == "name":
                a = cells[idx].find("a")
                raw = a.get_text(strip=True) if a else raw
                # kbo_id는 링크 href에서 추출
                if a and a.get("href"):
                    href = a["href"]
                    if "pid=" in href:
                        record["kbo_id"] = href.split("pid=")[-1].split("&")[0]
                record[field] = raw
                continue

            # 숫자 필드 처리
            if field in ("games", "pa", "ab", "hits", "doubles", "triples",
                         "hr", "rbi", "sb", "bb", "k", "gs", "wins", "losses", "saves"):
                record[field] = _to_int(raw)
            else:
                record[field] = _to_float(raw)

        if record.get("name"):
            results.append(record)

    return results


def parse_batting_stats(html: str) -> list[dict]:
    """HTML에서 타자 세이버 스탯을 파싱한다."""
    return _parse_stat_table(html, BATTING_COL_MAP)


def parse_pitching_stats(html: str) -> list[dict]:
    """HTML에서 투수 세이버 스탯을 파싱한다."""
    return _parse_stat_table(html, PITCHING_COL_MAP)


class StatizCrawler:
    def __init__(self, crawl_delay: float = CRAWL_DELAY):
        self.base_url = os.getenv("STATIZ_BASE_URL", "https://www.statiz.co.kr")
        self.crawl_delay = crawl_delay

    async def _fetch_html(self, url: str) -> str:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.goto(url, wait_until="networkidle", timeout=30000)
                await page.wait_for_selector("table#mytable", timeout=15000)
                html = await page.content()
            finally:
                await browser.close()
        return html

    @retry(max_attempts=3, delay=5)
    async def crawl_batting_stats(self, season: int) -> list[dict]:
        logging.info(f"[Statiz] {season} 타자 스탯 크롤링 시작")
        url = (
            f"{self.base_url}/stat.php?opt=0&sopt=0&ys={season}&ye={season}"
            f"&se=0&po=0&qu=auto&o1=WAR&de=1&lr=0"
        )
        html = await self._fetch_html(url)
        stats = parse_batting_stats(html)
        logging.info(f"[Statiz] 타자 {len(stats)}명 파싱 완료")
        await asyncio.sleep(self.crawl_delay)
        return stats

    @retry(max_attempts=3, delay=5)
    async def crawl_pitching_stats(self, season: int) -> list[dict]:
        logging.info(f"[Statiz] {season} 투수 스탯 크롤링 시작")
        url = (
            f"{self.base_url}/stat.php?opt=1&sopt=0&ys={season}&ye={season}"
            f"&se=0&po=0&qu=auto&o1=WAR&de=1&lr=0"
        )
        html = await self._fetch_html(url)
        stats = parse_pitching_stats(html)
        logging.info(f"[Statiz] 투수 {len(stats)}명 파싱 완료")
        await asyncio.sleep(self.crawl_delay)
        return stats
