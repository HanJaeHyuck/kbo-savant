import asyncio
import logging
import os
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler

load_dotenv()

CRAWL_HOUR = int(os.getenv("CRAWL_HOUR", "1"))
CRAWL_MINUTE = int(os.getenv("CRAWL_MINUTE", "0"))
TIMEZONE = os.getenv("TIMEZONE", "Asia/Seoul")

scheduler = AsyncIOScheduler(timezone=TIMEZONE)


@scheduler.scheduled_job("cron", hour=CRAWL_HOUR, minute=CRAWL_MINUTE)
async def daily_crawl():
    from crawlers.kbo_game_crawler import KBOGameCrawler
    from crawlers.statiz_crawler import StatizCrawler

    logging.info("[스케줄러] 일일 크롤링 시작")
    try:
        statiz = StatizCrawler()
        await statiz.crawl_batting_stats(2024)
        await statiz.crawl_pitching_stats(2024)
        logging.info("[스케줄러] 일일 크롤링 완료")
    except Exception as e:
        logging.error(f"[스케줄러] 크롤링 실패: {e}")


if __name__ == "__main__":
    import sys

    # Railway Cron Job: `python crawlers/scheduler.py --once` → 1회 실행 후 종료
    if "--once" in sys.argv or os.getenv("RUN_MODE") == "once":
        logging.info("[스케줄러] --once 모드: 크롤링 1회 실행")
        asyncio.run(daily_crawl())
    else:
        # 워커 서비스 모드: 매일 지정 시각에 실행
        scheduler.start()
        try:
            asyncio.get_event_loop().run_forever()
        except KeyboardInterrupt:
            scheduler.shutdown()
