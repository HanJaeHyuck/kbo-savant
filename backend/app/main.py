from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.routers import players, leaderboard, compare
from app.database import Base, engine
import logging

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logging.warning(f"DB 테이블 생성 실패 (DB가 준비되지 않았을 수 있음): {e}")

app = FastAPI(title="KBO Savant API", version="1.0.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router)
app.include_router(leaderboard.router)
app.include_router(compare.router)


@app.on_event("startup")
async def warmup_caches():
    """
    서버 기동 직후 백그라운드로 최근 시즌 ML 모델/퍼센타일 캐시를 미리 계산한다.
    (sklearn 첫 학습의 1회성 초기화 비용을 사용자 첫 요청 전에 지불 → 첫 페이지 로딩 체감 단축)
    """
    import threading

    def _warm():
        from app.database import SessionLocal
        from app.services.expected_stats_service import _get as warm_xstats
        from app.services.run_value_service import _get as warm_rv
        from app.services.percentile_service import (
            compute_batting_percentiles, compute_pitching_percentiles,
        )
        db = SessionLocal()
        try:
            for season in (2024, 2023, 2022):
                try:
                    warm_xstats(season, db)
                    warm_rv(season, db)
                    compute_batting_percentiles(season, db)
                    compute_pitching_percentiles(season, db)
                except Exception as e:
                    logging.warning(f"[Warmup] 시즌 {season} 캐시 워밍업 실패: {e}")
            logging.info("[Warmup] 캐시 워밍업 완료")
        finally:
            db.close()

    threading.Thread(target=_warm, daemon=True).start()


@app.get("/health")
async def health():
    from app.database import check_db_connection
    db_ok = check_db_connection()
    return {"status": "ok", "db": "connected" if db_ok else "disconnected"}
