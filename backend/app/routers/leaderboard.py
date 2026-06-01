from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Player, BattingStat, PitchingStat
from app.schemas.stats import LeaderboardResponse, LeaderboardRow

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])

BATTING_SORT_COLS = {
    "war": (BattingStat.war, "desc"),
    "wrc_plus": (BattingStat.wrc_plus, "desc"),
    "ops": (BattingStat.ops, "desc"),
    "hard_hit_pct": (BattingStat.hard_hit_pct, "desc"),
    "barrel_pct": (BattingStat.barrel_pct, "desc"),
    "avg_ev": (BattingStat.avg_ev, "desc"),
    "avg": (BattingStat.avg, "desc"),
    "hr": (BattingStat.hr, "desc"),
}

PITCHING_SORT_COLS = {
    "war": (PitchingStat.war, "desc"),
    "fip": (PitchingStat.fip, "asc"),
    "era": (PitchingStat.era, "asc"),
    "era_minus": (PitchingStat.era_minus, "asc"),
    "csw_pct": (PitchingStat.csw_pct, "desc"),
    "whiff_pct": (PitchingStat.whiff_pct, "desc"),
    "k_pct": (PitchingStat.k_pct, "desc"),
}


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    type: str = Query("batting"),
    stat: str = Query("war"),
    season: int = Query(2024),
    team: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if type not in ("batting", "pitching"):
        raise HTTPException(status_code=422, detail={
            "detail": "type은 batting 또는 pitching이어야 합니다.",
            "error_code": "INVALID_TYPE"
        })

    offset = (page - 1) * per_page

    if type == "batting":
        col_info = BATTING_SORT_COLS.get(stat, (BattingStat.war, "desc"))
        col, default_dir = col_info
        query = (
            db.query(Player, BattingStat)
            .join(BattingStat, Player.id == BattingStat.player_id)
            .filter(BattingStat.season == season)
        )
        if team:
            query = query.filter(Player.team == team)
        total = query.count()
        if default_dir == "desc":
            query = query.order_by(col.desc().nullslast())
        else:
            query = query.order_by(col.asc().nullslast())
        rows = query.offset(offset).limit(per_page).all()

        data = []
        for rank_idx, (player, stat_row) in enumerate(rows, start=offset + 1):
            row = LeaderboardRow(
                rank=rank_idx,
                player_id=player.id,
                name=player.name,
                team=player.team,
                position=player.position,
                war=stat_row.war,
                wrc_plus=stat_row.wrc_plus,
                avg=stat_row.avg,
                hard_hit_pct=stat_row.hard_hit_pct,
                barrel_pct=stat_row.barrel_pct,
                percentile_war=None,
            )
            data.append(row)

    else:
        col_info = PITCHING_SORT_COLS.get(stat, (PitchingStat.war, "desc"))
        col, default_dir = col_info
        query = (
            db.query(Player, PitchingStat)
            .join(PitchingStat, Player.id == PitchingStat.player_id)
            .filter(PitchingStat.season == season)
        )
        if team:
            query = query.filter(Player.team == team)
        total = query.count()
        if default_dir == "desc":
            query = query.order_by(col.desc().nullslast())
        else:
            query = query.order_by(col.asc().nullslast())
        rows = query.offset(offset).limit(per_page).all()

        data = []
        for rank_idx, (player, stat_row) in enumerate(rows, start=offset + 1):
            row = LeaderboardRow(
                rank=rank_idx,
                player_id=player.id,
                name=player.name,
                team=player.team,
                position=player.position,
                war=stat_row.war,
                fip=stat_row.fip,
                era_minus=stat_row.era_minus,
                csw_pct=stat_row.csw_pct,
                percentile_war=None,
            )
            data.append(row)

    return LeaderboardResponse(total=total, page=page, per_page=per_page, data=data)
