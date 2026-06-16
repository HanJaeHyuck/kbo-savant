"""
투수 구종별 트래킹 테이블 (Baseball Savant 'Pitch Tracking' 스타일).
연도 × 구종별로 투구 카운트/구속/스핀/Whiff/PutAway + 허용 타구질(BA/SLG/wOBA/xBA/xSLG/xwOBA/EV/LA)을 집계.
"""
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models import Pitch, BattedBall, Player

# 타구 결과 분류
_HIT = {"안타", "2루타", "3루타", "홈런"}
_TB = {"안타": 1, "2루타": 2, "3루타": 3, "홈런": 4}
# 구종 정렬 우선순위 (사용 많은 순으로 다시 정렬되므로 참고용)
_SWING = {"헛스윙", "파울", "인플레이", "번트"}


def get_pitch_arsenal(player_id: int, db: Session) -> dict:
    """연도 내림차순, 구종은 시즌 내 투구수 내림차순 정렬."""
    pitches = (
        db.query(Pitch)
        .filter(Pitch.pitcher_id == player_id)
        .all()
    )
    balls = (
        db.query(BattedBall)
        .filter(BattedBall.pitcher_id == player_id)
        .all()
    )
    if not pitches:
        return {"player_id": player_id, "rows": []}

    # 상대 타자 좌/우 핸드
    batter_ids = {p.batter_id for p in pitches if p.batter_id is not None}
    bats_map: dict = {}
    if batter_ids:
        for row in db.query(Player.id, Player.bats).filter(Player.id.in_(batter_ids)).all():
            bats_map[row.id] = row.bats

    # ── 투구 집계: (season, pitch_type) ──
    pgroup: dict = defaultdict(lambda: {
        "count": 0, "rhb": 0, "lhb": 0, "velo": [], "spin": [],
        "swings": 0, "whiffs": 0, "two_strike": 0, "so": 0,
    })
    season_total: dict = defaultdict(int)
    for p in pitches:
        pt = p.pitch_type or "기타"
        key = (p.season, pt)
        g = pgroup[key]
        g["count"] += 1
        season_total[p.season] += 1
        hand = bats_map.get(p.batter_id)
        if hand == "R":
            g["rhb"] += 1
        elif hand == "L":
            g["lhb"] += 1
        if p.velocity:
            g["velo"].append(p.velocity)
        if p.spin_rate:
            g["spin"].append(p.spin_rate)
        if p.result in _SWING:
            g["swings"] += 1
        if p.result == "헛스윙":
            g["whiffs"] += 1
        if p.strikes == 2:
            g["two_strike"] += 1
            if p.result in ("헛스윙", "루킹스트라이크"):
                g["so"] += 1

    # ── 허용 타구 집계: (season, pitch_type) ──
    bgroup: dict = defaultdict(lambda: {"rows": [], "h": 0, "b2": 0, "b3": 0, "hr": 0, "ev": [], "la": []})
    for b in balls:
        pt = b.pitch_type or "기타"
        key = (b.season, pt)
        g = bgroup[key]
        g["rows"].append({"exit_velocity": b.exit_velocity, "launch_angle": b.launch_angle, "result": b.result})
        if b.result in _HIT:
            g["h"] += 1
        if b.result == "2루타":
            g["b2"] += 1
        elif b.result == "3루타":
            g["b3"] += 1
        elif b.result == "홈런":
            g["hr"] += 1
        if b.exit_velocity is not None:
            g["ev"].append(b.exit_velocity)
        if b.launch_angle is not None:
            g["la"].append(b.launch_angle)

    # 시즌별 기대스탯 모델 (구종별 xBA/xSLG/xwOBA)
    from app.services.expected_stats_service import get_model

    def _avg(xs, d=1):
        return round(sum(xs) / len(xs), d) if xs else None

    seasons = sorted(season_total.keys(), reverse=True)
    rows = []
    for season in seasons:
        model = get_model(season, db)
        types = sorted(
            [pt for (s, pt) in pgroup if s == season],
            key=lambda pt: -pgroup[(season, pt)]["count"],
        )
        for pt in types:
            pg = pgroup[(season, pt)]
            bg = bgroup.get((season, pt), {"rows": [], "h": 0, "b2": 0, "b3": 0, "hr": 0, "ev": [], "la": []})
            bbe = len(bg["rows"])
            so = pg["so"]
            ab = bbe + so
            h, b2, b3, hr = bg["h"], bg["b2"], bg["b3"], bg["hr"]
            b1 = h - b2 - b3 - hr
            # 볼넷 근사 (3볼에서 볼 → BB)
            tb = b1 + 2 * b2 + 3 * b3 + 4 * hr
            ba = round(h / ab, 3) if ab else None
            slg = round(tb / ab, 3) if ab else None
            # contact wOBA 근사
            woba_num = 0.88 * b1 + 1.24 * b2 + 1.56 * b3 + 2.0 * hr
            woba = round(woba_num / ab, 3) if ab else None

            xba = model.calc_player_xba(bg["rows"]) if model and bg["rows"] else None
            xslg = model.calc_player_xslg(bg["rows"]) if model and bg["rows"] else None
            xwoba = model.calc_player_xwoba(bg["rows"]) if model and bg["rows"] else None

            rows.append({
                "season":     season,
                "pitch_type": pt,
                "count":      pg["count"],
                "rhb":        pg["rhb"],
                "lhb":        pg["lhb"],
                "pct":        round(pg["count"] / season_total[season] * 100, 1) if season_total[season] else 0.0,
                "velocity":   _avg(pg["velo"], 1),
                "spin":       int(_avg(pg["spin"], 0)) if pg["spin"] else None,
                "pa":         ab,            # 단순화: PA≈AB (BB 근사 생략)
                "ab":         ab,
                "h":          h,
                "b2":         b2,
                "b3":         b3,
                "hr":         hr,
                "so":         so,
                "bbe":        bbe,
                "ba":         ba,
                "xba":        xba,
                "slg":        slg,
                "xslg":       xslg,
                "woba":       woba,
                "xwoba":      xwoba,
                "ev":         _avg(bg["ev"], 1),
                "la":         _avg(bg["la"], 1),
                "whiff_pct":  round(pg["whiffs"] / pg["swings"] * 100, 1) if pg["swings"] else 0.0,
                "putaway_pct": round(pg["so"] / pg["two_strike"] * 100, 1) if pg["two_strike"] else 0.0,
            })

    return {"player_id": player_id, "rows": rows}
