import logging
from sqlalchemy.orm import Session
from app.models import Pitch, BattedBall, Player


def _lookup_player_id(name: str, db: Session) -> int | None:
    if not name:
        return None
    player = db.query(Player).filter(Player.name == name).first()
    return player.id if player else None


def save_game_pitches(
    game_id: str,
    season: int,
    game_date,
    pitches: list[dict],
    db: Session,
    pitcher_id: int | None = None,
    batter_id: int | None = None,
) -> int:
    """
    투구 데이터를 DB에 저장한다.
    동일 game_id의 데이터가 이미 존재하면 0 반환 (중복 스킵).
    Returns: 저장된 투구 수
    """
    existing = db.query(Pitch).filter(Pitch.game_id == game_id).first()
    if existing:
        logging.info(f"[DB] 경기 {game_id} 투구 데이터 이미 존재, 스킵")
        return 0

    count = 0
    for p in pitches:
        pitch = Pitch(
            game_id=game_id,
            season=season,
            game_date=game_date,
            pitcher_id=pitcher_id,
            batter_id=batter_id,
            inning=p.get("inning"),
            pitch_number=p.get("pitch_number"),
            pitch_type=p.get("pitch_type"),
            velocity=p.get("velocity"),
            zone=p.get("zone"),
            plate_x=p.get("plate_x"),
            plate_z=p.get("plate_z"),
            balls=p.get("balls"),
            strikes=p.get("strikes"),
            result=p.get("result"),
        )
        db.add(pitch)
        count += 1

    db.commit()
    logging.info(f"[DB] 경기 {game_id} 투구 {count}개 저장 완료")
    return count


def save_game_batted_balls(
    game_id: str,
    season: int,
    game_date,
    batted_balls: list[dict],
    db: Session,
    batter_id: int | None = None,
    pitcher_id: int | None = None,
) -> int:
    """
    타구 데이터를 DB에 저장한다.
    동일 game_id의 데이터가 이미 존재하면 0 반환 (중복 스킵).
    Returns: 저장된 타구 수
    """
    existing = db.query(BattedBall).filter(BattedBall.game_id == game_id).first()
    if existing:
        logging.info(f"[DB] 경기 {game_id} 타구 데이터 이미 존재, 스킵")
        return 0

    count = 0
    for b in batted_balls:
        ball = BattedBall(
            game_id=game_id,
            season=season,
            game_date=game_date,
            batter_id=batter_id,
            pitcher_id=pitcher_id,
            exit_velocity=b.get("exit_velocity"),
            launch_angle=b.get("launch_angle"),
            direction=b.get("direction"),
            result=b.get("result"),
            spray_x=b.get("spray_x"),
            spray_y=b.get("spray_y"),
        )
        db.add(ball)
        count += 1

    db.commit()
    logging.info(f"[DB] 경기 {game_id} 타구 {count}개 저장 완료")
    return count
