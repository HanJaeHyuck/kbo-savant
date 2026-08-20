"""
KBO 경기 일정/결과 실데이터 수집 스크립트.

사용법:
  python crawl_schedule.py            # 오늘 경기
  python crawl_schedule.py 3          # 최근 3일치
  python crawl_schedule.py 2026-08-12 # 특정 날짜
"""
import asyncio
import sys
from datetime import date, datetime, timedelta

sys.path.insert(0, ".")
sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal, engine, Base
from crawlers.kbo_schedule_crawler import KBOScheduleCrawler
from crawlers.schedule_db_service import save_games

Base.metadata.create_all(bind=engine)


async def main() -> None:
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    crawler = KBOScheduleCrawler()

    if arg and "-" in arg:
        target = datetime.strptime(arg, "%Y-%m-%d").date()
        dates = [target]
    else:
        days = int(arg) if arg else 1
        today = date.today()
        dates = [today - timedelta(days=i) for i in range(days)]

    db = SessionLocal()
    try:
        total = 0
        for d in dates:
            games = await crawler.crawl_date(d)
            if games:
                res = save_games(games, db)
                total += res["total"]
                print(f"{d}: 경기 {res['total']}건 (신규 {res['inserted']}, 갱신 {res['updated']})")
                for g in games:
                    score = (
                        f"{g['away_score']}:{g['home_score']}"
                        if g["away_score"] is not None else g["start_time"]
                    )
                    print(f"   {g['away_name']} {score} {g['home_name']}  [{g['status']}] {g['stadium']}")
            else:
                print(f"{d}: 경기 없음")
        print(f"\n총 {total}건 저장 완료")
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
