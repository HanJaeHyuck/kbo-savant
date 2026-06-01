import asyncio
import logging
from crawlers.kbo_game_crawler import retry


class StatizCrawler:
    def __init__(self):
        self.base_url = "https://www.statiz.co.kr"

    @retry(max_attempts=3, delay=5)
    async def crawl_batting_stats(self, season: int) -> list:
        logging.info(f"[Statiz] {season} 타자 스탯 크롤링 시작")
        return []

    @retry(max_attempts=3, delay=5)
    async def crawl_pitching_stats(self, season: int) -> list:
        logging.info(f"[Statiz] {season} 투수 스탯 크롤링 시작")
        return []
