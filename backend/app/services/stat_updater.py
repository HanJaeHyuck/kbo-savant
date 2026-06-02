"""
DB의 pitch/batted_ball 원본 데이터로 지표를 계산해 stats 테이블을 업데이트한다.
크롤링 후 자동으로 호출되는 파이프라인 핵심 서비스.
"""
import logging
from sqlalchemy.orm import Session
from app.models import Player, Pitch, BattedBall, BattingStat, PitchingStat
from app.services.stat_calculator import (
    hard_hit_pct, barrel_pct, sweet_spot_pct,
    avg_ev, chase_pct, whiff_pct, csw_pct,
)


def _get_or_create_batting_stat(player_id: int, season: int, db: Session) -> BattingStat:
    stat = db.query(BattingStat).filter_by(player_id=player_id, season=season).first()
    if not stat:
        stat = BattingStat(player_id=player_id, season=season)
        db.add(stat)
    return stat


def _get_or_create_pitching_stat(player_id: int, season: int, db: Session) -> PitchingStat:
    stat = db.query(PitchingStat).filter_by(player_id=player_id, season=season).first()
    if not stat:
        stat = PitchingStat(player_id=player_id, season=season)
        db.add(stat)
    return stat


def update_batter_tracking_stats(player_id: int, season: int, db: Session) -> dict:
    """
    타자의 tracking 지표를 batted_balls/pitches 원본 데이터에서 계산해
    batting_stats 테이블에 저장한다.
    Returns: 계산된 지표 dict
    """
    balls = db.query(BattedBall).filter_by(batter_id=player_id, season=season).all()
    pitches = db.query(Pitch).filter_by(batter_id=player_id, season=season).all()

    evs = [b.exit_velocity for b in balls if b.exit_velocity is not None]
    ball_dicts = [
        {"exit_velocity": b.exit_velocity, "launch_angle": b.launch_angle}
        for b in balls if b.exit_velocity is not None
    ]
    las = [b.launch_angle for b in balls if b.launch_angle is not None]
    pitch_dicts = [{"zone": p.zone, "result": p.result} for p in pitches]

    metrics = {
        "hard_hit_pct":   hard_hit_pct(evs),
        "barrel_pct":     barrel_pct(ball_dicts, len(ball_dicts)),
        "sweet_spot_pct": sweet_spot_pct(las),
        "avg_ev":         avg_ev(evs),
        "chase_pct":      chase_pct(pitch_dicts),
        "whiff_pct":      whiff_pct(pitch_dicts),
    }

    stat = _get_or_create_batting_stat(player_id, season, db)
    for k, v in metrics.items():
        setattr(stat, k, v)
    db.commit()

    logging.info(f"[Updater] 타자 {player_id} tracking 지표 업데이트 완료")
    return metrics


def update_pitcher_tracking_stats(player_id: int, season: int, db: Session) -> dict:
    """
    투수의 tracking 지표를 pitches/batted_balls 원본 데이터에서 계산해
    pitching_stats 테이블에 저장한다.
    Returns: 계산된 지표 dict
    """
    pitches = db.query(Pitch).filter_by(pitcher_id=player_id, season=season).all()
    balls = db.query(BattedBall).filter_by(pitcher_id=player_id, season=season).all()

    pitch_dicts = [{"zone": p.zone, "result": p.result} for p in pitches]
    evs = [b.exit_velocity for b in balls if b.exit_velocity is not None]
    ball_dicts = [
        {"exit_velocity": b.exit_velocity, "launch_angle": b.launch_angle}
        for b in balls if b.exit_velocity is not None
    ]

    metrics = {
        "csw_pct":        csw_pct(pitch_dicts),
        "whiff_pct":      whiff_pct(pitch_dicts),
        "chase_pct":      chase_pct(pitch_dicts),
        "avg_ev_allowed": avg_ev(evs),
        "hard_hit_pct":   hard_hit_pct(evs),
        "barrel_pct":     barrel_pct(ball_dicts, len(ball_dicts)),
    }

    stat = _get_or_create_pitching_stat(player_id, season, db)
    for k, v in metrics.items():
        setattr(stat, k, v)
    db.commit()

    logging.info(f"[Updater] 투수 {player_id} tracking 지표 업데이트 완료")
    return metrics


def update_all_tracking_stats(season: int, db: Session) -> tuple[int, int]:
    """
    해당 시즌 모든 선수의 tracking 지표를 일괄 업데이트한다.
    Returns: (업데이트된 타자 수, 업데이트된 투수 수)
    """
    batters_updated = 0
    pitchers_updated = 0

    players = db.query(Player).all()
    for player in players:
        if player.position == "P":
            update_pitcher_tracking_stats(player.id, season, db)
            pitchers_updated += 1
        else:
            update_batter_tracking_stats(player.id, season, db)
            batters_updated += 1

    logging.info(
        f"[Updater] {season} 시즌 일괄 업데이트 완료 "
        f"(타자 {batters_updated}명, 투수 {pitchers_updated}명)"
    )
    return batters_updated, pitchers_updated
