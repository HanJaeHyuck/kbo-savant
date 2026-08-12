"""
ML 기대스탯 사전 계산 → DB 저장.
크롤링/시드 직후 1회 실행하면 API는 저장된 값을 읽기만 하므로
콜드 요청에서 모델을 재학습하는 비용(수 초)이 사라진다.
"""
import logging
from sqlalchemy.orm import Session
from app.models import BattingStat, PitchingStat


def precompute_expected_stats(season: int, db: Session) -> dict:
    """해당 시즌 타자 xBA/xSLG/xwOBA, 투수 xERA/허용 xBA를 계산해 스탯 테이블에 저장."""
    from app.services.expected_stats_service import _compute

    data = _compute(season, db)
    batter_x = data["batter_x"]
    pitcher_x = data["pitcher_x"]

    b_updated = 0
    for row in db.query(BattingStat).filter(BattingStat.season == season).all():
        x = batter_x.get(row.player_id)
        if not x:
            continue
        row.xba = x.get("xba")
        row.xslg = x.get("xslg")
        row.xwoba = x.get("xwoba")
        b_updated += 1

    p_updated = 0
    for row in db.query(PitchingStat).filter(PitchingStat.season == season).all():
        x = pitcher_x.get(row.player_id)
        if not x:
            continue
        row.xera = x.get("xera")
        row.allowed_xba = x.get("allowed_xba")
        p_updated += 1

    db.commit()
    logging.info(f"[Precompute] 시즌 {season} 기대스탯 저장 완료 (타자 {b_updated}, 투수 {p_updated})")
    return {"season": season, "batters": b_updated, "pitchers": p_updated}


def precompute_all(db: Session) -> list[dict]:
    """DB에 존재하는 모든 시즌에 대해 사전 계산."""
    seasons = sorted({s for (s,) in db.query(BattingStat.season).distinct().all()}
                     | {s for (s,) in db.query(PitchingStat.season).distinct().all()})
    return [precompute_expected_stats(s, db) for s in seasons]
