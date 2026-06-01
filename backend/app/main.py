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


@app.get("/health")
async def health():
    from app.database import check_db_connection
    db_ok = check_db_connection()
    return {"status": "ok", "db": "connected" if db_ok else "disconnected"}
