"""
리그 전체 기준 퍼센타일 계산 서비스.
각 지표에서 해당 선수가 리그 내 몇 % 위치인지 0~100으로 반환한다.
"""
from sqlalchemy.orm import Session
from app.models import BattingStat, PitchingStat
from app.services.stat_calculator import calc_percentile

# 높을수록 좋은 타자 지표
BATTING_HIGHER_BETTER = {
    "war", "wrc_plus", "ops", "woba", "obp", "slg", "avg", "babip",
    "hard_hit_pct", "barrel_pct", "sweet_spot_pct", "avg_ev", "hr",
}
# 낮을수록 좋은 타자 지표
BATTING_LOWER_BETTER = {"chase_pct", "whiff_pct", "k"}

# 높을수록 좋은 투수 지표
PITCHING_HIGHER_BETTER = {"war", "k_pct", "csw_pct", "lob_pct", "whiff_pct", "chase_pct", "gb_pct", "fastball_velo", "spin"}
# 낮을수록 좋은 투수 지표
PITCHING_LOWER_BETTER = {
    "era", "fip", "xfip", "era_minus", "fip_minus",
    "bb_pct", "hr9", "babip", "hard_hit_pct", "barrel_pct", "avg_ev_allowed",
}

BATTING_STATS_FIELDS = list(BATTING_HIGHER_BETTER | BATTING_LOWER_BETTER)
PITCHING_STATS_FIELDS = list(PITCHING_HIGHER_BETTER | PITCHING_LOWER_BETTER)


def compute_batting_percentiles(season: int, db: Session) -> dict[int, dict[str, int]]:
    """
    해당 시즌 전체 타자의 지표별 퍼센타일을 계산한다.
    Returns: {player_id: {stat_name: percentile, ...}, ...}
    """
    rows = db.query(BattingStat).filter_by(season=season).all()
    if not rows:
        return {}

    # 지표별 전체 값 수집
    league_values: dict[str, list[float]] = {}
    for field in BATTING_STATS_FIELDS:
        vals = [getattr(r, field) for r in rows if getattr(r, field) is not None]
        if vals:
            league_values[field] = vals

    result: dict[int, dict[str, int]] = {}
    for row in rows:
        percentiles: dict[str, int] = {}
        for field in BATTING_STATS_FIELDS:
            val = getattr(row, field)
            if val is None or field not in league_values:
                percentiles[field] = 50
                continue
            higher = field in BATTING_HIGHER_BETTER
            percentiles[field] = calc_percentile(val, league_values[field], higher)
        result[row.player_id] = percentiles

    return result


def compute_pitching_percentiles(season: int, db: Session) -> dict[int, dict[str, int]]:
    """
    해당 시즌 전체 투수의 지표별 퍼센타일을 계산한다.
    Returns: {player_id: {stat_name: percentile, ...}, ...}
    """
    rows = db.query(PitchingStat).filter_by(season=season).all()
    if not rows:
        return {}

    league_values: dict[str, list[float]] = {}
    for field in PITCHING_STATS_FIELDS:
        vals = [getattr(r, field) for r in rows if getattr(r, field) is not None]
        if vals:
            league_values[field] = vals

    result: dict[int, dict[str, int]] = {}
    for row in rows:
        percentiles: dict[str, int] = {}
        for field in PITCHING_STATS_FIELDS:
            val = getattr(row, field)
            if val is None or field not in league_values:
                percentiles[field] = 50
                continue
            higher = field in PITCHING_HIGHER_BETTER
            percentiles[field] = calc_percentile(val, league_values[field], higher)
        result[row.player_id] = percentiles

    return result
