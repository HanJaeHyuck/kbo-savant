from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Game

router = APIRouter(prefix="/api/games", tags=["games"])


def _serialize(g: Game) -> dict:
    return {
        "game_id":     g.game_id,
        "game_date":   g.game_date.isoformat() if g.game_date else None,
        "season":      g.season,
        "stadium":     g.stadium,
        "broadcast":   g.broadcast,
        "start_time":  g.start_time,
        "status":      g.status,
        "status_code": g.status_code,
        "away": {
            "code": g.away_code, "name": g.away_name, "score": g.away_score,
            "pitcher": g.away_pitcher,
        },
        "home": {
            "code": g.home_code, "name": g.home_name, "score": g.home_score,
            "pitcher": g.home_pitcher,
        },
        "win_pitcher":  g.win_pitcher,
        "lose_pitcher": g.lose_pitcher,
        "save_pitcher": g.save_pitcher,
    }


@router.get("")
async def list_games(
    game_date: Optional[str] = Query(None, description="YYYY-MM-DD (미지정 시 가장 최근 경기일)"),
    db: Session = Depends(get_db),
):
    """
    경기 일정/결과 조회. KBO 공식 게임센터에서 수집한 실데이터.
    날짜 미지정 시 DB에 있는 가장 최근 경기일을 반환한다.
    """
    if game_date:
        try:
            target = datetime.strptime(game_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=422, detail={
                "detail": "날짜 형식은 YYYY-MM-DD 입니다.",
                "error_code": "INVALID_DATE",
            })
    else:
        latest = db.query(Game.game_date).order_by(Game.game_date.desc()).first()
        if latest is None:
            return {"game_date": None, "total": 0, "data": []}
        target = latest[0]

    rows = (
        db.query(Game)
        .filter(Game.game_date == target)
        .order_by(Game.game_id)
        .all()
    )
    return {
        "game_date": target.isoformat(),
        "total": len(rows),
        "data": [_serialize(g) for g in rows],
    }


@router.get("/dates")
async def list_game_dates(db: Session = Depends(get_db)):
    """DB에 저장된 경기 날짜 목록 (최근순)."""
    rows = (
        db.query(Game.game_date)
        .distinct()
        .order_by(Game.game_date.desc())
        .limit(60)
        .all()
    )
    return {"dates": [r[0].isoformat() for r in rows]}
