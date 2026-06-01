import asyncio
import logging
import os
from functools import wraps
from pathlib import Path
from typing import Optional
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

Path("logs").mkdir(exist_ok=True)
logging.basicConfig(
    filename="logs/crawler.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

CRAWL_DELAY = float(os.getenv("CRAWL_DELAY", "1.5"))

# 존 번호 → 홈플레이트 좌표 매핑 (좌: -, 우: +, 하: -, 상: +)
ZONE_COORDS: dict[int, tuple[float, float]] = {
    1: (-0.25, 0.9),  2: (0.0, 0.9),  3: (0.25, 0.9),
    4: (-0.25, 0.6),  5: (0.0, 0.6),  6: (0.25, 0.6),
    7: (-0.25, 0.3),  8: (0.0, 0.3),  9: (0.25, 0.3),
    11: (-0.55, 0.6), 12: (0.55, 0.6),
    13: (0.0, 1.1),   14: (0.0, 0.05),
}


def retry(max_attempts: int = 3, delay: int = 5):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    wait = delay * (2 ** attempt)
                    logging.warning(
                        f"재시도 {attempt+1}/{max_attempts} - {wait}초 대기: {e}"
                    )
                    await asyncio.sleep(wait)
        return wrapper
    return decorator


def _safe_float(value: str) -> Optional[float]:
    try:
        return float(value.strip())
    except (ValueError, AttributeError):
        return None


def _safe_int(value: str) -> Optional[int]:
    try:
        return int(value.strip())
    except (ValueError, AttributeError):
        return None


def _parse_count(count_str: str) -> tuple[Optional[int], Optional[int]]:
    """'볼-스트라이크' 형식 파싱 → (balls, strikes)"""
    try:
        parts = count_str.strip().split("-")
        return int(parts[0]), int(parts[1])
    except Exception:
        return None, None


def parse_pitches(html: str) -> list[dict]:
    """
    HTML에서 투구 데이터를 파싱한다.
    Returns list of dicts with keys:
      inning, pitch_number, pitch_type, velocity,
      zone, plate_x, plate_z, balls, strikes, result
    """
    soup = BeautifulSoup(html, "html.parser")
    pitches = []
    pitch_number = 1

    section = soup.find(id="pitchDetail")
    if section is None:
        return pitches

    for row in section.select("tr.pitch-row"):
        cells = {
            "inning":     row.find("td", class_="inning"),
            "pitch_type": row.find("td", class_="pitch-type"),
            "velocity":   row.find("td", class_="velocity"),
            "zone":       row.find("td", class_="zone"),
            "count":      row.find("td", class_="count"),
            "result":     row.find("td", class_="result"),
        }

        if not all(cells.values()):
            continue

        zone = _safe_int(cells["zone"].get_text())
        plate_x, plate_z = ZONE_COORDS.get(zone, (None, None)) if zone else (None, None)
        balls, strikes = _parse_count(cells["count"].get_text())

        pitches.append({
            "inning":       _safe_int(cells["inning"].get_text()),
            "pitch_number": pitch_number,
            "pitch_type":   cells["pitch_type"].get_text(strip=True),
            "velocity":     _safe_float(cells["velocity"].get_text()),
            "zone":         zone,
            "plate_x":      plate_x,
            "plate_z":      plate_z,
            "balls":        balls,
            "strikes":      strikes,
            "result":       cells["result"].get_text(strip=True),
        })
        pitch_number += 1

    return pitches


def parse_batted_balls(html: str) -> list[dict]:
    """
    HTML에서 타구 데이터를 파싱한다.
    Returns list of dicts with keys:
      exit_velocity, launch_angle, direction,
      result, spray_x, spray_y
    """
    soup = BeautifulSoup(html, "html.parser")
    balls = []

    section = soup.find(id="battedBallDetail")
    if section is None:
        return balls

    for row in section.select("tr.batted-row"):
        cells = {
            "exit_velocity": row.find("td", class_="exit-velocity"),
            "launch_angle":  row.find("td", class_="launch-angle"),
            "direction":     row.find("td", class_="direction"),
            "result":        row.find("td", class_="result"),
            "spray_x":       row.find("td", class_="spray-x"),
            "spray_y":       row.find("td", class_="spray-y"),
        }

        if not all(cells.values()):
            continue

        balls.append({
            "exit_velocity": _safe_float(cells["exit_velocity"].get_text()),
            "launch_angle":  _safe_float(cells["launch_angle"].get_text()),
            "direction":     cells["direction"].get_text(strip=True),
            "result":        cells["result"].get_text(strip=True),
            "spray_x":       _safe_float(cells["spray_x"].get_text()),
            "spray_y":       _safe_float(cells["spray_y"].get_text()),
        })

    return balls


class KBOGameCrawler:
    def __init__(self, crawl_delay: float = CRAWL_DELAY):
        self.base_url = os.getenv("KBO_BASE_URL", "https://www.koreabaseball.com")
        self.crawl_delay = crawl_delay

    async def _fetch_game_html(self, game_id: str) -> str:
        """Playwright로 게임센터 페이지 HTML을 가져온다."""
        from playwright.async_api import async_playwright

        url = (
            f"{self.base_url}/Schedule/GameCenter/Main.aspx"
            f"?leagueId=1&seriesId=0&gameId={game_id}"
        )
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            try:
                page = await browser.new_page()
                await page.goto(url, wait_until="networkidle", timeout=30000)
                # 투구 데이터가 로딩될 때까지 대기
                await page.wait_for_selector("#pitchDetail", timeout=15000)
                html = await page.content()
            finally:
                await browser.close()
        return html

    @retry(max_attempts=3, delay=5)
    async def crawl_game(self, game_id: str) -> dict:
        """
        단일 경기를 크롤링하여 투구/타구 데이터 반환.
        Returns: {"game_id": ..., "pitches": [...], "batted_balls": [...]}
        """
        logging.info(f"[KBO] 경기 {game_id} 크롤링 시작")
        try:
            html = await self._fetch_game_html(game_id)
        except Exception as e:
            logging.critical(f"[KBO] 파싱 오류 - 사이트 구조 변경 의심. 확인 필요. ({e})")
            raise

        pitches = parse_pitches(html)
        batted_balls = parse_batted_balls(html)

        logging.info(
            f"[KBO] 경기 {game_id} 크롤링 완료 - "
            f"투구 {len(pitches)}개, 타구 {len(batted_balls)}개"
        )
        await asyncio.sleep(self.crawl_delay)
        return {
            "game_id": game_id,
            "pitches": pitches,
            "batted_balls": batted_balls,
        }

    async def crawl_season(self, season: int) -> None:
        """시즌 전체 경기 크롤링"""
        logging.info(f"[KBO] {season} 시즌 크롤링 시작")
        game_ids = await self._get_season_game_ids(season)
        for game_id in game_ids:
            try:
                data = await self.crawl_game(game_id)
                logging.info(f"[KBO] {game_id} 완료")
            except Exception as e:
                logging.error(f"[KBO] 경기 {game_id} 크롤링 실패 - {e}")

    async def _get_season_game_ids(self, season: int) -> list[str]:
        """시즌 경기 ID 목록 조회 (실제 구현은 Goal 2 이후)"""
        return []
