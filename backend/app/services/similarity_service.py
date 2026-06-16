"""
선수 유사도 (Player Similarity).
같은 포지션군(투수/타자) 내에서 스탯 프로필을 z-score 정규화 후
유클리드 거리로 비교 → 가장 닮은 선수 Top N 반환.
"""
import math
from sqlalchemy.orm import Session
from app.models import Player, BattingStat, PitchingStat

# 유사도 계산에 쓰는 피처 (없으면 리그 평균 대체)
PITCHER_FEATURES = [
    "era", "fip", "k_pct", "bb_pct", "whiff_pct", "csw_pct",
    "chase_pct", "gb_pct", "hard_hit_pct", "fastball_velo", "war", "arm_angle",
]
BATTER_FEATURES = [
    "avg", "obp", "slg", "woba", "wrc_plus", "hard_hit_pct",
    "barrel_pct", "avg_ev", "sweet_spot_pct", "chase_pct", "whiff_pct", "war",
]


def _zstats(rows, features):
    """피처별 평균/표준편차."""
    stats = {}
    for f in features:
        vals = [getattr(r, f) for r in rows if getattr(r, f) is not None]
        if vals:
            mean = sum(vals) / len(vals)
            var = sum((v - mean) ** 2 for v in vals) / len(vals)
            stats[f] = (mean, math.sqrt(var) or 1.0)
        else:
            stats[f] = (0.0, 1.0)
    return stats


def _vector(row, features, zs):
    v = []
    for f in features:
        mean, std = zs[f]
        raw = getattr(row, f)
        v.append(((raw if raw is not None else mean) - mean) / std)
    return v


def _distance(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def get_similar_players(player_id: int, season: int, db: Session, limit: int = 5) -> dict:
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        return {"player_id": player_id, "season": season, "similar": []}

    is_pitcher = player.position == "P"
    Model = PitchingStat if is_pitcher else BattingStat
    features = PITCHER_FEATURES if is_pitcher else BATTER_FEATURES

    rows = db.query(Model).filter(Model.season == season).all()
    target = next((r for r in rows if r.player_id == player_id), None)
    if not target or len(rows) < 2:
        return {"player_id": player_id, "season": season, "similar": []}

    zs = _zstats(rows, features)
    tvec = _vector(target, features, zs)

    # 후보 선수 메타 (포지션 동일군)
    cand_ids = [r.player_id for r in rows if r.player_id != player_id]
    pmap = {
        p.id: p for p in db.query(Player).filter(Player.id.in_(cand_ids)).all()
    }
    # 투수는 투수끼리, 타자는 타자끼리만 (Model 자체가 분리되지만 안전 차원)
    scored = []
    max_d = math.sqrt(len(features)) * 2  # 정규화 스케일
    for r in rows:
        if r.player_id == player_id or r.player_id not in pmap:
            continue
        d = _distance(tvec, _vector(r, features, zs))
        score = round(100 * math.exp(-d / max_d), 1)
        p = pmap[r.player_id]
        if is_pitcher:
            display = {
                "era": r.era, "fip": r.fip, "k_pct": r.k_pct,
                "fastball_velo": r.fastball_velo, "war": r.war,
            }
        else:
            display = {
                "avg": r.avg, "ops": r.ops, "wrc_plus": r.wrc_plus,
                "hr": r.hr, "war": r.war,
            }
        scored.append({
            "player_id": p.id,
            "name": p.name,
            "team": p.team,
            "position": p.position,
            "similarity": score,
            "stats": display,
        })

    scored.sort(key=lambda x: -x["similarity"])
    return {
        "player_id": player_id,
        "season": season,
        "is_pitcher": is_pitcher,
        "similar": scored[:limit],
    }
