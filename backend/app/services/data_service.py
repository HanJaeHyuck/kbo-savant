import time
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Player, BattingStat, PitchingStat, Pitch, BattedBall

# ── 퍼센타일 인메모리 캐시 (5분 TTL) ─────────────────
_CACHE: dict = {}
_CACHE_TTL = 300


def _cached_batting_percentiles(season: int, db: Session) -> dict:
    from app.services.percentile_service import compute_batting_percentiles
    key = f"batting_{season}"
    if key in _CACHE:
        data, ts = _CACHE[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    data = compute_batting_percentiles(season, db)
    _CACHE[key] = (data, time.time())
    return data


def _cached_pitching_percentiles(season: int, db: Session) -> dict:
    from app.services.percentile_service import compute_pitching_percentiles
    key = f"pitching_{season}"
    if key in _CACHE:
        data, ts = _CACHE[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    data = compute_pitching_percentiles(season, db)
    _CACHE[key] = (data, time.time())
    return data


# ── 타자 ─────────────────────────────────────────────

def get_batting_stats_response(player_id: int, season: int, db: Session) -> dict:
    stat = (
        db.query(BattingStat)
        .filter(BattingStat.player_id == player_id, BattingStat.season == season)
        .first()
    )
    if not stat:
        classic, saber, tracking = {}, {}, {}
    else:
        classic = {
            "games": stat.games, "pa": stat.pa, "avg": stat.avg,
            "obp": stat.obp, "slg": stat.slg, "ops": stat.ops,
            "hr": stat.hr, "rbi": stat.rbi, "sb": stat.sb,
        }
        saber = {
            "woba": stat.woba, "wrc_plus": stat.wrc_plus,
            "babip": stat.babip, "war": stat.war,
        }
        tracking = {
            "hard_hit_pct":   stat.hard_hit_pct,
            "barrel_pct":     stat.barrel_pct,
            "sweet_spot_pct": stat.sweet_spot_pct,
            "avg_ev":         stat.avg_ev,
            "chase_pct":      stat.chase_pct,
            "whiff_pct":      stat.whiff_pct,
        }

    # 실제 퍼센타일 (리그 내 위치)
    all_pcts = _cached_batting_percentiles(season, db)
    raw = all_pcts.get(player_id, {})

    # 기대 스탯 (xBA/xSLG/xwOBA)
    from app.services.expected_stats_service import get_batter_expected
    xs = get_batter_expected(player_id, season, db)
    if stat:
        tracking["xba"] = xs["xba"]
        tracking["xslg"] = xs["xslg"]
        tracking["xwoba"] = xs["xwoba"]

    percentiles = {
        "war":          raw.get("war", 50),
        "wrc_plus":     raw.get("wrc_plus", 50),
        "ops":          raw.get("ops", 50),
        "babip":        raw.get("babip", 50),
        "hard_hit_pct": raw.get("hard_hit_pct", 50),
        "barrel_pct":   raw.get("barrel_pct", 50),
        "avg_ev":       raw.get("avg_ev", 50),
        "sweet_spot_pct": raw.get("sweet_spot_pct", 50),
        "chase_pct":    raw.get("chase_pct", 50),
        "whiff_pct":    raw.get("whiff_pct", 50),
        "xba":          xs["percentiles"]["xba"],
        "xslg":         xs["percentiles"]["xslg"],
        "xwoba":        xs["percentiles"]["xwoba"],
    }

    return {
        "player_id": player_id,
        "season": season,
        "classic": classic,
        "sabermetrics": saber,
        "tracking": tracking,
        "percentiles": percentiles,
    }


def get_career_batting_response(player_id: int, db: Session) -> list[dict]:
    """선수의 연도별 타자 스탯 전체 반환"""
    rows = (
        db.query(BattingStat)
        .filter(BattingStat.player_id == player_id)
        .order_by(BattingStat.season.desc())
        .all()
    )
    return [
        {
            "season":      r.season,
            "games":       r.games,
            "pa":          r.pa,
            "avg":         r.avg,
            "obp":         r.obp,
            "slg":         r.slg,
            "ops":         r.ops,
            "hr":          r.hr,
            "rbi":         r.rbi,
            "sb":          r.sb,
            "woba":        r.woba,
            "wrc_plus":    r.wrc_plus,
            "babip":       r.babip,
            "war":         r.war,
            "hard_hit_pct":   r.hard_hit_pct,
            "barrel_pct":     r.barrel_pct,
            "sweet_spot_pct": r.sweet_spot_pct,
            "avg_ev":         r.avg_ev,
            "chase_pct":      r.chase_pct,
            "whiff_pct":      r.whiff_pct,
        }
        for r in rows
    ]


# ── 투수 ─────────────────────────────────────────────

def get_pitching_stats_response(player_id: int, season: int, db: Session) -> dict:
    stat = (
        db.query(PitchingStat)
        .filter(PitchingStat.player_id == player_id, PitchingStat.season == season)
        .first()
    )
    if not stat:
        classic, saber, tracking = {}, {}, {}
    else:
        classic = {
            "games": stat.games, "gs": stat.gs, "ip": stat.ip,
            "wins": stat.wins, "losses": stat.losses, "era": stat.era,
        }
        saber = {
            "fip": stat.fip, "xfip": stat.xfip,
            "era_minus": stat.era_minus, "fip_minus": stat.fip_minus,
            "k_pct": stat.k_pct, "bb_pct": stat.bb_pct,
            "babip": stat.babip, "war": stat.war,
        }
        tracking = {
            "avg_ev_allowed": stat.avg_ev_allowed,
            "hard_hit_pct":   stat.hard_hit_pct,
            "barrel_pct":     stat.barrel_pct,
            "csw_pct":        stat.csw_pct,
            "whiff_pct":      stat.whiff_pct,
            "chase_pct":      stat.chase_pct,
            "arm_angle":      stat.arm_angle,
        }

    all_pcts = _cached_pitching_percentiles(season, db)
    raw = all_pcts.get(player_id, {})

    # 기대 스탯(xERA) + Run Value
    from app.services.expected_stats_service import get_pitcher_expected
    from app.services.run_value_service import get_pitcher_run_value
    xs = get_pitcher_expected(player_id, season, db)
    rv = get_pitcher_run_value(player_id, season, db)
    if stat:
        tracking["xera"] = xs["xera"]
    run_value = {
        "pitching_rv": rv["pitching_rv"],
        "fastball_rv": rv["fastball_rv"],
        "breaking_rv": rv["breaking_rv"],
        "offspeed_rv": rv["offspeed_rv"],
    }

    percentiles = {
        "war":          raw.get("war", 50),
        "era_minus":    raw.get("era_minus", 50),
        "fip":          raw.get("fip", 50),
        "fip_minus":    raw.get("fip_minus", 50),
        "csw_pct":      raw.get("csw_pct", 50),
        "whiff_pct":    raw.get("whiff_pct", 50),
        "k_pct":        raw.get("k_pct", 50),
        "chase_pct":    raw.get("chase_pct", 50),
        "hard_hit_pct": raw.get("hard_hit_pct", 50),
        "barrel_pct":   raw.get("barrel_pct", 50),
        "avg_ev_allowed": raw.get("avg_ev_allowed", 50),
        "bb_pct":       raw.get("bb_pct", 50),
        "babip":        raw.get("babip", 50),
        "xera":         xs["percentiles"]["xera"],
        "pitching_rv":  rv["percentiles"]["pitching_rv"],
        "fastball_rv":  rv["percentiles"]["fastball_rv"],
        "breaking_rv":  rv["percentiles"]["breaking_rv"],
        "offspeed_rv":  rv["percentiles"]["offspeed_rv"],
    }

    return {
        "player_id": player_id,
        "season": season,
        "classic": classic,
        "sabermetrics": saber,
        "tracking": tracking,
        "run_value": run_value,
        "percentiles": percentiles,
    }


def get_career_pitching_response(player_id: int, db: Session) -> list[dict]:
    """선수의 연도별 투수 스탯 전체 반환"""
    rows = (
        db.query(PitchingStat)
        .filter(PitchingStat.player_id == player_id)
        .order_by(PitchingStat.season.desc())
        .all()
    )
    return [
        {
            "season":   r.season,
            "games":    r.games,
            "gs":       r.gs,
            "ip":       r.ip,
            "wins":     r.wins,
            "losses":   r.losses,
            "era":      r.era,
            "fip":      r.fip,
            "xfip":     r.xfip,
            "era_minus": r.era_minus,
            "fip_minus": r.fip_minus,
            "k_pct":    r.k_pct,
            "bb_pct":   r.bb_pct,
            "babip":    r.babip,
            "lob_pct":  r.lob_pct,
            "war":      r.war,
            "csw_pct":  r.csw_pct,
            "whiff_pct": r.whiff_pct,
            "chase_pct": r.chase_pct,
            "avg_ev_allowed": r.avg_ev_allowed,
            "hard_hit_pct":   r.hard_hit_pct,
            "barrel_pct":     r.barrel_pct,
        }
        for r in rows
    ]


# ── 투구 / 타구 ───────────────────────────────────────

def get_pitches_response(player_id: int, season: int, db: Session) -> dict:
    pitches = (
        db.query(Pitch)
        .filter(Pitch.pitcher_id == player_id, Pitch.season == season)
        .all()
    )
    total = len(pitches)

    pitch_type_map: dict = {}
    for p in pitches:
        pt = p.pitch_type or "기타"
        if pt not in pitch_type_map:
            pitch_type_map[pt] = {"count": 0, "velocities": [], "hb": [], "vb": []}
        pitch_type_map[pt]["count"] += 1
        if p.velocity:
            pitch_type_map[pt]["velocities"].append(p.velocity)
        if p.h_break is not None:
            pitch_type_map[pt]["hb"].append(p.h_break)
        if p.v_break is not None:
            pitch_type_map[pt]["vb"].append(p.v_break)

    pitch_mix = [
        {
            "pitch_type":   pt,
            "count":        d["count"],
            "pct":          round(d["count"] / total * 100, 1) if total else 0.0,
            "avg_velocity": round(sum(d["velocities"]) / len(d["velocities"]), 1)
                            if d["velocities"] else 0.0,
        }
        for pt, d in pitch_type_map.items()
    ]

    zone_map: dict = {}
    for p in pitches:
        if p.zone is None:
            continue
        z = zone_map.setdefault(p.zone, {"pitches": 0, "hits": 0, "whiffs": 0, "swings": 0})
        z["pitches"] += 1
        if p.result == "인플레이":
            z["hits"] += 1
        if p.result == "헛스윙":
            z["whiffs"] += 1
            z["swings"] += 1
        elif p.result in ("파울", "번트"):
            z["swings"] += 1

    zone_data = [
        {
            "zone":        zone,
            "pitches":     d["pitches"],
            "batting_avg": round(d["hits"] / d["pitches"], 3) if d["pitches"] else 0.0,
            "whiff_pct":   round(d["whiffs"] / d["swings"] * 100, 1) if d["swings"] else 0.0,
        }
        for zone, d in zone_map.items()
    ]

    # 구종별 무브먼트 프로파일 (avg h_break × v_break)
    def _avg(xs):
        return round(sum(xs) / len(xs), 1) if xs else 0.0
    movement = [
        {
            "pitch_type":   pt,
            "count":        d["count"],
            "pct":          round(d["count"] / total * 100, 1) if total else 0.0,
            "avg_velocity": round(sum(d["velocities"]) / len(d["velocities"]), 1) if d["velocities"] else 0.0,
            "h_break":      _avg(d["hb"]),
            "v_break":      _avg(d["vb"]),
        }
        for pt, d in pitch_type_map.items()
    ]

    # 날짜별 구속 트렌드 (전체 + 구종별 멀티시리즈)
    from collections import defaultdict
    date_all: dict = defaultdict(list)
    date_type: dict = defaultdict(lambda: defaultdict(list))
    for p in pitches:
        if p.velocity and p.game_date:
            date_all[p.game_date].append(p.velocity)
            date_type[p.game_date][p.pitch_type or "기타"].append(p.velocity)
    velocity_trend = []
    for d in sorted(date_all.keys()):
        row = {"game_date": str(d), "avg_velocity": round(sum(date_all[d]) / len(date_all[d]), 1)}
        for pt, vs in date_type[d].items():
            row[pt] = round(sum(vs) / len(vs), 1)
        velocity_trend.append(row)

    # 투구 탄착군 (raw 좌표 + 상대 타자/구속)
    batter_ids = {p.batter_id for p in pitches if p.batter_id is not None}
    name_map: dict = {}
    bats_map: dict = {}
    if batter_ids:
        for row in db.query(Player.id, Player.name, Player.bats).filter(Player.id.in_(batter_ids)).all():
            name_map[row.id] = row.name
            bats_map[row.id] = row.bats
    locations = [
        {
            "plate_x":    p.plate_x,
            "plate_z":    p.plate_z,
            "pitch_type": p.pitch_type or "기타",
            "result":     p.result,
            "velocity":   p.velocity,
            "batter":     name_map.get(p.batter_id, "—"),
        }
        for p in pitches
        if p.plate_x is not None and p.plate_z is not None
    ]

    # 볼카운트별 구종 구성
    count_map: dict = {}
    for p in pitches:
        if p.balls is None or p.strikes is None:
            continue
        key = f"{p.balls}-{p.strikes}"
        c = count_map.setdefault(key, {"pitches": 0, "types": {}})
        c["pitches"] += 1
        pt = p.pitch_type or "기타"
        c["types"][pt] = c["types"].get(pt, 0) + 1

    count_breakdown = [
        {
            "count":    key,
            "pitches":  d["pitches"],
            "breakdown": sorted(
                [
                    {"pitch_type": pt, "pct": round(n / d["pitches"] * 100, 1)}
                    for pt, n in d["types"].items()
                ],
                key=lambda x: -x["pct"],
            ),
        }
        for key, d in sorted(count_map.items())
    ]

    # 좌/우 타자별 구종 사용률
    hand_type: dict = {"L": {}, "R": {}}
    hand_total: dict = {"L": 0, "R": 0}
    for p in pitches:
        hand = bats_map.get(p.batter_id)
        if hand not in ("L", "R"):
            continue
        pt = p.pitch_type or "기타"
        hand_type[hand][pt] = hand_type[hand].get(pt, 0) + 1
        hand_total[hand] += 1
    usage_splits = {
        side: sorted(
            [
                {"pitch_type": pt, "pct": round(n / hand_total[side] * 100, 1)}
                for pt, n in hand_type[side].items()
            ],
            key=lambda x: -x["pct"],
        )
        for side in ("L", "R")
    }

    return {
        "player_id":      player_id,
        "season":         season,
        "total_pitches":  total,
        "pitch_mix":      pitch_mix,
        "zone_data":      zone_data,
        "velocity_trend": velocity_trend,
        "locations":      locations,
        "count_breakdown": count_breakdown,
        "movement":       movement,
        "usage_splits":   usage_splits,
    }


def get_batted_balls_response(player_id: int, season: int, db: Session) -> dict:
    balls = (
        db.query(BattedBall)
        .filter(BattedBall.batter_id == player_id, BattedBall.season == season)
        .all()
    )
    spray_data = [
        {
            "spray_x":      b.spray_x,
            "spray_y":      b.spray_y,
            "result":       b.result,
            "exit_velocity": b.exit_velocity,
            "launch_angle": b.launch_angle,
        }
        for b in balls
    ]

    # 존별 타율
    zone_map: dict = {}
    for b in balls:
        if b.launch_angle is None:
            continue
        # 발사각으로 간단한 존 분류 (실제는 타구 방향 기반)
        direction = b.direction or "중"
        z = zone_map.setdefault(direction, {"attempts": 0, "hits": 0})
        z["attempts"] += 1
        if b.result in ("안타", "2루타", "3루타", "홈런"):
            z["hits"] += 1

    zone_avg = [
        {
            "zone":     direction,
            "avg":      round(d["hits"] / d["attempts"], 3) if d["attempts"] else 0.0,
            "attempts": d["attempts"],
        }
        for direction, d in zone_map.items()
    ]

    return {
        "player_id":  player_id,
        "season":     season,
        "total":      len(balls),
        "spray_data": spray_data,
        "zone_avg":   zone_avg,
    }
