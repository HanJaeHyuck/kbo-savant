from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.data_service import get_batting_stats_response, get_pitching_stats_response
from app.models import Player

router = APIRouter(prefix="/api/compare", tags=["compare"])


@router.get("")
async def compare_players(
    ids: str = Query(...),
    season: int = Query(2024),
    db: Session = Depends(get_db),
):
    try:
        player_ids = [int(i.strip()) for i in ids.split(",")]
    except ValueError:
        raise HTTPException(status_code=422, detail={
            "detail": "올바른 선수 ID를 입력해주세요.",
            "error_code": "INVALID_IDS"
        })

    results = []
    for pid in player_ids:
        player = db.query(Player).filter(Player.id == pid).first()
        if not player:
            raise HTTPException(status_code=404, detail={
                "detail": f"선수 ID {pid}를 찾을 수 없습니다.",
                "error_code": "PLAYER_NOT_FOUND"
            })
        batting = get_batting_stats_response(pid, season, db)
        pitching = get_pitching_stats_response(pid, season, db)
        results.append({
            "player_id": pid,
            "name": player.name,
            "team": player.team,
            "position": player.position,
            "batting": batting,
            "pitching": pitching,
        })

    return results
