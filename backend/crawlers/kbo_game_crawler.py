import asyncio
import logging
from functools import wraps
from pathlib import Path

Path("logs").mkdir(exist_ok=True)
logging.basicConfig(
    filename="logs/crawler.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)


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
                    logging.warning(f"재시도 {attempt+1}/{max_attempts} - {wait}초 대기: {e}")
                    await asyncio.sleep(wait)
        return wrapper
    return decorator


class KBOGameCrawler:
    def __init__(self):
        self.base_url = "https://www.koreabaseball.com"

    @retry(max_attempts=3, delay=5)
    async def crawl_game(self, game_id: str) -> dict:
        logging.info(f"[KBO] 경기 {game_id} 크롤링 시작")
        return {"game_id": game_id, "pitches": [], "batted_balls": []}

    async def crawl_season(self, season: int) -> None:
        logging.info(f"[KBO] {season} 시즌 크롤링 시작")
