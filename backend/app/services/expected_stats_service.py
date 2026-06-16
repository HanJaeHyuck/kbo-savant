"""
리그 전체 기대 스탯(xBA/xSLG/xwOBA, 투수 xERA) 및 퍼센타일 계산.
시즌별로 1회 학습 후 캐시(10분).
"""
import time
import logging
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models import BattedBall
from app.services.ml_models import KBOExpectedStats
from app.services.stat_calculator import calc_percentile

_CACHE: dict = {}
_CACHE_TTL = 600

# 리그 평균 xwOBA 기준 (xERA 환산용 근사)
_LEAGUE_XWOBA_BASE = 0.320
_LEAGUE_ERA_BASE = 4.00


def _compute(season: int, db: Session) -> dict:
    balls = db.query(BattedBall).filter(BattedBall.season == season).all()
    rows = [
        {
            "batter_id": b.batter_id,
            "pitcher_id": b.pitcher_id,
            "exit_velocity": b.exit_velocity,
            "launch_angle": b.launch_angle,
            "result": b.result,
        }
        for b in balls
    ]

    model = KBOExpectedStats()
    trained = model.train(rows)

    batter_x: dict[int, dict] = {}
    pitcher_x: dict[int, dict] = {}

    if trained:
        by_batter = defaultdict(list)
        by_pitcher = defaultdict(list)
        for r in rows:
            if r["batter_id"] is not None:
                by_batter[r["batter_id"]].append(r)
            if r["pitcher_id"] is not None:
                by_pitcher[r["pitcher_id"]].append(r)

        for bid, bb in by_batter.items():
            batter_x[bid] = {
                "xba": model.calc_player_xba(bb),
                "xslg": model.calc_player_xslg(bb),
                "xwoba": model.calc_player_xwoba(bb),
            }

        for pid, pb in by_pitcher.items():
            allowed_xwoba = model.calc_player_xwoba(pb)
            allowed_xba = model.calc_player_xba(pb)
            xera = None
            if allowed_xwoba is not None:
                xera = round(
                    max(1.50, min(9.00, allowed_xwoba / _LEAGUE_XWOBA_BASE * _LEAGUE_ERA_BASE)),
                    2,
                )
            pitcher_x[pid] = {"allowed_xba": allowed_xba, "xera": xera}

    # 퍼센타일 (xBA/xSLG/xwOBA: 높을수록 좋음 / xERA: 낮을수록 좋음)
    def pcts(values_by_player: dict, field: str, higher: bool) -> dict[int, int]:
        league = [v[field] for v in values_by_player.values() if v.get(field) is not None]
        out: dict[int, int] = {}
        for pid, v in values_by_player.items():
            if v.get(field) is None or not league:
                out[pid] = 50
            else:
                out[pid] = calc_percentile(v[field], league, higher)
        return out

    batter_pcts = {
        "xba": pcts(batter_x, "xba", True),
        "xslg": pcts(batter_x, "xslg", True),
        "xwoba": pcts(batter_x, "xwoba", True),
    }
    pitcher_pcts = {
        "xera": pcts(pitcher_x, "xera", False),
        "allowed_xba": pcts(pitcher_x, "allowed_xba", False),
    }

    logging.info(f"[xStats] 시즌 {season} 기대스탯 계산 완료 (타자 {len(batter_x)}, 투수 {len(pitcher_x)})")
    return {
        "batter_x": batter_x, "pitcher_x": pitcher_x,
        "batter_pcts": batter_pcts, "pitcher_pcts": pitcher_pcts,
        "model": model if trained else None,
    }


def get_model(season: int, db: Session):
    """시즌 학습된 KBOExpectedStats 모델 반환 (없으면 None). 구종별 기대스탯 계산용."""
    return _get(season, db).get("model")


def _get(season: int, db: Session) -> dict:
    key = f"xstats_{season}"
    if key in _CACHE:
        data, ts = _CACHE[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    data = _compute(season, db)
    _CACHE[key] = (data, time.time())
    return data


def get_batter_expected(player_id: int, season: int, db: Session) -> dict:
    """타자 기대스탯 + 퍼센타일."""
    d = _get(season, db)
    x = d["batter_x"].get(player_id, {})
    return {
        "xba": x.get("xba"),
        "xslg": x.get("xslg"),
        "xwoba": x.get("xwoba"),
        "percentiles": {
            "xba": d["batter_pcts"]["xba"].get(player_id, 50),
            "xslg": d["batter_pcts"]["xslg"].get(player_id, 50),
            "xwoba": d["batter_pcts"]["xwoba"].get(player_id, 50),
        },
    }


def get_pitcher_expected(player_id: int, season: int, db: Session) -> dict:
    """투수 xERA + 퍼센타일."""
    d = _get(season, db)
    x = d["pitcher_x"].get(player_id, {})
    return {
        "xera": x.get("xera"),
        "allowed_xba": x.get("allowed_xba"),
        "percentiles": {
            "xera": d["pitcher_pcts"]["xera"].get(player_id, 50),
            "allowed_xba": d["pitcher_pcts"]["allowed_xba"].get(player_id, 50),
        },
    }
