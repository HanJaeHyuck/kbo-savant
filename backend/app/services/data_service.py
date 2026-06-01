from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.models import Player, BattingStat, PitchingStat, Pitch, BattedBall
from app.schemas.stats import (
    BattingStatsResponse, ClassicBattingStats, SaberBattingStats, TrackingBattingStats,
    PitchingStatsResponse, ClassicPitchingStats, SaberPitchingStats, TrackingPitchingStats,
)


def get_batting_stats_response(player_id: int, season: int, db: Session) -> dict:
    stat = (
        db.query(BattingStat)
        .filter(BattingStat.player_id == player_id, BattingStat.season == season)
        .first()
    )
    if not stat:
        classic = {}
        saber = {}
        tracking = {}
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
            "hard_hit_pct": stat.hard_hit_pct,
            "barrel_pct": stat.barrel_pct,
            "sweet_spot_pct": stat.sweet_spot_pct,
            "avg_ev": stat.avg_ev,
            "chase_pct": stat.chase_pct,
            "whiff_pct": stat.whiff_pct,
        }

    all_war = [r.war for r in db.query(BattingStat.war).filter(
        BattingStat.season == season, BattingStat.war.isnot(None)
    ).all()]
    percentiles = {"war": 50, "wrc_plus": 50, "hard_hit_pct": 50, "barrel_pct": 50, "avg_ev": 50}

    return {
        "player_id": player_id,
        "season": season,
        "classic": classic,
        "sabermetrics": saber,
        "tracking": tracking,
        "percentiles": percentiles,
    }


def get_pitching_stats_response(player_id: int, season: int, db: Session) -> dict:
    stat = (
        db.query(PitchingStat)
        .filter(PitchingStat.player_id == player_id, PitchingStat.season == season)
        .first()
    )
    if not stat:
        classic = {}
        saber = {}
        tracking = {}
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
            "hard_hit_pct": stat.hard_hit_pct,
            "barrel_pct": stat.barrel_pct,
            "csw_pct": stat.csw_pct,
            "whiff_pct": stat.whiff_pct,
            "chase_pct": stat.chase_pct,
        }

    percentiles = {"era_minus": 50, "fip": 50, "hard_hit_pct": 50, "csw_pct": 50, "war": 50}

    return {
        "player_id": player_id,
        "season": season,
        "classic": classic,
        "sabermetrics": saber,
        "tracking": tracking,
        "percentiles": percentiles,
    }


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
            pitch_type_map[pt] = {"count": 0, "velocities": []}
        pitch_type_map[pt]["count"] += 1
        if p.velocity:
            pitch_type_map[pt]["velocities"].append(p.velocity)

    pitch_mix = []
    for pt, data in pitch_type_map.items():
        avg_v = round(sum(data["velocities"]) / len(data["velocities"]), 1) if data["velocities"] else 0.0
        pitch_mix.append({
            "pitch_type": pt,
            "count": data["count"],
            "pct": round(data["count"] / total * 100, 1) if total else 0.0,
            "avg_velocity": avg_v,
        })

    zone_map: dict = {}
    for p in pitches:
        if p.zone is None:
            continue
        if p.zone not in zone_map:
            zone_map[p.zone] = {"pitches": 0, "hits": 0, "whiffs": 0, "swings": 0}
        zone_map[p.zone]["pitches"] += 1
        if p.result == "인플레이":
            zone_map[p.zone]["hits"] += 1
        if p.result == "헛스윙":
            zone_map[p.zone]["whiffs"] += 1
            zone_map[p.zone]["swings"] += 1
        elif p.result in ("파울", "인플레이", "번트"):
            zone_map[p.zone]["swings"] += 1

    zone_data = []
    for zone, data in zone_map.items():
        batting_avg = round(data["hits"] / data["pitches"], 3) if data["pitches"] else 0.0
        whiff = round(data["whiffs"] / data["swings"] * 100, 1) if data["swings"] else 0.0
        zone_data.append({
            "zone": zone,
            "pitches": data["pitches"],
            "batting_avg": batting_avg,
            "whiff_pct": whiff,
        })

    velocity_trend: list = []

    return {
        "player_id": player_id,
        "season": season,
        "total_pitches": total,
        "pitch_mix": pitch_mix,
        "zone_data": zone_data,
        "velocity_trend": velocity_trend,
    }


def get_batted_balls_response(player_id: int, season: int, db: Session) -> dict:
    balls = (
        db.query(BattedBall)
        .filter(BattedBall.batter_id == player_id, BattedBall.season == season)
        .all()
    )
    spray_data = [
        {
            "spray_x": b.spray_x,
            "spray_y": b.spray_y,
            "result": b.result,
            "exit_velocity": b.exit_velocity,
            "launch_angle": b.launch_angle,
        }
        for b in balls
    ]

    return {
        "player_id": player_id,
        "season": season,
        "total": len(balls),
        "spray_data": spray_data,
        "zone_avg": [],
    }
