"""
볼카운트 기반 Run Value (Context-Neutral).
주자/아웃 상태 없이 볼-스트라이크 카운트 run expectancy로 투구별 득점 기여를 계산한다.
투수 관점: 양수 = 실점 억제(좋음).
"""
import time
import logging
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models import Pitch
from app.services.stat_calculator import calc_percentile

_CACHE: dict = {}
_CACHE_TTL = 600

# 카운트별 run value (타자 관점, 근사 linear weights)
_COUNT_RV = {
    (0, 0): 0.000, (1, 0): 0.035, (2, 0): 0.095, (3, 0): 0.210,
    (0, 1): -0.040, (1, 1): 0.000, (2, 1): 0.060, (3, 1): 0.150,
    (0, 2): -0.105, (1, 2): -0.070, (2, 2): -0.015, (3, 2): 0.070,
}
_WALK_RV = 0.30      # 볼넷 (타자 +)
_STRIKEOUT_RV = -0.27  # 삼진 (타자 -)
_INPLAY_RV = 0.0     # 인플레이 (결과 불명 → 중립)

# 구종 → 계열
_FASTBALL = {"직구", "포심", "투심", "커터", "싱커"}
_BREAKING = {"슬라이더", "커브", "슬러브"}
_OFFSPEED = {"체인지업", "스플리터", "포크"}

_STRIKE_RESULTS = {"스트라이크", "루킹스트라이크", "헛스윙"}


def _group(pt: str) -> str:
    if pt in _FASTBALL:
        return "fastball"
    if pt in _BREAKING:
        return "breaking"
    if pt in _OFFSPEED:
        return "offspeed"
    return "other"


def _batter_rv(balls: int, strikes: int, result: str) -> float:
    """해당 투구의 타자 관점 run value."""
    before = _COUNT_RV.get((balls, strikes), 0.0)
    if result == "볼":
        if balls + 1 >= 4:
            return _WALK_RV - before
        return _COUNT_RV.get((balls + 1, strikes), 0.0) - before
    if result in _STRIKE_RESULTS:
        if strikes + 1 >= 3:
            return _STRIKEOUT_RV - before
        return _COUNT_RV.get((balls, strikes + 1), 0.0) - before
    if result == "파울":
        if strikes < 2:
            return _COUNT_RV.get((balls, strikes + 1), 0.0) - before
        return 0.0  # 2스트라이크 파울 → 변화 없음
    if result in ("인플레이", "번트"):
        return _INPLAY_RV - before
    return 0.0


def _compute(season: int, db: Session) -> dict:
    pitches = db.query(Pitch).filter(Pitch.season == season).all()

    # pitcher_id → {total, fastball, breaking, offspeed}
    agg: dict[int, dict] = defaultdict(lambda: {"total": 0.0, "fastball": 0.0, "breaking": 0.0, "offspeed": 0.0})
    for p in pitches:
        if p.pitcher_id is None or p.balls is None or p.strikes is None:
            continue
        # 투수 관점 = -(타자 관점)
        rv = -_batter_rv(p.balls, p.strikes, p.result or "")
        a = agg[p.pitcher_id]
        a["total"] += rv
        g = _group(p.pitch_type or "")
        if g in ("fastball", "breaking", "offspeed"):
            a[g] += rv

    result = {pid: {k: round(v, 2) for k, v in d.items()} for pid, d in agg.items()}

    # 퍼센타일 (높을수록 좋음)
    def pcts(field: str) -> dict[int, int]:
        league = [d[field] for d in result.values()]
        out: dict[int, int] = {}
        for pid, d in result.items():
            out[pid] = calc_percentile(d[field], league, True) if league else 50
        return out

    percentiles = {f: pcts(f) for f in ("total", "fastball", "breaking", "offspeed")}
    logging.info(f"[RunValue] 시즌 {season} 계산 완료 (투수 {len(result)}명)")
    return {"rv": result, "pcts": percentiles}


def _get(season: int, db: Session) -> dict:
    key = f"rv_{season}"
    if key in _CACHE:
        data, ts = _CACHE[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    data = _compute(season, db)
    _CACHE[key] = (data, time.time())
    return data


def get_pitcher_run_value(player_id: int, season: int, db: Session) -> dict:
    d = _get(season, db)
    rv = d["rv"].get(player_id, {"total": 0.0, "fastball": 0.0, "breaking": 0.0, "offspeed": 0.0})
    return {
        "pitching_rv": rv["total"],
        "fastball_rv": rv["fastball"],
        "breaking_rv": rv["breaking"],
        "offspeed_rv": rv["offspeed"],
        "percentiles": {
            "pitching_rv": d["pcts"]["total"].get(player_id, 50),
            "fastball_rv": d["pcts"]["fastball"].get(player_id, 50),
            "breaking_rv": d["pcts"]["breaking"].get(player_id, 50),
            "offspeed_rv": d["pcts"]["offspeed"].get(player_id, 50),
        },
    }
