"""
개발용 샘플 데이터 시드 스크립트.
실제 KBO 선수를 모티브로 한 더미 데이터 + 퍼센타일/기대스탯/RunValue가
의미있게 분포하도록 다수 선수·3시즌·다경기·EV-LA 연동 결과를 생성한다.
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
from app.database import SessionLocal, engine, Base
from app.models import Player, BattingStat, PitchingStat, Pitch, BattedBall

random.seed(42)
# 스키마 변경(무브먼트 컬럼 등)을 반영하기 위해 전체 재생성
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

SEASONS = [2022, 2023, 2024]
TEAMS = ["키움 히어로즈", "KIA 타이거즈", "SSG 랜더스", "롯데 자이언츠", "한화 이글스",
         "삼성 라이온즈", "KT 위즈", "LG 트윈스", "두산 베어스", "NC 다이노스"]

# ── 선수 정의 ───────────────────────────────────────
# 명망 선수(스타) — 높은 skill, 그 외 filler는 랜덤 skill
named_batters = [
    ("이정후", "Lee Jung-hoo", "키움 히어로즈", "CF", "L", date(1998, 8, 20), 0.92),
    ("김도영", "Kim Do-young", "KIA 타이거즈", "3B", "R", date(2003, 10, 1), 0.96),
    ("박성한", "Park Sung-han", "SSG 랜더스", "SS", "R", date(1997, 3, 27), 0.62),
    ("손아섭", "Son Ah-seop", "롯데 자이언츠", "LF", "L", date(1988, 3, 18), 0.55),
    ("노시환", "Noh Si-hwan", "한화 이글스", "3B", "R", date(2000, 3, 26), 0.80),
]
named_pitchers = [
    ("김광현", "Kim Kwang-hyun", "SSG 랜더스", "L", date(1988, 7, 22), 0.90),
    ("양현종", "Yang Hyeon-jong", "KIA 타이거즈", "L", date(1988, 3, 1), 0.78),
    ("안우진", "An Woo-jin", "키움 히어로즈", "R", date(1999, 7, 20), 0.94),
    ("원태인", "Won Tae-in", "삼성 라이온즈", "R", date(2000, 9, 16), 0.65),
    ("고영표", "Ko Young-pyo", "KT 위즈", "R", date(1991, 1, 15), 0.70),
]

_SUR = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권"]
_GIV = ["민준", "서준", "도윤", "예준", "시우", "주원", "하준", "지호", "준서", "건우",
        "현우", "지훈", "우진", "선호", "유찬", "정우", "승현", "성민", "재현", "동현"]
B_POS = ["C", "1B", "2B", "SS", "3B", "LF", "CF", "RF", "DH"]


def rname(used):
    while True:
        n = random.choice(_SUR) + random.choice(_GIV)
        if n not in used:
            used.add(n)
            return n


used_names = set(n[0] for n in named_batters) | set(n[0] for n in named_pitchers)

batters = []  # (name, name_en, team, pos, bats, birth, skill)
for n in named_batters:
    batters.append(n)
for _ in range(15):
    nm = rname(used_names)
    batters.append((nm, "", random.choice(TEAMS), random.choice(B_POS),
                    random.choice(["L", "R"]), date(random.randint(1990, 2002), random.randint(1, 12), random.randint(1, 28)),
                    round(random.uniform(0.30, 0.85), 2)))

pitchers = []
for n in named_pitchers:
    pitchers.append(n)
for _ in range(15):
    nm = rname(used_names)
    pitchers.append((nm, "", random.choice(TEAMS), random.choice(["L", "R"]),
                     date(random.randint(1988, 2001), random.randint(1, 12), random.randint(1, 28)),
                     round(random.uniform(0.30, 0.85), 2)))

# ── Player insert ───────────────────────────────────
kbo = 10000
player_objs = []
batter_skill = {}
pitcher_skill = {}
for (name, en, team, pos, bats, birth, skill) in batters:
    kbo += 1
    p = Player(kbo_id=str(kbo), name=name, name_en=en, team=team, position=pos, bats=bats, throws=random.choice(["L", "R"]), birth_date=birth)
    db.add(p); player_objs.append(p); batter_skill[name] = skill
for (name, en, team, throws, birth, skill) in pitchers:
    kbo += 1
    p = Player(kbo_id=str(kbo), name=name, name_en=en, team=team, position="P", bats="R", throws=throws, birth_date=birth)
    db.add(p); player_objs.append(p); pitcher_skill[name] = skill
db.commit()
for p in player_objs:
    db.refresh(p)
pid = {p.name: p.id for p in player_objs}
print(f"선수 {len(player_objs)}명 등록 완료 (타자 {len(batters)} / 투수 {len(pitchers)})")


def jitter(base, amt):
    return base + random.uniform(-amt, amt)


# ── 타자 스탯 (3시즌) ───────────────────────────────
bcount = 0
for (name, *_rest, skill) in [(b[0], b[6]) for b in batters]:
    for si, season in enumerate(SEASONS):
        # 최근 시즌일수록 스타는 상승 곡선
        s = max(0.2, min(0.99, skill + (si - 2) * 0.04 + jitter(0, 0.03)))
        avg = round(jitter(0.250 + s * 0.11, 0.012), 3)
        obp = round(avg + jitter(0.065, 0.015), 3)
        slg = round(avg + jitter(0.12 + s * 0.13, 0.02), 3)
        ops = round(obp + slg, 3)
        hr = int(jitter(8 + s * 32, 4))
        db.add(BattingStat(
            player_id=pid[name], season=season, games=int(jitter(135, 8)),
            pa=int(jitter(560, 40)), ab=int(jitter(500, 35)), hits=int(avg * 500),
            doubles=int(jitter(24, 6)), triples=random.randint(0, 5), hr=hr,
            rbi=int(jitter(55 + s * 50, 10)), sb=int(jitter(10 + s * 25, 6)),
            bb=int(jitter(55, 12)), k=int(jitter(110, 25)),
            avg=avg, obp=obp, slg=slg, ops=ops,
            woba=round(jitter(0.310 + s * 0.11, 0.012), 3),
            wrc_plus=round(jitter(90 + s * 75, 8), 1),
            babip=round(jitter(0.300 + s * 0.05, 0.018), 3),
            war=round(jitter(1.5 + s * 6.5, 0.6), 1),
            hard_hit_pct=round(jitter(28 + s * 20, 2.5), 1),
            barrel_pct=round(jitter(2 + s * 11, 1.2), 1),
            sweet_spot_pct=round(jitter(30 + s * 10, 2), 1),
            avg_ev=round(jitter(138 + s * 14, 2), 1),
            chase_pct=round(jitter(34 - s * 12, 2.5), 1),
            whiff_pct=round(jitter(28 - s * 11, 2.5), 1),
        ))
        bcount += 1
db.commit()
print(f"타자 스탯 {bcount}건 등록 완료")

# ── 투수 스탯 (3시즌) ───────────────────────────────
pcount = 0
for (name, skill) in [(p[0], p[5]) for p in pitchers]:
    for si, season in enumerate(SEASONS):
        s = max(0.2, min(0.99, skill + (si - 2) * 0.04 + jitter(0, 0.03)))
        era = round(jitter(5.4 - s * 3.0, 0.3), 2)
        fip = round(era + jitter(0.2, 0.25), 2)
        db.add(PitchingStat(
            player_id=pid[name], season=season, games=int(jitter(28, 3)),
            gs=int(jitter(27, 3)), ip=round(jitter(150 + s * 50, 15), 1),
            wins=int(jitter(6 + s * 9, 2)), losses=int(jitter(9 - s * 4, 2)), saves=0,
            era=era, fip=fip, xfip=round(fip + jitter(0, 0.2), 2),
            era_minus=round(jitter(135 - s * 70, 6), 0), fip_minus=round(jitter(135 - s * 65, 6), 0),
            k_pct=round(jitter(18 + s * 14, 1.5), 1), bb_pct=round(jitter(11 - s * 5, 1.2), 1),
            hr9=round(jitter(1.3 - s * 0.6, 0.15), 2), babip=round(jitter(0.300 - s * 0.02, 0.015), 3),
            lob_pct=round(jitter(70 + s * 9, 2), 1), war=round(jitter(0.8 + s * 5.5, 0.5), 1),
            avg_ev_allowed=round(jitter(147 - s * 8, 1.5), 1),
            hard_hit_pct=round(jitter(38 - s * 14, 2), 1), barrel_pct=round(jitter(8 - s * 5, 1), 1),
            csw_pct=round(jitter(25 + s * 11, 1.5), 1), whiff_pct=round(jitter(21 + s * 13, 1.5), 1),
            chase_pct=round(jitter(27 + s * 11, 1.5), 1),
        ))
        pcount += 1
db.commit()
print(f"투수 스탯 {pcount}건 등록 완료")

# ── 투구 데이터 (3시즌, 전 투수 × 다경기) ─────────────
PITCH_TYPES = ["직구", "슬라이더", "체인지업", "커브"]
PITCH_WEIGHTS = [0.45, 0.27, 0.16, 0.12]
VELO = {"직구": (145, 152), "슬라이더": (128, 136), "체인지업": (124, 131), "커브": (114, 123)}
# 구종별 평균 무브먼트 (h_break: +arm side, v_break: +rise) cm
BREAK = {"직구": (8, 45), "슬라이더": (-11, 18), "체인지업": (14, 24), "커브": (-9, -10)}
ZONES = list(range(1, 10)) + [11, 12, 13, 14]
RESULTS = ["스트라이크", "볼", "헛스윙", "파울", "인플레이", "루킹스트라이크"]
RESULT_W = [0.20, 0.22, 0.12, 0.18, 0.18, 0.10]

batter_ids = [pid[b[0]] for b in batters]
pitch_rows = []
for season in SEASONS:
    game_dates = [date(season, 4, 1) + timedelta(days=14 * g) for g in range(14)]  # 14경기/시즌
    for (pname, pskill) in [(p[0], p[5]) for p in pitchers]:
        ppid = pid[pname]
        velo_boost = (pskill - 0.5) * 4  # 잘하는 투수일수록 구속 ↑
        sk = pskill
        # 실력 연동 결과 가중치: 잘할수록 헛스윙/스트라이크↑, 볼/인플레이↓
        res_w = [0.18 + sk * 0.05, 0.27 - sk * 0.11, 0.05 + sk * 0.15,
                 0.18, 0.24 - sk * 0.11, 0.05 + sk * 0.10]
        for g, gdate in enumerate(game_dates):
            for i in range(random.randint(11, 17)):
                pt = random.choices(PITCH_TYPES, PITCH_WEIGHTS)[0]
                vlo, vhi = VELO[pt]
                hb, vb = BREAK[pt]
                pitch_rows.append(Pitch(
                    game_id=f"{season}G{g:02d}_{ppid}", pitcher_id=ppid, batter_id=random.choice(batter_ids),
                    season=season, game_date=gdate, inning=random.randint(1, 9), pitch_number=i + 1,
                    pitch_type=pt, velocity=round(random.uniform(vlo, vhi) + velo_boost + jitter(0, 0.6), 1),
                    spin_rate=int(jitter(2300, 250)),
                    h_break=round(jitter(hb, 4), 1), v_break=round(jitter(vb, 5), 1),
                    zone=random.choice(ZONES),
                    plate_x=round(random.uniform(-0.55, 0.55), 2),
                    plate_z=round(random.uniform(0.05, 1.15), 2),
                    balls=random.randint(0, 3), strikes=random.randint(0, 2),
                    result=random.choices(RESULTS, res_w)[0],
                ))
db.bulk_save_objects(pitch_rows)
db.commit()
print(f"투구 {len(pitch_rows)}개 등록 완료")

# ── 타구 데이터 (2024, 전 타자) — 결과를 EV/LA에 연동 ──
DIRECTIONS = ["좌", "중", "우", "내야"]
pitcher_ids = [pid[p[0]] for p in pitchers]
pitcher_supp = {pid[p[0]]: (p[5] - 0.5) * 10 for p in pitchers}  # 좋은 투수 = EV 억제


def batted_result(ev, la):
    score = 0.0
    if ev >= 150: score += 0.28
    if ev >= 158: score += 0.18
    if 8 <= la <= 32: score += 0.22
    if 25 <= la <= 33 and ev >= 156: score += 0.22
    if la < 0 or la > 45: score -= 0.18
    p_hit = max(0.04, min(0.92, 0.14 + score))
    if random.random() < p_hit:
        if 25 <= la <= 35 and ev >= 158: return "홈런"
        if la > 14 and ev >= 150: return random.choice(["2루타", "2루타", "3루타", "안타"])
        return "안타"
    return "아웃"


ball_rows = []
for season in SEASONS:
    for (bname, bskill) in [(b[0], b[6]) for b in batters]:
        bpid = pid[bname]
        ev_center = 134 + bskill * 16  # 스타일수록 강한 타구
        for i in range(random.randint(130, 180)):
            opp = random.choice(pitcher_ids)
            ev = round(min(178, max(110, random.gauss(ev_center - pitcher_supp[opp] * 0.4, 11))), 1)
            la = round(random.gauss(14, 16), 1)
            result = batted_result(ev, la)
            ang = random.uniform(-48, 48)
            dist = random.uniform(30, 150)
            ball_rows.append(BattedBall(
                game_id=f"{season}B{i:04d}_{bpid}", batter_id=bpid, pitcher_id=opp,
                season=season, game_date=date(season, 4, 1) + timedelta(days=i % 180),
                exit_velocity=ev, launch_angle=la, direction=random.choice(DIRECTIONS), result=result,
                spray_x=round(dist * math.sin(math.radians(ang)), 1),
                spray_y=round(dist * math.cos(math.radians(ang)), 1),
            ))
db.bulk_save_objects(ball_rows)
db.commit()
print(f"타구 {len(ball_rows)}개 등록 완료")

db.close()
print("\n시드 데이터 완료!")
print(f"  선수 {len(player_objs)} | 타자스탯 {bcount} | 투수스탯 {pcount} | 투구 {len(pitch_rows)} | 타구 {len(ball_rows)}")
