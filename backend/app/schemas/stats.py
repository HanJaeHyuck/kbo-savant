from pydantic import BaseModel
from typing import Optional, Dict, Any


class ClassicBattingStats(BaseModel):
    games: Optional[int] = None
    pa: Optional[int] = None
    avg: Optional[float] = None
    obp: Optional[float] = None
    slg: Optional[float] = None
    ops: Optional[float] = None
    hr: Optional[int] = None
    rbi: Optional[int] = None
    sb: Optional[int] = None


class SaberBattingStats(BaseModel):
    woba: Optional[float] = None
    wrc_plus: Optional[float] = None
    babip: Optional[float] = None
    war: Optional[float] = None


class TrackingBattingStats(BaseModel):
    hard_hit_pct: Optional[float] = None
    barrel_pct: Optional[float] = None
    sweet_spot_pct: Optional[float] = None
    avg_ev: Optional[float] = None
    chase_pct: Optional[float] = None
    whiff_pct: Optional[float] = None


class BattingStatsResponse(BaseModel):
    player_id: int
    season: int
    classic: ClassicBattingStats
    sabermetrics: SaberBattingStats
    tracking: TrackingBattingStats
    percentiles: Dict[str, int]


class ClassicPitchingStats(BaseModel):
    games: Optional[int] = None
    gs: Optional[int] = None
    ip: Optional[float] = None
    wins: Optional[int] = None
    losses: Optional[int] = None
    era: Optional[float] = None


class SaberPitchingStats(BaseModel):
    fip: Optional[float] = None
    xfip: Optional[float] = None
    era_minus: Optional[float] = None
    fip_minus: Optional[float] = None
    k_pct: Optional[float] = None
    bb_pct: Optional[float] = None
    babip: Optional[float] = None
    war: Optional[float] = None


class TrackingPitchingStats(BaseModel):
    avg_ev_allowed: Optional[float] = None
    hard_hit_pct: Optional[float] = None
    barrel_pct: Optional[float] = None
    csw_pct: Optional[float] = None
    whiff_pct: Optional[float] = None
    chase_pct: Optional[float] = None


class PitchingStatsResponse(BaseModel):
    player_id: int
    season: int
    classic: ClassicPitchingStats
    sabermetrics: SaberPitchingStats
    tracking: TrackingPitchingStats
    percentiles: Dict[str, int]


class LeaderboardRow(BaseModel):
    rank: int
    player_id: int
    name: str
    team: str
    position: str
    percentile_war: Optional[int] = None

    model_config = {"extra": "allow"}


class LeaderboardResponse(BaseModel):
    total: int
    page: int
    per_page: int
    data: list[LeaderboardRow]
