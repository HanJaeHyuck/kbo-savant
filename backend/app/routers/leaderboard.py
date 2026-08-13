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
    "woba": (BattingStat.woba, "desc"),
    "hard_hit_pct": (BattingStat.hard_hit_pct, "desc"),
    "barrel_pct": (BattingStat.barrel_pct, "desc"),
    "sweet_spot_pct": (BattingStat.sweet_spot_pct, "desc"),
    "avg_ev": (BattingStat.avg_ev, "desc"),
    "xba": (BattingStat.xba, "desc"),
    "xslg": (BattingStat.xslg, "desc"),
    "xwoba": (BattingStat.xwoba, "desc"),
    "chase_pct": (BattingStat.chase_pct, "asc"),
    "whiff_pct": (BattingStat.whiff_pct, "asc"),
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
    "chase_pct": (PitchingStat.chase_pct, "desc"),
    "k_pct": (PitchingStat.k_pct, "desc"),
    "bb_pct": (PitchingStat.bb_pct, "asc"),
    "xera": (PitchingStat.xera, "asc"),
    "allowed_xba": (PitchingStat.allowed_xba, "asc"),
    "hard_hit_pct": (PitchingStat.hard_hit_pct, "asc"),
    "barrel_pct": (PitchingStat.barrel_pct, "asc"),
    "avg_ev_allowed": (PitchingStat.avg_ev_allowed, "asc"),
    "gb_pct": (PitchingStat.gb_pct, "desc"),
    "fastball_velo": (PitchingStat.fastball_velo, "desc"),
    "spin": (PitchingStat.spin, "desc"),
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
                ops=stat_row.ops,
                woba=stat_row.woba,
                hr=stat_row.hr,
                hard_hit_pct=stat_row.hard_hit_pct,
                barrel_pct=stat_row.barrel_pct,
                sweet_spot_pct=stat_row.sweet_spot_pct,
                avg_ev=stat_row.avg_ev,
                xba=stat_row.xba,
                xslg=stat_row.xslg,
                xwoba=stat_row.xwoba,
                chase_pct=stat_row.chase_pct,
                whiff_pct=stat_row.whiff_pct,
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
                era=stat_row.era,
                era_minus=stat_row.era_minus,
                ip=stat_row.ip,
                k_pct=stat_row.k_pct,
                bb_pct=stat_row.bb_pct,
                csw_pct=stat_row.csw_pct,
                whiff_pct=stat_row.whiff_pct,
                chase_pct=stat_row.chase_pct,
                xera=stat_row.xera,
                allowed_xba=stat_row.allowed_xba,
                hard_hit_pct=stat_row.hard_hit_pct,
                barrel_pct=stat_row.barrel_pct,
                avg_ev_allowed=stat_row.avg_ev_allowed,
                gb_pct=stat_row.gb_pct,
                fastball_velo=stat_row.fastball_velo,
                spin=stat_row.spin,
                percentile_war=None,
            )
            data.append(row)

    return LeaderboardResponse(total=total, page=page, per_page=per_page, data=data)
