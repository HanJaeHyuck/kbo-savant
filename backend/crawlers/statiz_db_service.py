import logging
from sqlalchemy.orm import Session
from app.models import Player, BattingStat, PitchingStat


def _get_player_id(name: str, db: Session) -> int | None:
    player = db.query(Player).filter(Player.name == name).first()
    if not player:
        logging.warning(f"[StatizDB] 선수 미발견: {name}")
        return None
    return player.id


def save_batting_stats(season: int, stats: list[dict], db: Session) -> int:
    """
    타자 세이버 스탯을 batting_stats 테이블에 저장한다.
    이미 (player_id, season) 행이 있으면 업데이트, 없으면 삽입.
    Returns: 저장/업데이트된 행 수
    """
    count = 0
    for s in stats:
        player_id = _get_player_id(s.get("name", ""), db)
        if player_id is None:
            continue

        existing = db.query(BattingStat).filter_by(
            player_id=player_id, season=season
        ).first()

        fields = dict(
            games=s.get("games"), pa=s.get("pa"), ab=s.get("ab"),
            hits=s.get("hits"), doubles=s.get("doubles"), triples=s.get("triples"),
            hr=s.get("hr"), rbi=s.get("rbi"), sb=s.get("sb"),
            bb=s.get("bb"), k=s.get("k"),
            avg=s.get("avg"), obp=s.get("obp"), slg=s.get("slg"), ops=s.get("ops"),
            woba=s.get("woba"), wrc_plus=s.get("wrc_plus"),
            babip=s.get("babip"), war=s.get("war"),
        )

        if existing:
            for k, v in fields.items():
                if v is not None:
                    setattr(existing, k, v)
        else:
            db.add(BattingStat(player_id=player_id, season=season, **fields))

        count += 1

    db.commit()
    logging.info(f"[StatizDB] 타자 스탯 {count}명 저장 완료 ({season})")
    return count


def save_pitching_stats(season: int, stats: list[dict], db: Session) -> int:
    """
    투수 세이버 스탯을 pitching_stats 테이블에 저장한다.
    이미 (player_id, season) 행이 있으면 업데이트, 없으면 삽입.
    Returns: 저장/업데이트된 행 수
    """
    count = 0
    for s in stats:
        player_id = _get_player_id(s.get("name", ""), db)
        if player_id is None:
            continue

        existing = db.query(PitchingStat).filter_by(
            player_id=player_id, season=season
        ).first()

        fields = dict(
            games=s.get("games"), gs=s.get("gs"),
            wins=s.get("wins"), losses=s.get("losses"), saves=s.get("saves"),
            ip=s.get("ip"), era=s.get("era"), fip=s.get("fip"), xfip=s.get("xfip"),
            era_minus=s.get("era_minus"), fip_minus=s.get("fip_minus"),
            k_pct=s.get("k_pct"), bb_pct=s.get("bb_pct"), hr9=s.get("hr9"),
            babip=s.get("babip"), lob_pct=s.get("lob_pct"), war=s.get("war"),
        )

        if existing:
            for k, v in fields.items():
                if v is not None:
                    setattr(existing, k, v)
        else:
            db.add(PitchingStat(player_id=player_id, season=season, **fields))

        count += 1

    db.commit()
    logging.info(f"[StatizDB] 투수 스탯 {count}명 저장 완료 ({season})")
    return count
