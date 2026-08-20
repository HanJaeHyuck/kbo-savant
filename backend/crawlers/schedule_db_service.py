"""크롤링한 경기 일정/결과를 DB에 저장 (game_id 기준 upsert)."""
import logging
from sqlalchemy.orm import Session
from app.models import Game

_FIELDS = (
    "game_date", "season", "stadium", "broadcast", "start_time", "status", "status_code",
    "away_code", "home_code", "away_name", "home_name", "away_score", "home_score",
    "away_pitcher", "home_pitcher", "win_pitcher", "lose_pitcher", "save_pitcher",
)


def save_games(games: list[dict], db: Session) -> dict:
    """game_id 기준으로 신규 삽입 / 기존 갱신. 재크롤링해도 중복이 생기지 않는다."""
    inserted = updated = 0
    for g in games:
        gid = g.get("game_id")
        if not gid:
            continue
        row = db.query(Game).filter(Game.game_id == gid).first()
        if row is None:
            row = Game(game_id=gid)
            db.add(row)
            inserted += 1
        else:
            updated += 1
        for f in _FIELDS:
            if f in g:
                setattr(row, f, g[f])
    db.commit()
    logging.info(f"[KBO] 경기 저장 완료 - 신규 {inserted}, 갱신 {updated}")
    return {"inserted": inserted, "updated": updated, "total": len(games)}
