from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app.models import Player, BattingStat, PitchingStat, Pitch, BattedBall
from app.schemas.player import PlayerSearch, PlayerDetail
from app.schemas.stats import BattingStatsResponse, PitchingStatsResponse
from app.services.data_service import (
    get_batting_stats_response,
    get_pitching_stats_response,
    get_pitches_response,
    get_batted_balls_response,
)

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("/search", response_model=list[PlayerSearch])
async def search_players(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    players = (
        db.query(Player)
        .filter(Player.name.like(f"{q}%"))
        .limit(10)
        .all()
    )
    return players


@router.get("/{player_id}", response_model=PlayerDetail)
async def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail={
            "detail": "선수를 찾을 수 없습니다.",
            "error_code": "PLAYER_NOT_FOUND"
        })
    return player


@router.get("/{player_id}/batting")
async def get_batting_stats(
    player_id: int,
    season: int = Query(...),
    db: Session = Depends(get_db),
):
    if season < 1982 or season > 2030:
        raise HTTPException(status_code=422, detail={
            "detail": "올바른 시즌 연도를 입력해주세요.",
            "error_code": "INVALID_SEASON"
        })
    return get_batting_stats_response(player_id, season, db)


@router.get("/{player_id}/pitching")
async def get_pitching_stats(
    player_id: int,
    season: int = Query(...),
    db: Session = Depends(get_db),
):
    if season < 1982 or season > 2030:
        raise HTTPException(status_code=422, detail={
            "detail": "올바른 시즌 연도를 입력해주세요.",
            "error_code": "INVALID_SEASON"
        })
    return get_pitching_stats_response(player_id, season, db)


@router.get("/{player_id}/pitches")
async def get_pitches(
    player_id: int,
    season: int = Query(...),
    db: Session = Depends(get_db),
):
    return get_pitches_response(player_id, season, db)


@router.get("/{player_id}/batted-balls")
async def get_batted_balls(
    player_id: int,
    season: int = Query(...),
    db: Session = Depends(get_db),
):
    return get_batted_balls_response(player_id, season, db)
