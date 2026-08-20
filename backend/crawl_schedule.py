"""
KBO 경기 일정/결과 수집 스크립트.

⚠️ 기본적으로 실행되지 않습니다.
   KBO robots.txt("사전 승인 없이 자동 수집·크롤링·복제 금지", User-agent: * Disallow: /)와
   이용약관 제16조 차항은 사전 서면 동의 또는 공식 API 없는 자동 수집을 금지합니다.
   KBO로부터 정식 승인을 확보한 뒤에만 ENABLE_KBO_CRAWL=true 를 설정해 사용하세요.

사용법(승인 확보 후):
  ENABLE_KBO_CRAWL=true python crawl_schedule.py            # 오늘 경기
  ENABLE_KBO_CRAWL=true python crawl_schedule.py 3          # 최근 3일치
  ENABLE_KBO_CRAWL=true python crawl_schedule.py 2026-08-12 # 특정 날짜
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
