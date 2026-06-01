# KBO Savant — 프로젝트 마스터 문서
> 이 파일을 프로젝트 루트의 `.claude/CLAUDE.md`에 놓고 시작하세요.
> Claude Code는 매 작업 시작 전 이 파일을 반드시 읽고 따라야 합니다.

---

## 프로젝트 개요

**목표**: MLB Baseball Savant 수준의 KBO 데이터 분석 플랫폼 구축
**핵심 차별점**: 스탯티즈에 없는 타구속도(EV), 발사각(LA), 하드힛%, 배럴% 등 트래킹 기반 지표 제공
**데이터 출처**:
- KBO 게임센터 크롤링 → 투구/타구 트래킹 데이터
- 스탯티즈 크롤링 → 세이버메트릭스 스탯 (WAR, wRC+, FIP 등)

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프론트엔드 | React 18 + TypeScript |
| 차트 | Recharts (기본 차트) + D3.js (히트맵/스프레이차트) |
| 스타일 | Tailwind CSS (반응형 필수) |
| 백엔드 | FastAPI (Python 3.11) |
| ORM | SQLAlchemy 2.0 |
| DB | PostgreSQL 15 |
| 크롤링 | Playwright + BeautifulSoup4 |
| 스케줄러 | APScheduler (매일 자동 크롤링) |
| 테스트 백엔드 | pytest + httpx + pytest-asyncio |
| 테스트 프론트 | Vitest + Testing Library |
| E2E | Playwright |
| 배포 프론트 | Vercel |
| 배포 백엔드 | Railway |

---

## 프로젝트 폴더 구조

```
kbo-savant/
├── .claude/
│   └── CLAUDE.md
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── player.py
│   │   │   ├── pitch.py
│   │   │   ├── batted_ball.py
│   │   │   ├── pitching_stat.py
│   │   │   └── batting_stat.py
│   │   ├── schemas/
│   │   │   ├── player.py
│   │   │   └── stats.py
│   │   ├── routers/
│   │   │   ├── players.py
│   │   │   ├── leaderboard.py
│   │   │   └── compare.py
│   │   └── services/
│   │       ├── stat_calculator.py
│   │       └── data_service.py
│   ├── crawlers/
│   │   ├── kbo_game_crawler.py
│   │   ├── statiz_crawler.py
│   │   └── scheduler.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── fixtures/
│   │   │   ├── mock_pitch_data.json
│   │   │   ├── mock_batted_ball_data.json
│   │   │   └── mock_player_stats.json
│   │   ├── test_calculators.py
│   │   ├── test_api.py
│   │   └── test_crawlers.py
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── PlayerDetail.tsx
│   │   │   └── Compare.tsx
│   │   ├── components/
│   │   │   ├── charts/
│   │   │   │   ├── StrikeZoneMap.tsx
│   │   │   │   ├── SprayChart.tsx
│   │   │   │   ├── VeloTrend.tsx
│   │   │   │   ├── PitchMix.tsx
│   │   │   │   ├── PercentileBar.tsx
│   │   │   │   └── RadarChart.tsx
│   │   │   ├── tables/
│   │   │   │   └── LeaderboardTable.tsx
│   │   │   └── ui/
│   │   │       ├── NavBar.tsx
│   │   │       ├── PlayerCard.tsx
│   │   │       ├── PlayerSearchInput.tsx
│   │   │       ├── StatBadge.tsx
│   │   │       ├── ErrorMessage.tsx
│   │   │       └── FilterBar.tsx
│   │   ├── hooks/
│   │   │   ├── usePlayer.ts
│   │   │   ├── usePlayerSearch.ts
│   │   │   └── useLeaderboard.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   └── types/
│   │       └── index.ts
│   ├── tests/
│   │   ├── components/
│   │   └── e2e/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## DB 스키마 (테이블 정의)

Claude Code는 아래 스키마를 그대로 구현해야 합니다. 임의로 컬럼을 추가/삭제하지 마세요.

### players 테이블
```sql
CREATE TABLE players (
    id          SERIAL PRIMARY KEY,
    kbo_id      VARCHAR(20) UNIQUE NOT NULL,  -- KBO 공식 선수 ID
    name        VARCHAR(50) NOT NULL,          -- 선수명 (한글)
    name_en     VARCHAR(100),                  -- 선수명 (영문)
    team        VARCHAR(30) NOT NULL,          -- 현 소속팀
    position    VARCHAR(10) NOT NULL,          -- 포지션 (P/C/1B/2B/3B/SS/LF/CF/RF/DH)
    birth_date  DATE,
    throws      VARCHAR(5),                    -- 투구 손 (R/L/S)
    bats        VARCHAR(5),                    -- 타격 손 (R/L/S)
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### pitches 테이블 (투구 트래킹)
```sql
CREATE TABLE pitches (
    id              SERIAL PRIMARY KEY,
    game_id         VARCHAR(30) NOT NULL,      -- 경기 ID
    pitcher_id      INTEGER REFERENCES players(id),
    batter_id       INTEGER REFERENCES players(id),
    season          INTEGER NOT NULL,
    game_date       DATE NOT NULL,
    inning          INTEGER,
    pitch_number    INTEGER,                   -- 해당 타석 내 투구 순서
    pitch_type      VARCHAR(20),               -- 구종 (직구/슬라이더/커브/체인지업/커터/싱커/스플리터)
    velocity        FLOAT,                     -- 구속 (km/h)
    spin_rate       INTEGER,                   -- 스핀레이트 (RPM)
    plate_x         FLOAT,                     -- 홈플레이트 좌우 위치 (-0.5 ~ 0.5)
    plate_z         FLOAT,                     -- 홈플레이트 상하 위치 (0 ~ 1.2)
    balls           INTEGER,                   -- 투구 전 볼카운트
    strikes         INTEGER,                   -- 투구 전 스트라이크카운트
    result          VARCHAR(20),               -- 결과 (스트라이크/볼/파울/인플레이/헛스윙/번트)
    zone            INTEGER,                   -- 스트라이크존 구역 (1~9: 존 안, 11~14: 존 바깥)
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### batted_balls 테이블 (타구 트래킹)
```sql
CREATE TABLE batted_balls (
    id              SERIAL PRIMARY KEY,
    game_id         VARCHAR(30) NOT NULL,
    batter_id       INTEGER REFERENCES players(id),
    pitcher_id      INTEGER REFERENCES players(id),
    season          INTEGER NOT NULL,
    game_date       DATE NOT NULL,
    exit_velocity   FLOAT,                     -- 타구속도 (km/h)
    launch_angle    FLOAT,                     -- 발사각 (도)
    hit_distance    FLOAT,                     -- 비거리 (m)
    direction       VARCHAR(10),               -- 타구 방향 (좌/중/우/내야)
    batted_type     VARCHAR(20),               -- 타구 종류 (땅볼/뜬공/라이너/팝플라이)
    result          VARCHAR(20),               -- 결과 (안타/2루타/3루타/홈런/아웃/실책)
    spray_x         FLOAT,                     -- 스프레이차트 X좌표
    spray_y         FLOAT,                     -- 스프레이차트 Y좌표
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### batting_stats 테이블 (타자 세이버 스탯)
```sql
CREATE TABLE batting_stats (
    id          SERIAL PRIMARY KEY,
    player_id   INTEGER REFERENCES players(id),
    season      INTEGER NOT NULL,
    games       INTEGER,
    pa          INTEGER,                       -- 타석
    ab          INTEGER,                       -- 타수
    hits        INTEGER,
    doubles     INTEGER,
    triples     INTEGER,
    hr          INTEGER,
    rbi         INTEGER,
    sb          INTEGER,
    bb          INTEGER,
    k           INTEGER,
    avg         FLOAT,
    obp         FLOAT,
    slg         FLOAT,
    ops         FLOAT,
    woba        FLOAT,
    wrc_plus    FLOAT,                         -- wRC+
    babip       FLOAT,
    war         FLOAT,
    -- 계산 지표 (Goal 4에서 채워짐)
    hard_hit_pct    FLOAT,
    barrel_pct      FLOAT,
    sweet_spot_pct  FLOAT,
    avg_ev          FLOAT,                     -- 평균 타구속도
    chase_pct       FLOAT,
    whiff_pct       FLOAT,
    UNIQUE(player_id, season)
);
```

### pitching_stats 테이블 (투수 세이버 스탯)
```sql
CREATE TABLE pitching_stats (
    id          SERIAL PRIMARY KEY,
    player_id   INTEGER REFERENCES players(id),
    season      INTEGER NOT NULL,
    games       INTEGER,
    gs          INTEGER,                       -- 선발 경기
    ip          FLOAT,                         -- 이닝
    wins        INTEGER,
    losses      INTEGER,
    saves       INTEGER,
    era         FLOAT,
    fip         FLOAT,
    xfip        FLOAT,
    era_minus   FLOAT,                         -- ERA-
    fip_minus   FLOAT,                         -- FIP-
    k_pct       FLOAT,                         -- K%
    bb_pct      FLOAT,                         -- BB%
    hr9         FLOAT,
    babip       FLOAT,
    lob_pct     FLOAT,                         -- LOB%
    war         FLOAT,
    -- 계산 지표 (Goal 4에서 채워짐)
    avg_ev_allowed  FLOAT,                     -- 허용 평균 타구속도
    hard_hit_pct    FLOAT,                     -- 허용 하드힛%
    barrel_pct      FLOAT,                     -- 허용 배럴%
    csw_pct         FLOAT,
    whiff_pct       FLOAT,
    chase_pct       FLOAT,
    UNIQUE(player_id, season)
);
```

---

## API 응답 형식 (Response Schema)

프론트엔드는 아래 형식만 기대합니다. 백엔드는 이 형식 그대로 반환해야 합니다.

### GET /api/players/search?q={query}
```json
[
  {
    "id": 1,
    "name": "이정후",
    "team": "키움 히어로즈",
    "position": "CF"
  }
]
```

### GET /api/players/{id}
```json
{
  "id": 1,
  "kbo_id": "73912",
  "name": "이정후",
  "name_en": "Lee Jung-hoo",
  "team": "키움 히어로즈",
  "position": "CF",
  "birth_date": "1998-08-20",
  "throws": "R",
  "bats": "L"
}
```

### GET /api/players/{id}/batting?season=2024
```json
{
  "player_id": 1,
  "season": 2024,
  "classic": {
    "games": 144, "pa": 620, "avg": 0.349,
    "obp": 0.421, "slg": 0.530, "ops": 0.951,
    "hr": 23, "rbi": 87, "sb": 18
  },
  "sabermetrics": {
    "woba": 0.412, "wrc_plus": 158,
    "babip": 0.361, "war": 7.2
  },
  "tracking": {
    "hard_hit_pct": 42.3,
    "barrel_pct": 8.7,
    "sweet_spot_pct": 38.1,
    "avg_ev": 148.2,
    "chase_pct": 21.4,
    "whiff_pct": 18.9
  },
  "percentiles": {
    "hard_hit_pct": 88,
    "barrel_pct": 82,
    "avg_ev": 91,
    "wrc_plus": 95,
    "war": 97
  }
}
```

### GET /api/players/{id}/pitching?season=2024
```json
{
  "player_id": 2,
  "season": 2024,
  "classic": {
    "games": 30, "gs": 30, "ip": 195.2,
    "wins": 15, "losses": 7, "era": 2.84
  },
  "sabermetrics": {
    "fip": 3.12, "xfip": 3.08,
    "era_minus": 72, "fip_minus": 78,
    "k_pct": 28.4, "bb_pct": 7.1,
    "babip": 0.281, "war": 6.2
  },
  "tracking": {
    "avg_ev_allowed": 141.3,
    "hard_hit_pct": 28.1,
    "barrel_pct": 4.2,
    "csw_pct": 31.8,
    "whiff_pct": 29.4,
    "chase_pct": 34.7
  },
  "percentiles": {
    "era_minus": 91,
    "fip": 88,
    "hard_hit_pct": 85,
    "csw_pct": 92,
    "war": 95
  }
}
```

### GET /api/players/{id}/pitches?season=2024
```json
{
  "player_id": 2,
  "season": 2024,
  "total_pitches": 2847,
  "pitch_mix": [
    {"pitch_type": "직구", "count": 1081, "pct": 38.0, "avg_velocity": 148.2},
    {"pitch_type": "슬라이더", "count": 797, "pct": 28.0, "avg_velocity": 132.5},
    {"pitch_type": "체인지업", "count": 569, "pct": 20.0, "avg_velocity": 128.8},
    {"pitch_type": "커브", "count": 400, "pct": 14.0, "avg_velocity": 118.3}
  ],
  "zone_data": [
    {"zone": 1, "pitches": 120, "batting_avg": 0.198, "whiff_pct": 18.2},
    {"zone": 5, "pitches": 340, "batting_avg": 0.341, "whiff_pct": 22.1}
  ],
  "velocity_trend": [
    {"game_date": "2024-04-01", "avg_velocity": 147.1},
    {"game_date": "2024-04-07", "avg_velocity": 148.4}
  ]
}
```

### GET /api/players/{id}/batted-balls?season=2024
```json
{
  "player_id": 1,
  "season": 2024,
  "total": 412,
  "spray_data": [
    {"spray_x": -45.2, "spray_y": 120.3, "result": "안타", "exit_velocity": 152.1, "launch_angle": 18.4},
    {"spray_x": 12.8, "spray_y": 95.7, "result": "아웃", "exit_velocity": 138.2, "launch_angle": -3.2}
  ],
  "zone_avg": [
    {"zone": 1, "avg": 0.198, "attempts": 48},
    {"zone": 5, "avg": 0.388, "attempts": 76}
  ]
}
```

### GET /api/leaderboard?type=batting&stat=war&season=2024&team=&page=1&per_page=30
```json
{
  "total": 142,
  "page": 1,
  "per_page": 30,
  "data": [
    {
      "rank": 1,
      "player_id": 1,
      "name": "이정후",
      "team": "키움",
      "position": "CF",
      "war": 7.2,
      "wrc_plus": 158,
      "avg": 0.349,
      "hard_hit_pct": 42.3,
      "barrel_pct": 8.7,
      "percentile_war": 97
    }
  ]
}
```

### 에러 응답 (공통)
```json
{
  "detail": "선수를 찾을 수 없습니다.",
  "error_code": "PLAYER_NOT_FOUND",
  "status_code": 404
}
```

---

## 컴포넌트 Props 타입 정의

frontend/src/types/index.ts에 아래 타입을 그대로 정의합니다.

```typescript
// 선수 기본 정보
export interface Player {
  id: number
  name: string
  team: string
  position: string
  throws?: string
  bats?: string
}

// 투구 존 데이터 (스트라이크존 히트맵용)
export interface ZoneData {
  zone: number       // 1~9: 존 안, 11~14: 존 바깥
  pitches: number
  batting_avg: number
  whiff_pct: number
}

// 타구 스프레이 데이터
export interface SprayData {
  spray_x: number
  spray_y: number
  result: string
  exit_velocity: number
  launch_angle: number
}

// 구종 데이터
export interface PitchType {
  pitch_type: string
  count: number
  pct: number
  avg_velocity: number
}

// 구속 트렌드 포인트
export interface VeloPoint {
  game_date: string
  avg_velocity: number
}

// 퍼센타일 데이터
export interface Percentiles {
  [key: string]: number
}

// ===== 컴포넌트 Props =====

export interface StrikeZoneMapProps {
  data: ZoneData[]
  colorBy: 'batting_avg' | 'whiff_pct'  // 색상 기준
  width?: number
  height?: number
}

export interface SprayChartProps {
  data: SprayData[]
  colorBy: 'result' | 'exit_velocity'
  width?: number
  height?: number
}

export interface PitchMixProps {
  data: PitchType[]
  season: number
}

export interface VeloTrendProps {
  data: VeloPoint[]
  pitchType?: string   // 특정 구종만 필터 (없으면 전체)
}

export interface PercentileBarProps {
  label: string
  value: number        // 실제 수치
  percentile: number   // 0~100
}

export interface RadarChartProps {
  players: {
    name: string
    data: { [stat: string]: number }
  }[]
  stats: string[]      // 표시할 스탯 목록
}

export interface PlayerSearchInputProps {
  onSelect: (player: Player) => void
  placeholder?: string
}

export interface LeaderboardTableProps {
  data: LeaderboardRow[]
  type: 'batting' | 'pitching'
  onPlayerClick: (playerId: number) => void
}

export interface LeaderboardRow {
  rank: number
  player_id: number
  name: string
  team: string
  position: string
  [key: string]: number | string  // 동적 스탯 컬럼
}
```

---

## 에러 처리 규칙

### 백엔드
```python
# 모든 에러는 이 형식으로 반환
from fastapi import HTTPException

# 선수 없음
raise HTTPException(status_code=404, detail={
    "detail": "선수를 찾을 수 없습니다.",
    "error_code": "PLAYER_NOT_FOUND"
})

# 잘못된 파라미터
raise HTTPException(status_code=422, detail={
    "detail": "올바른 시즌 연도를 입력해주세요.",
    "error_code": "INVALID_SEASON"
})

# 서버 오류
raise HTTPException(status_code=500, detail={
    "detail": "데이터를 불러오는 중 오류가 발생했습니다.",
    "error_code": "INTERNAL_ERROR"
})
```

### 프론트엔드
```typescript
// API 실패 시 화면 처리 규칙
// 1. 로딩 중 → <LoadingSpinner />
// 2. 404 에러 → "선수를 찾을 수 없습니다." 메시지 + 홈으로 버튼
// 3. 500 에러 → "데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
// 4. 네트워크 오류 → "인터넷 연결을 확인해주세요."
// 5. 차트 데이터 없음 → 차트 영역에 "데이터가 없습니다." 표시 (차트 영역 유지)

// client.ts에서 공통 에러 처리
const apiClient = axios.create({ baseURL: process.env.REACT_APP_API_URL })

apiClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    if (status === 404) throw new NotFoundError(error.response.data.detail)
    if (status === 422) throw new ValidationError(error.response.data.detail)
    throw new ServerError("데이터를 불러오는 중 오류가 발생했습니다.")
  }
)
```

---

## 크롤러 실패 대응 전략

크롤러가 실패했을 때 Claude Code는 아래 순서대로 처리합니다.

### 실패 유형별 대응
```python
# 1. 타임아웃 (30초 초과)
→ 최대 3회 재시도 (간격: 5초, 10초, 20초)
→ 3회 모두 실패 시 해당 경기 스킵, 로그 기록

# 2. 파싱 오류 (HTML 구조 변경)
→ 즉시 크롤링 중단
→ 에러 로그에 "사이트 구조 변경 의심" 기록
→ 개발자 알림 (로그 파일에 CRITICAL 레벨로 기록)
→ 이전에 수집한 데이터는 그대로 유지

# 3. 403/429 차단
→ 10분 대기 후 1회 재시도
→ 재시도 실패 시 당일 크롤링 중단, 다음날 재시도
→ CRAWL_DELAY를 2배로 늘림 (1.5초 → 3초)

# 4. 데이터 없음 (경기 없는 날)
→ 정상 종료, 로그에 "경기 없음" 기록
```

### 로그 형식
```python
# backend/crawlers/kbo_game_crawler.py
import logging

logging.basicConfig(
    filename='logs/crawler.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

# 성공 로그
logging.info(f"[KBO] 경기 {game_id} 크롤링 완료 - 투구 {pitch_count}개, 타구 {batted_count}개")

# 실패 로그
logging.error(f"[KBO] 경기 {game_id} 크롤링 실패 - {error_message}")

# 구조 변경 의심
logging.critical(f"[KBO] 파싱 오류 - 사이트 구조 변경 의심. 확인 필요.")
```

### 크롤러 재시도 유틸리티
```python
# 모든 크롤러 함수에 이 데코레이터 적용
from functools import wraps
import asyncio

def retry(max_attempts=3, delay=5):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    wait = delay * (2 ** attempt)
                    logging.warning(f"재시도 {attempt+1}/{max_attempts} - {wait}초 대기")
                    await asyncio.sleep(wait)
        return wrapper
    return decorator
```

---

## 테스트 픽스처 (Mock 데이터)

모든 테스트는 이 픽스처를 사용합니다. 테스트마다 다른 데이터 만들지 마세요.

### backend/tests/fixtures/mock_pitch_data.json
```json
{
  "pitches": [
    {"pitch_type": "직구", "velocity": 148.2, "plate_x": 0.1, "plate_z": 0.6, "zone": 5, "result": "스트라이크", "balls": 0, "strikes": 0},
    {"pitch_type": "슬라이더", "velocity": 132.5, "plate_x": 0.4, "plate_z": 0.2, "zone": 13, "result": "볼", "balls": 0, "strikes": 1},
    {"pitch_type": "직구", "velocity": 149.1, "plate_x": -0.2, "plate_z": 0.8, "zone": 2, "result": "헛스윙", "balls": 1, "strikes": 1},
    {"pitch_type": "체인지업", "velocity": 128.8, "plate_x": 0.3, "plate_z": 0.3, "zone": 6, "result": "인플레이", "balls": 1, "strikes": 2},
    {"pitch_type": "직구", "velocity": 147.8, "plate_x": -0.1, "plate_z": 0.5, "zone": 5, "result": "루킹스트라이크", "balls": 2, "strikes": 2}
  ]
}
```

### backend/tests/fixtures/mock_batted_ball_data.json
```json
{
  "batted_balls": [
    {"exit_velocity": 155.2, "launch_angle": 18.4, "direction": "우", "result": "안타", "spray_x": 45.2, "spray_y": 120.3},
    {"exit_velocity": 145.8, "launch_angle": -3.2, "direction": "내야", "result": "아웃", "spray_x": 12.1, "spray_y": 30.5},
    {"exit_velocity": 162.1, "launch_angle": 27.5, "direction": "좌", "result": "홈런", "spray_x": -80.3, "spray_y": 145.2},
    {"exit_velocity": 138.4, "launch_angle": 45.2, "direction": "중", "result": "아웃", "spray_x": 2.1, "spray_y": 110.8},
    {"exit_velocity": 151.7, "launch_angle": 12.8, "direction": "우", "result": "2루타", "spray_x": 60.4, "spray_y": 135.6}
  ]
}
```

### backend/tests/fixtures/mock_player_stats.json
```json
{
  "player": {
    "id": 1, "kbo_id": "73912", "name": "이정후",
    "team": "키움 히어로즈", "position": "CF",
    "throws": "R", "bats": "L"
  },
  "batting_stat": {
    "season": 2024, "games": 144, "pa": 620, "ab": 540,
    "hits": 188, "hr": 23, "rbi": 87, "avg": 0.349,
    "obp": 0.421, "slg": 0.530, "ops": 0.951,
    "woba": 0.412, "wrc_plus": 158, "babip": 0.361, "war": 7.2
  }
}
```

### conftest.py 픽스처 설정
```python
# backend/tests/conftest.py
import pytest
import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / "fixtures"

@pytest.fixture
def mock_pitches():
    with open(FIXTURES_DIR / "mock_pitch_data.json") as f:
        return json.load(f)["pitches"]

@pytest.fixture
def mock_batted_balls():
    with open(FIXTURES_DIR / "mock_batted_ball_data.json") as f:
        return json.load(f)["batted_balls"]

@pytest.fixture
def mock_player():
    with open(FIXTURES_DIR / "mock_player_stats.json") as f:
        return json.load(f)

@pytest.fixture
async def client():
    from httpx import AsyncClient
    from app.main import app
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c
```

---

## Git 커밋 전략

Goal별로 브랜치를 나누고 커밋합니다.

```
브랜치 구조:
main
├── develop
│   ├── goal/01-setup
│   ├── goal/02-kbo-crawler
│   ├── goal/03-statiz-crawler
│   ├── goal/04-calculators
│   ├── goal/05-api
│   ├── goal/06-common-components
│   ├── goal/07-home
│   ├── goal/08-leaderboard
│   ├── goal/09-player-pitcher
│   ├── goal/10-player-batter
│   ├── goal/11-compare
│   ├── goal/12-qa
│   └── goal/13-deploy
```

### 커밋 메시지 규칙
```
[Goal N] 작업 내용 요약

예시:
[Goal 2] KBO 게임센터 투구 데이터 크롤러 구현
[Goal 4] 하드힛%/배럴%/스위트스팟% 계산 함수 추가
[Goal 9] 스트라이크존 히트맵 D3.js 컴포넌트 구현
[Fix] 배럴% 계산 시 ZeroDivisionError 수정
```

### Goal 완료 시 머지 순서
```
1. goal/0N 브랜치에서 테스트 전부 통과 확인
2. develop에 PR 생성
3. 테스트 통과 후 develop에 머지
4. 모든 Goal 완료 후 develop → main 머지
```

---

## 데이터 업데이트 스케줄러

```python
# backend/crawlers/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler(timezone="Asia/Seoul")

@scheduler.scheduled_job("cron", hour=1, minute=0)
async def daily_crawl():
    """
    실행 순서:
    1. KBO 공식 사이트에서 전날 경기 결과 확인
    2. 경기가 있었으면 → KBO 게임센터 크롤링
    3. 스탯티즈 세이버 스탯 업데이트
    4. 지표 재계산 (하드힛%, 배럴% 등)
    5. 완료 로그 기록
    경기가 없었으면 → 로그에 "경기 없음" 기록 후 종료
    """
```

---

## 반응형 UI 규칙

```
데스크탑 (1024px 이상): 사이드바 + 메인, 차트 2열
태블릿 (768~1024px):    상단 NavBar, 차트 1열
모바일 (768px 이하):    하단 탭 네비게이션, 차트 전체너비
```

### Tailwind 반응형 예시
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">  // 차트 그리드
<nav className="fixed bottom-0 md:hidden w-full">        // 모바일 탭바만
<h1 className="text-lg md:text-2xl font-bold">          // 텍스트 크기
```

---

## 선수 검색 자동완성 규칙

- 초성 검색 미지원
- 2글자 이상 입력 시 API 호출 (debounce 300ms)
- 입력값으로 시작하는 선수명 최대 10개 반환
- 키보드 방향키로 선택, ESC로 닫기, Enter/클릭으로 이동

```python
# GET /api/players/search?q=이정
# name LIKE '이정%' 조건으로 검색
```

---

## 핵심 지표 계산 공식

```python
hard_hit_pct    = (EV >= 150인 타구 수) / 전체 인플레이 타구 수 * 100
barrel_pct      = (EV >= 158 AND 26 <= LA <= 30) / 전체 인플레이 타구 수 * 100
sweet_spot_pct  = (8 <= LA <= 32인 타구 수) / 전체 인플레이 타구 수 * 100
avg_ev          = sum(모든 인플레이 타구 EV) / 전체 인플레이 타구 수
chase_pct       = (존 바깥 스윙 수) / (존 바깥 투구 수) * 100
whiff_pct       = (헛스윙 수) / (전체 스윙 수) * 100
csw_pct         = (헛스윙 + 루킹 스트라이크) / 전체 투구 수 * 100

# 빈 데이터 처리: 인플레이 타구가 0개면 0 반환 (ZeroDivisionError 금지)
```

---

## 퍼센타일 컬러 시스템

```
90+ → #FF4136 (빨강)    히트맵 높음 → #D73027 (빨강)
75+ → #FF851B (주황)    히트맵 중간 → #FFFFBF (노랑)
40~74 → #AAAAAA (회색)  히트맵 낮음 → #313695 (파랑)
25~39 → #7FDBFF (하늘)
25미만 → #0074D9 (파랑)
```

---

## 환경변수 (.env 템플릿)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/kbo_savant
SECRET_KEY=your-secret-key-here
CRAWL_DELAY=1.5
KBO_BASE_URL=https://www.koreabaseball.com
STATIZ_BASE_URL=https://www.statiz.co.kr
CRAWL_HOUR=1
CRAWL_MINUTE=0
TIMEZONE=Asia/Seoul
REACT_APP_API_URL=http://localhost:8000
```

---

## Goal 시작 프롬프트

### Goal 1
```
CLAUDE.md를 읽고 Goal 1을 시작해줘.
goal/01-setup 브랜치 생성 후 작업해줘.
완료 후 Goal 1 테스트 체크리스트 전부 실행하고 결과 알려줘.
```

### Goal 2 이후 공통
```
Goal {N-1} 테스트 전부 통과했어.
goal/{N}-{name} 브랜치 생성하고 Goal {N} 시작해줘.
완료 후 CLAUDE.md의 Goal {N} 테스트 체크리스트
전부 실행하고 통과 여부 알려줘.
실패한 테스트가 있으면 바로 수정해줘.
```

---

## Goal별 테스트 체크리스트

### Goal 1 — 환경 세팅
```
□ [빌드] FastAPI 서버 localhost:8000 정상 기동
□ [빌드] React 앱 localhost:3000 정상 기동
□ [통합] PostgreSQL 연결 확인 (SELECT 1)
□ [빌드] npm run build 오류 없음
```

### Goal 2 — KBO 크롤러
```
□ [단위] 투구 데이터 파싱: pitch_type/velocity/plate_x/plate_z/zone/result 필드 존재
□ [단위] 타구 데이터 파싱: exit_velocity/launch_angle/direction/result 필드 존재
□ [통합] 크롤링 결과 DB pitches 테이블 저장 확인
□ [통합] 크롤링 결과 DB batted_balls 테이블 저장 확인
□ [통합] 동일 경기 2회 크롤링 시 중복 데이터 없음
□ [빌드] 서버 재시작 후 에러 없음
```

### Goal 3 — 스탯티즈 크롤러
```
□ [단위] 타자 스탯 파싱: war/wrc_plus/babip/woba 필드 존재
□ [단위] 투수 스탯 파싱: fip/era_minus/k_pct/bb_pct 필드 존재
□ [통합] batting_stats 테이블 저장 확인
□ [통합] pitching_stats 테이블 저장 확인
□ [빌드] 서버 재시작 후 에러 없음
```

### Goal 4 — 지표 계산 엔진
```
□ [단위] hard_hit_pct([155,145,160]) == 66.7 (소수점 1자리)
□ [단위] barrel_pct([{ev:162,la:27}], 전체4개) == 25.0
□ [단위] sweet_spot_pct(LA=8 경계값 포함)
□ [단위] sweet_spot_pct(LA=32 경계값 포함)
□ [단위] 빈 리스트 입력 시 모든 함수 0 반환 (ZeroDivisionError 없음)
□ [단위] whiff_pct 픽스처 데이터로 정확도 검증
□ [단위] csw_pct 픽스처 데이터로 정확도 검증
□ [단위] chase_pct 픽스처 데이터로 정확도 검증
□ [단위] 커버리지 90% 이상
□ [빌드] 서버 재시작 후 에러 없음
```

### Goal 5 — FastAPI 백엔드
```
□ [통합] GET /api/players/search?q=이정 → 200, 이정후 포함
□ [통합] GET /api/players/search?q=가 → 200, 빈 배열 [] (오류 아님)
□ [통합] GET /api/players/1 → 200, CLAUDE.md 응답 형식 일치
□ [통합] GET /api/players/999 → 404, error_code: PLAYER_NOT_FOUND
□ [통합] GET /api/players/1/batting?season=2024 → 200, tracking.hard_hit_pct 포함
□ [통합] GET /api/players/1/pitching?season=2024 → 200, tracking.csw_pct 포함
□ [통합] GET /api/players/1/pitches?season=2024 → 200, pitch_mix 배열 포함
□ [통합] GET /api/players/1/batted-balls?season=2024 → 200, spray_data 배열 포함
□ [통합] GET /api/leaderboard?type=batting&stat=war → 200, 내림차순 정렬
□ [통합] GET /api/leaderboard?type=pitching&stat=fip → 200, 오름차순 정렬
□ [통합] GET /api/compare?ids=1,2 → 200
□ [빌드] 서버 재시작 후 에러 없음
```

### Goal 6 — 공통 컴포넌트
```
□ [단위] NavBar 렌더링 확인
□ [단위] PlayerSearchInput: 1글자 입력 → 드롭다운 미표시
□ [단위] PlayerSearchInput: 2글자 이상 입력 → 드롭다운 표시
□ [단위] PlayerSearchInput: ESC 키 → 드롭다운 닫힘
□ [단위] PlayerSearchInput: 키보드 방향키로 선택 이동
□ [단위] StatBadge: percentile=95 → 빨강 클래스 적용
□ [단위] StatBadge: percentile=50 → 회색 클래스 적용
□ [단위] StatBadge: percentile=10 → 파랑 클래스 적용
□ [단위] ErrorMessage: 404 에러 메시지 렌더링
□ [빌드] npm run build 오류 없음
□ [E2E]  모바일(375px) → 하단 탭바 표시 확인
□ [E2E]  데스크탑(1280px) → 상단 NavBar 표시 확인
```

### Goal 7 — 홈 페이지
```
□ [단위] Home 컴포넌트 렌더링 (mock API)
□ [E2E]  검색창에 "이정" 입력 → 드롭다운에 선수 표시
□ [E2E]  선수 클릭 → /players/{id} 이동
□ [E2E]  모바일(375px) 레이아웃 깨지지 않음
□ [빌드] npm run build 오류 없음
```

### Goal 8 — 리더보드
```
□ [단위] LeaderboardTable mock 데이터 렌더링
□ [단위] PercentileBar percentile=90 → 빨강
□ [E2E]  투수 탭 클릭 → FIP 컬럼 표시
□ [E2E]  WAR 헤더 클릭 → 내림차순 정렬
□ [E2E]  WAR 헤더 재클릭 → 오름차순 정렬
□ [E2E]  팀 필터 적용 → 해당 팀 선수만 표시
□ [E2E]  선수 클릭 → 상세 페이지 이동
□ [E2E]  모바일(375px) 주요 컬럼만 표시
□ [빌드] npm run build 오류 없음
```

### Goal 9 — 선수 상세 (투수)
```
□ [단위] StrikeZoneMap 빈 데이터 → "데이터 없음" 표시
□ [단위] StrikeZoneMap ZoneData 있을 때 9개 셀 렌더링
□ [단위] StrikeZoneMap colorBy="batting_avg" 색상 적용
□ [단위] VeloTrend 라인차트 렌더링
□ [단위] PitchMix 4개 구종 바 렌더링
□ [E2E]  투수 상세 접속 → 스트라이크존 맵 표시
□ [E2E]  투수 상세 접속 → 구속 트렌드 차트 표시
□ [E2E]  투수 상세 접속 → Whiff%/CSW%/Chase% 수치 표시
□ [E2E]  모바일(375px) 차트 1열 배치
□ [빌드] npm run build 오류 없음
```

### Goal 10 — 선수 상세 (타자)
```
□ [단위] SprayChart 빈 데이터 → "데이터 없음" 표시
□ [단위] SprayChart SprayData 있을 때 점 렌더링
□ [단위] RadarChart 단일 선수 렌더링
□ [단위] RadarChart 두 선수 겹쳐서 렌더링
□ [E2E]  타자 상세 접속 → 존별 히트맵 표시
□ [E2E]  타자 상세 접속 → 스프레이 차트 표시
□ [E2E]  타자 상세 접속 → 하드힛%/배럴%/EV 수치 표시
□ [E2E]  모바일(375px) 스프레이차트 렌더링 확인
□ [빌드] npm run build 오류 없음
```

### Goal 11 — 선수 비교
```
□ [단위] Compare 페이지 선수 1명만 선택 시 렌더링
□ [단위] Compare 페이지 선수 2명 선택 시 레이더차트 렌더링
□ [E2E]  선수A 검색 → 선택 → 선수B 검색 → 선택
□ [E2E]  레이더차트 두 선수 데이터 표시
□ [E2E]  스탯 비교 테이블 렌더링
□ [E2E]  모바일(375px) 비교 레이아웃 확인
□ [빌드] npm run build 오류 없음
```

### Goal 12 — 전체 QA
```
□ [단위] pytest 전체 실행 → 100% 통과
□ [단위] 커버리지 리포트 → 80% 이상
□ [단위] Vitest 전체 실행 → 100% 통과
□ [빌드] 백엔드 서버 정상 기동
□ [빌드] npm run build 경고/오류 없음
□ [E2E]  플로우1: 홈 → 검색 → 투수 상세 → 스트라이크존 확인
□ [E2E]  플로우2: 홈 → 검색 → 타자 상세 → 하드힛% 확인
□ [E2E]  플로우3: 리더보드 → 필터 → 정렬 → 선수 이동
□ [E2E]  플로우4: 선수 비교 → 두 선수 → 레이더차트
□ [E2E]  플로우5: 모바일(375px) 플로우1 반복
```

### Goal 13 — 배포
```
□ [빌드] Vercel 프론트 배포 → URL 접근 가능
□ [빌드] Railway 백엔드 배포 → /api/players 응답
□ [통합] 배포 프론트 → 배포 백엔드 API 연동 확인
□ [E2E]  배포 URL로 플로우1 통과
□ [통합] Railway Cron Job 스케줄러 등록 확인
```

---

## 개발 일정

| Goal | 작업 내용 | 예상 소요 |
|------|-----------|---------|
| 1 | 환경 세팅 | 1일 |
| 2 | KBO 크롤러 | 3일 |
| 3 | 스탯티즈 크롤러 | 2일 |
| 4 | 지표 계산 엔진 | 2일 |
| 5 | FastAPI 백엔드 | 3일 |
| 6 | 공통 컴포넌트 + 반응형 | 2일 |
| 7 | 홈 페이지 | 1일 |
| 8 | 리더보드 | 2일 |
| 9 | 선수 상세 (투수) | 3일 |
| 10 | 선수 상세 (타자) | 3일 |
| 11 | 선수 비교 | 2일 |
| 12 | 전체 QA | 3일 |
| 13 | 배포 | 1일 |
| **합계** | | **약 4주** |

---

## UI 디자인 시스템

### 기본 원칙
- 기본값: 라이트모드
- 다크모드: NavBar 우측 토글 버튼으로 전환
- 선택한 모드는 localStorage에 저장 (재접속 시 유지)
- 전환 방식: CSS 변수 교체 (깜빡임 없이 즉시 전환)

### 컬러 토큰

```css
/* 라이트모드 */
:root[data-theme="light"] {
  --color-bg-page:       #F4F6FA;   /* 페이지 전체 배경 */
  --color-bg-card:       #FFFFFF;   /* 카드/컨텐츠 배경 */
  --color-bg-nav:        #0A1E4E;   /* NavBar 배경 */
  --color-nav-hover:     #152B6B;   /* NavBar 호버 */

  --color-primary:       #0A1E4E;   /* 주 텍스트/강조 */
  --color-primary-mid:   #1E3A8A;   /* 버튼/링크/테두리 */
  --color-accent:        #D0021B;   /* 포인트 (WAR 등 핵심 수치) */
  --color-gold:          #F5A623;   /* 1위/하이라이트 */

  --color-text-primary:  #0A1E4E;
  --color-text-secondary:#64748B;
  --color-text-muted:    #94A3B8;
  --color-border:        #E2E8F0;
}

/* 다크모드 */
:root[data-theme="dark"] {
  --color-bg-page:       #080F26;
  --color-bg-card:       #0E1B3E;
  --color-bg-nav:        #0A1530;
  --color-nav-hover:     #1E2D5A;

  --color-primary:       #C8D5FF;
  --color-primary-mid:   #4A7AFF;
  --color-accent:        #FF4D6A;
  --color-gold:          #F5A623;

  --color-text-primary:  #C8D5FF;
  --color-text-secondary:#6B7DB8;
  --color-text-muted:    #4A5D9A;
  --color-border:        #1E2D5A;
}
```

### 퍼센타일 컬러 (라이트/다크 공통)
```
90+ 퍼센타일 → #C0392B (빨강)   — 리그 최상위
75+ 퍼센타일 → #E67E22 (주황)   — 리그 상위
40~74 퍼센타일 → #95A5A6 (회색) — 리그 평균
25~39 퍼센타일 → #3498DB (하늘) — 리그 하위
25미만 퍼센타일 → #1E3A8A (파랑) — 리그 최하위
```

### 히트맵 컬러 (스트라이크존 / 존별 타율)
```
높은 수치 → #C0392B (빨강)
중간 수치 → #F5F5DC (크림)
낮은 수치 → #1E3A8A (파랑)
```

### 폰트
```
한글/UI 전반: Noto Sans KR (Google Fonts, 무료)
숫자/스탯:    Roboto Mono (Google Fonts, 무료)

적용:
font-family: 'Noto Sans KR', sans-serif;      /* 기본 */
font-family: 'Roboto Mono', monospace;         /* 스탯 수치 */
```

### 다크모드 토글 구현
```tsx
// NavBar에서
const [theme, setTheme] = useState(
  localStorage.getItem('theme') || 'light'
)

const toggleTheme = () => {
  const next = theme === 'light' ? 'dark' : 'light'
  setTheme(next)
  localStorage.setItem('theme', next)
  document.documentElement.setAttribute('data-theme', next)
}

// NavBar 우측에 버튼
<button onClick={toggleTheme}>
  {theme === 'light' ? '🌙 다크' : '☀️ 라이트'}
</button>
```

### 반응형 레이아웃
```
데스크탑 (1024px+): 상단 NavBar, 차트 2열
태블릿  (768~1024px): 상단 NavBar, 차트 1열
모바일  (~768px):    하단 탭 네비게이션, 차트 전체너비
```

### NavBar 구성
```
[⚾ KBO Savant 로고]  [홈] [리더보드] [선수 비교] [팀 통계]  [검색창]  [🌙 다크]
```

### 모바일 하단 탭바 구성
```
[🏠 홈]  [📊 리더보드]  [🔍 검색]  [⚖️ 비교]  [🏟️ 팀]
```

---

## KBO Savant 구현 가능/불가능 지표 최종 정리

### ✅ 구현 가능 (크롤링 + 계산)
```
Batting Run Value     → KBO 전용 RE Matrix 직접 계산
Hard-Hit %            → KBO 게임센터 타구속도 크롤링
Barrel %              → 타구속도 + 발사각 조합 계산
Avg Exit Velo         → 타구속도 크롤링
LA Sweet-Spot %       → 발사각 크롤링
Chase %               → 투구 좌표 크롤링
Whiff %               → 헛스윙 데이터 크롤링
K% / BB%              → 스탯티즈 크롤링
WAR / wRC+ / FIP 등   → 스탯티즈 크롤링
Spray Chart           → 타구 방향 크롤링
Rolling wOBA 트렌드   → 직접 계산
도루 성공률 / 추가진루율 → KBO 게임센터 크롤링
```

### ❌ 구현 불가능 (MLB 전용 센서/모델)
```
xwOBA / xBA / xSLG    → MLB Statcast 독자 예측 모델 (KBO 비공개)
Bat Speed             → 배트 트래킹 센서 (KBO 미도입)
Squared-Up %          → 배트 트래킹 센서 (KBO 미도입)
Sprint Speed          → 선수 위치 추적 센서 (KBO 미공개)
Baserunning Run Value → Sprint Speed 기반 계산 (원본 없음)
Fielding Run Value    → 수비 위치 추적 데이터 (KBO 미공개)
```

### Batting Run Value 계산 방식
```python
# KBO 전용 Run Expectancy Matrix 직접 계산
# 필요 데이터: 볼카운트 + 주자상황 + 아웃카운트 + 결과

# 1. 과거 KBO 데이터로 RE Matrix 계산
# 2. 투구별 RE 변화값 계산
# 투구 Run Value = 투구 후 RE - 투구 전 RE + 실제 득점
# 3. 시즌 누적 합산

# 두 가지 버전 제공:
# Context-Neutral: 주자/아웃 상황 무관, 순수 능력치
# Leveraged: 득점권 등 고압 상황 가중치 적용
```

---

## 최종 구현 지표 목록 (전체)

### ✅ 타자 지표
```
# 스탯티즈 크롤링
WAR / oWAR
wRC+ / wOBA
OPS / AVG / OBP / SLG
BABIP / BB% / K%

# KBO RE Matrix 직접 계산
Batting Run Value     → 투구별 득점 기여 누적
                        Context-Neutral + Leveraged 두 버전

# KBO 게임센터 크롤링 + 계산
Hard-Hit %            → 타구속도 ≥ 150km/h 비율
Barrel %              → EV ≥ 158km/h + LA 26~30도
Sweet-Spot %          → 발사각 8~32도 비율
Avg Exit Velo         → 평균 타구속도
Chase %               → 존 바깥 스윙 비율
Whiff %               → 헛스윙 비율
GB% / FB% / LD%       → 타구 종류 비율
Spray Chart           → 타구 방향 시각화

# KBO 자체 ML 모델 (LogisticRegression 기반)
xBA                   → 타구속도 + 발사각 기반 안타 확률
xSLG                  → 타구속도 + 발사각 기반 장타 확률
xwOBA                 → xBA + xSLG 종합

# 파생 지표
BABIP - xBA 차이      → 운 성분 시각화 (양수=행운, 음수=불운)
Rolling wOBA 트렌드   → 100PA 롤링 wOBA 라인차트
```

### ✅ 투수 지표
```
# 스탯티즈 크롤링
WAR / FIP / ERA-
xFIP / BABIP 허용
K% / BB% / HR9
LOB%

# KBO RE Matrix 직접 계산
Pitching Run Value    → 전체 투구 득점 기여
Fastball Run Value    → 패스트볼 계열 (포심/투심/커터)
Breaking Run Value    → 브레이킹 계열 (슬라이더/커브)
Offspeed Run Value    → 오프스피드 계열 (체인지업/스플리터)

# KBO 게임센터 크롤링 + 계산
CSW%                  → (헛스윙 + 루킹 스트라이크) / 전체 투구
Whiff%                → 헛스윙 비율
Chase%                → 존 바깥 유인 성공률
허용 Hard-Hit %       → 타구속도 ≥ 150km/h 비율
허용 Barrel %         → EV ≥ 158 + LA 26~30도
허용 Avg Exit Velo    → 허용 평균 타구속도
GB% / FB%             → 허용 타구 종류
Fastball Velo         → 포심 평균 구속
구종별 평균 구속       → 구종별 크롤링

# KBO 자체 ML 모델
xERA                  → xBA 기반 기대 ERA
허용 xBA              → 허용 타구 기반 안타 확률
```

### ✅ 공통 시각화
```
퍼센타일 바 (1~100)   → 전 지표 리그 내 위치
                        색상: 90+=빨강 75+=주황 40~74=회색 25~39=하늘 25-=파랑
BABIP - xBA 차이       → 운 성분 분리 시각화
Spray Chart            → D3.js 야구장 형태
스트라이크존 히트맵    → D3.js 9구역 + 존 바깥 4구역
구속 트렌드            → 경기별 라인차트
Rolling wOBA/ERA 트렌드 → 100PA/이닝 롤링
```

### ❌ 최종 불가능 목록 (센서 하드웨어 문제)
```
Bat Speed             → 배트 트래킹 센서 미도입
Squared-Up %          → 배트 트래킹 센서 미도입
Sprint Speed          → 위치 추적 센서 미공개
Baserunning RV        → Sprint Speed 기반 계산 불가
Fielding RV           → 수비 위치 추적 미공개
Extension             → 릴리즈 포인트 (일부 구장만)
dWAR                  → 추후 검토 (수비 트래킹 데이터 한계)
```

### ML 모델 구현 방법 (xBA/xSLG/xwOBA)
```python
# backend/services/ml_models.py
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import numpy as np

class KBOExpectedStats:
    """
    KBO 자체 xBA/xSLG/xwOBA 모델
    입력: Exit Velocity + Launch Angle
    출력: 안타/장타 확률
    """

    def train_xba(self, batted_balls: list):
        """
        KBO 과거 타구 데이터로 xBA 모델 학습
        X = [[exit_velocity, launch_angle], ...]
        y = [1(안타) or 0(아웃), ...]
        """
        X = [[b["exit_velocity"], b["launch_angle"]] for b in batted_balls]
        y = [1 if b["result"] in ["안타","2루타","3루타","홈런"] else 0
             for b in batted_balls]
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        self.xba_model = LogisticRegression()
        self.xba_model.fit(X_scaled, y)

    def predict_xba(self, exit_velocity: float, launch_angle: float) -> float:
        X = self.scaler.transform([[exit_velocity, launch_angle]])
        return round(self.xba_model.predict_proba(X)[0][1], 3)

    def calc_babip_luck(self, babip: float, xba: float) -> float:
        """
        BABIP - xBA 차이 → 운 성분
        양수: 행운 (실제 결과 > 기대값)
        음수: 불운 (실제 결과 < 기대값)
        """
        return round(babip - xba, 3)
```

---

## UI 설계 명세 (전체 페이지)

### 전체 디자인 원칙
- Baseball Savant 스타일 기반
- 흰 배경 + 진한 네이비 NavBar
- 데이터 밀도 우선 (화려함보다 정보량)
- 퍼센타일 컬러 바로 리그 내 위치 즉시 파악

---

### NavBar 구조

```
데스크탑:
[⚾ KBO Savant] [스코어보드] [리더보드 ▾] [통계 ▾] [선수 비교] ... [검색창] [🌙]

리더보드 드롭다운 (메가메뉴 4열):
타격: Exit Velocity & Barrels / Expected Statistics / Percentile Rankings / Run Value / Rolling Windows
투구: Exit Velocity & Barrels / Expected Statistics / Percentile Rankings / Pitch Arsenal Stats / Run Value
팀:   팀 타격 순위 / 팀 투구 순위 / 팀 타구질 비교
기타: Top Performers / Park Factors / Year to Year

통계 드롭다운 (메가메뉴 4열):
선수 통계: 선수 타격 통계 / 선수 투구 통계 (연도별)
리그/팀:   리그 타격 (팀별 집계) / 리그 투구 (팀별 집계)
구종 분석: Pitch Arsenal Stats / Pitch Movement
검색:      Statcast 검색

모바일 하단 탭바:
[🏠 홈] [📊 리더보드] [🔍 검색] [⚖️ 비교] [📈 통계]
```

---

### 페이지 라우팅

```
/                           홈 (스코어보드)
/leaderboard                리더보드 (타격/투구 탭)
/leaderboard/percentile     퍼센타일 랭킹
/leaderboard/expected       Expected Stats (xBA/xSLG/xwOBA)
/leaderboard/run-value      Run Value
/stats/league/batting       리그 타격 (팀별 집계 포함)
/stats/league/pitching      리그 투구 (팀별 집계 포함)
/stats/player/batting       선수 타격 Statcast
/stats/player/pitching      선수 투구 Statcast
/players/:id                선수 상세 페이지
/compare                    선수 비교
```

---

### 홈 페이지 (/)

```
[NavBar]
[페이지 헤더 없음 — 바로 콘텐츠]

섹션 1: 오늘의 경기 스코어보드
- 당일 경기 카드 가로 나열 (팀명 / 스코어 / 이닝 or 시간)
- LIVE 배지 표시
- 경기 없는 날 자동 숨김

섹션 2: 퍼센타일 하이라이트
- 이번 주 주목 선수 3명 카드
- 각 카드: 선수명 + 팀 + 퍼센타일 컬러 원 4~5개

섹션 3: 타자 / 투수 WAR 리더보드 미리보기
- 나란히 2열
- Top 5 + 전체보기 → /leaderboard

섹션 4: EV & 하드힛% 리더보드 미리보기
- Top 3 + 전체보기 → /leaderboard/expected
```

---

### 리더보드 페이지 (/leaderboard)

```
[NavBar]
[페이지 헤더: "리더보드" + 설명]
[탭: 타자 | 투수 | EV & 타구질 | 퍼센타일 랭킹 | 팀 통계]
[필터바: 시즌 | 팀 | 포지션 | 규정 타석/이닝 | CSV 다운로드]

테이블 컬럼:
타자: # / 선수 / WAR / wRC+ / OPS / 하드힛% / 배럴% / 평균EV / xBA / BABIP
투수: # / 선수 / WAR / FIP / ERA- / CSW% / Whiff% / 허용하드힛% / xERA

각 수치 아래 퍼센타일 컬러바 표시
컬럼 헤더 클릭 → 정렬
선수 이름 클릭 → /players/:id
페이지네이션 30명씩

모바일: 선수명 + 핵심 스탯 3개만 표시
```

---

### 선수 상세 페이지 (/players/:id)

```
[NavBar]
[선수 헤더: 이름 / 팀 / 포지션 / 투타 / 생년월일 / 시즌 선택 / 비교 추가 버튼]
[탭: 퍼센타일 랭킹 | 타격/투구 스탯 | 타구 추적 | 존 분석 | 트렌드]

퍼센타일 랭킹 탭 (기본):
- 상단 그라데이션 스케일 바 (1~100, 파랑→빨강)
- 퍼센타일 행 구조: [지표명] [1~100 바] [퍼센타일 원] [실제 수치]
- 눈금선: 25 / 50 / 75

타자 섹션 구분:
① 핵심 생산 지표: WAR / wRC+ / OPS / BABIP / BB%
② 타구 질 지표: 하드힛% / 평균EV / 배럴% / 스위트스팟% / xBA / xwOBA
③ 선구안 지표: Chase% / Whiff% (낮을수록 우수 표기)
④ 기본 스탯 카드: AVG / HR / RBI / SB / BB% / K%

투수 섹션 구분:
① 핵심 가치 지표: WAR / ERA- / FIP / Pitching Run Value
② 구위 지표: CSW% / Whiff% / K% / Chase% / Fastball RV / Breaking RV
③ 허용 타구질: 허용 하드힛% / 허용 배럴% / 허용 평균EV / xERA
④ 제구 지표: BB% / BABIP 허용
⑤ 구종 구성 필: 구종별 비율 + 평균 구속
⑥ 기본 스탯 카드: ERA / IP / K / BB / HR / W-L / GS
⑦ 구속 트렌드 라인차트

추가 탭 콘텐츠:
타자: 존별 타율 히트맵 + 스프레이 차트 + Rolling wOBA
투수: 스트라이크존 피안타율 히트맵 + 볼카운트별 구종 + Rolling ERA
```

---

### 선수 비교 페이지 (/compare)

```
[NavBar]
[헤더: 선수 A 검색창] vs [선수 B 검색창] + 시즌 선택

선수 헤더 카드 2개 (나란히):
- 아바타 + 이름 + 팀/포지션 + WAR

범례: 선수 A 색(빨강) / 선수 B 색(파랑)

퍼센타일 바 비교:
- 각 지표마다 바 2줄 (A 위, B 아래)
- 퍼센타일 원 + 실제 수치 나란히 표시
- 섹션: 핵심 생산 / 타구 질 / 선구안

스탯 나란히 테이블:
- AVG / wRC+ / 하드힛% / xBA / BABIP-xBA 차이

Rolling wOBA 트렌드 겹쳐보기:
- A(빨강) + B(파랑) 라인 동시 표시

인터랙션:
- 선수 검색 자동완성 (2글자 이상)
- 선수 이름 클릭 → /players/:id
- 시즌 변경 시 전체 재로딩
```

---

### 리그 타격/투구 페이지 (/stats/league/batting, /stats/league/pitching)

```
[NavBar]
[헤더: "리그 타격 통계" or "리그 투구 통계"]
[필터: 시즌 | 팀 선택 (전체/개별 팀)]

팀별 집계 테이블:
타격: 팀 / 팀WAR / wRC+ / OPS / 하드힛% / 배럴% / 평균EV / xBA
투구: 팀 / 팀WAR / 팀FIP / ERA- / CSW% / 허용하드힛% / xERA

팀 wRC+ 가로 바 차트 (리그 평균 100 기준선)
팀 EV vs 하드힛% 산점도

팀 클릭 → 해당 팀 필터로 리더보드 이동
```

---

### 컬러 시스템 (확정)

```css
/* 라이트모드 (기본) */
--color-bg-nav:      #041E42   NavBar 배경
--color-bg-page:     #F8FAFC   페이지 배경
--color-bg-card:     #FFFFFF   카드 배경
--color-primary:     #041E42   주 텍스트
--color-accent:      #D0021B   포인트 (빨강)
--color-border:      #E2E8F0   테두리

/* 퍼센타일 컬러 */
90+ → #C0392B  빨강  (최상위)
75+ → #E67E22  주황  (상위)
40~74 → #95A5A6  회색  (평균)
25~39 → #3498DB  하늘  (하위)
25- → #1E3A8A  파랑  (최하위)

/* 선수 비교 */
선수 A → #C0392B  빨강
선수 B → #1E3A8A  파랑

/* 히트맵 */
높음 → #C0392B  중간 → #F5F5DC  낮음 → #1E3A8A
```

---

### 폰트

```
한글/UI: Noto Sans KR (Google Fonts)
숫자/스탯: Roboto Mono (Google Fonts)
```

---

### 반응형 기준점

```
데스크탑 1024px+: 메가메뉴 NavBar / 차트 2열 / 테이블 전체 컬럼
태블릿 768~1024px: 일반 NavBar / 차트 1열 / 테이블 주요 컬럼
모바일 ~768px:     하단 탭바 / 차트 전체너비 / 테이블 핵심 3컬럼
```

---

## 선수 상세 페이지 최종 UI 명세 (확정)

### 전체 레이아웃 구조 (3열 — PC 기준)

```
[NavBar — 고정]
[선수 헤더 밴드 — 고정]
[탭바 — 고정]
─────────────────────────────────────────────
[좌측 패널]  |  [중앙 패널]  |  [우측 패널]
 커리어 스탯  |  퍼센타일 바  |  차트들
 (1fr)       |  (300px)     |  (250px)
─────────────────────────────────────────────
```

### 선수 헤더 밴드
```
배경: #0A2240 (네이비)
구성: [아바타] [이름] [포지션태그] [타/투태그] [소속팀 · 생년월일]
      ... (우측) [AVG pill] [HR pill] [RBI pill] [WAR pill] [비교추가 버튼]
높이: 최소화 (1줄)
연도 드롭다운: 없음 (좌측 테이블 클릭으로 대체)
```

### 탭 구성 (타자)
```
퍼센타일 랭킹 | 타격 스탯 | 타구 추적 | 존 분석 | 트렌드
```

### 탭 구성 (투수)
```
퍼센타일 랭킹 | 투구 스탯 | 구종 분석 | 존 분석 | 트렌드
```

---

### 타자 페이지 상세

**좌측: 커리어 스탯 테이블**
```
컬럼: 시즌 / G / AVG / OBP / SLG / OPS / HR / RBI / SB / BB% / K% / wRC+ / WAR / xBA / HH% / Avg EV
연도 클릭 → 중앙 퍼센타일 바 해당 연도로 업데이트
마지막 행: 통산 합계
PC 풀스크린에서 가로 스크롤 없이 전체 표시
```

**중앙: 퍼센타일 바 (Percentile Rankings)**
```
상단: 그라데이션 스케일 바 (1~100, 파랑→빨강)
우측 상단: 현재 선택 연도 배지

섹션 1 — 생산 지표
WAR / wRC+ / OPS / BABIP

섹션 2 — 타구 질 (Statcast)
Hard-Hit% / Avg EV / Barrel% / xBA / xwOBA

섹션 3 — 선구안 (낮을수록 우수)
Chase% / Whiff%

행 구조: [지표명 + ⓘ아이콘] [1~100 바] [퍼센타일 원] [실제수치]
지표명 호버 → 한국어 툴팁 표시
```

**우측: 차트**
```
스프레이 차트 (D3.js 야구장)
존별 타율 히트맵 (3×3 그리드)
구종별 성적 (가로 바)
BABIP - xBA 운 성분 카드
```

---

### 투수 페이지 상세

**좌측: 커리어 스탯 테이블**
```
컬럼: 시즌 / G / GS / IP / ERA / FIP / ERA- / K% / BB% / WAR / CSW% / Whiff% / xERA / 허용HH% / 허용EV
연도 클릭 → 중앙 퍼센타일 바 업데이트
```

**중앙: 퍼센타일 바 (Percentile Rankings)**
```
섹션 1 — 핵심 가치 지표
WAR / ERA- / FIP / Pitching Run Value

섹션 2 — 구위 지표
CSW% / Whiff% / K% / Chase%

섹션 3 — 구종별 Run Value
Fastball RV / Breaking RV / Offspeed RV

섹션 4 — 허용 타구질 (낮을수록 우수)
허용 Hard-Hit% / 허용 Barrel% / 허용 Avg EV / xERA

섹션 5 — 제구
BB% / BABIP 허용
```

**우측: 차트**
```
스트라이크존 피안타율 히트맵
구속 트렌드 라인차트 (경기별)
구종 분포 바 (구종 + 비율 + 평균구속)
```

---

### 팀 페이지 상세

**구조: 동일한 3열 레이아웃**

**좌측: 팀 로스터 리스트**
```
해당 팀 선수 목록 (타자/투수 탭 분리)
선수 클릭 → /players/:id 이동
각 선수: 이름 / 포지션 / WAR / wRC+(타자) or FIP(투수)
```

**중앙: 팀 퍼센타일 바**
```
섹션 1 — 팀 타격
팀 wRC+ / 팀 OPS / 팀 Hard-Hit% / 팀 Avg EV / 팀 xBA

섹션 2 — 팀 투구
팀 ERA- / 팀 FIP / 팀 CSW% / 팀 허용HH%

섹션 3 — 팀 종합
팀 WAR / 팀 득점 / 팀 실점
```

**우측: 팀 차트**
```
팀 wRC+ 시즌 트렌드
팀 EV vs 허용EV 비교
팀 WAR 누적 라인차트
```

---

### 공통 UI 규칙

```
지표명: 영어 그대로 (WAR, OPS, xBA, FIP 등)
UI 텍스트: 한국어 (생산 지표, 타구 질, 선구안 등)
툴팁: 한국어 설명 + 지표 정의
섹션 구분: 얇은 라인 + 섹션명 텍스트
퍼센타일 원 색상:
  90+ → #C0392B (빨강)
  75+ → #E67E22 (주황)
  40~74 → #95A5A6 (회색)
  25~39 → #3498DB (하늘)
  25- → #1E3A8A (파랑)

모바일 전환:
  3열 → 1열로 전환
  순서: 헤더 → 퍼센타일 바 → 커리어 테이블(가로 스크롤) → 차트
```

---

## 선수 비교 페이지 최종 UI 명세 (확정)

### 전체 레이아웃 (3열 — 타자/투수 동일 구조)
```
[NavBar — 고정]
[비교 헤더 — 선수 A 카드 vs 선수 B 카드]
[탭바 — 퍼센타일 비교 | 스탯 비교 | 트렌드 비교]
──────────────────────────────────────────
[좌측: 연도별 스탯] | [중앙: 퍼센타일 바] | [우측: 차트]
      (1fr)         |      (340px)        |   (260px)
──────────────────────────────────────────
```

### 비교 헤더
```
배경: #0A2240
구성: [선수A 카드] vs [선수B 카드] + 시즌 선택 + 초기화 버튼
선수 카드: 아바타 + 이름 + 포지션 + 팀 + WAR pill + wRC+ pill
색상 구분: 선수 A/B 이름 텍스트로만 구분 (A=빨강, B=파랑 텍스트)
           바 색상은 퍼센타일 기준으로 별도 적용
```

### 좌측: 시즌별 스탯 비교 테이블
```
두 선수 연도를 같은 시즌끼리 묶어서 표시
이정후 행 → 연한 크림 배경 (#FFFAF0)
김도영 행 → 연한 회색 배경 (#F8FAFC)
선수명 텍스트: 이정후=빨강(#C0392B), 김도영=파랑(#1E3A8A)
최근 시즌일수록 opacity 높게, 과거로 갈수록 낮아짐
연도 그룹 사이 얇은 구분선
```

### 중앙: 퍼센타일 바 (핵심 규칙)
```
★ 바 색상 = 퍼센타일 기준 (선수 구분 색 아님)
  90+ → #C0392B (빨강)
  75~89 → #E67E22 (주황)
  40~74 → #95A5A6 (회색)
  25~39 → #3498DB (하늘)
  1~24 → #1E3A8A (파랑)

선수 식별: 바 왼쪽 이름 레이블로 구분
  이정후 레이블 → 빨강 텍스트
  김도영 레이블 → 파랑 텍스트

지표별 구조:
  [지표명]
  이정후  [────────────────] [퍼센타일원] [수치]
  김도영  [────────────]     [퍼센타일원] [수치]

지표 그룹 사이 구분선

상단 퍼센타일 범례 박스:
  빨강=90+ / 주황=75~89 / 회색=40~74 / 하늘=25~39 / 파랑=1~24
```

### 우측: 비교 차트
```
스탯 나란히 비교 테이블:
  이정후(빨강) | 지표명 | 김도영(파랑)
  더 좋은 쪽 굵게 표시
  (낮을수록 좋은 지표는 반전 적용 — Chase%, Whiff% 등)

Rolling wOBA/ERA 트렌드:
  이정후 → 빨강 라인
  김도영 → 파랑 라인
  두 라인 겹쳐서 표시
```

### 투수 비교 시 중앙 섹션 구성
```
섹션 1: 핵심 가치 — WAR / ERA- / FIP
섹션 2: 구위 — CSW% / Whiff% / K%
섹션 3: 구종 RV — Fastball RV / Breaking RV / Offspeed RV
섹션 4: 허용 타구질 — 허용 Hard-Hit% / 허용 Avg EV / xERA
```

---

## 사이트 이름 & 로고 (확정)

### 사이트 이름
```
KBO Savant
```

### 로고 구성
```
아이콘: 야구공 SVG (흰 원 + 빨간 스티치)
텍스트: "KBO Savant" 한 줄
폰트:   Noto Sans KR · font-weight: 600 · letter-spacing: .03em

다크 배경 (NavBar):
  아이콘 → 흰 원 + 빨간(#C0392B) 스티치
  텍스트 → #FFFFFF

라이트 배경:
  아이콘 → 네이비(#041E42) 원 + 빨간 스티치
  텍스트 → #041E42
```

### 야구공 아이콘 SVG
```svg
<svg width="22" height="22" viewBox="0 0 28 28">
  <circle cx="14" cy="14" r="12" fill="#fff"/>
  <path d="M8 7 Q14 10 8 21" fill="none" stroke="#C0392B"
        stroke-width="1.5" stroke-linecap="round"/>
  <path d="M20 7 Q14 10 20 21" fill="none" stroke="#C0392B"
        stroke-width="1.5" stroke-linecap="round"/>
  <line x1="9" y1="10" x2="7" y2="12" stroke="#C0392B"
        stroke-width="1" stroke-linecap="round"/>
  <line x1="9" y1="14" x2="7" y2="16" stroke="#C0392B"
        stroke-width="1" stroke-linecap="round"/>
  <line x1="19" y1="10" x2="21" y2="12" stroke="#C0392B"
        stroke-width="1" stroke-linecap="round"/>
  <line x1="19" y1="14" x2="21" y2="16" stroke="#C0392B"
        stroke-width="1" stroke-linecap="round"/>
</svg>
```

### 다크모드 기본값
```
기본값:  라이트모드
토글:    NavBar 우측 🌙 버튼
전환:    CSS 변수 교체 (data-theme="light" / "dark")
저장:    localStorage → 재접속 시 유지
```

### NavBar 로고 코드 (React)
```tsx
// components/ui/NavBar.tsx
<div className="nav-logo">
  <svg width="20" height="20" viewBox="0 0 28 28">
    {/* 야구공 SVG */}
  </svg>
  <span>KBO Savant</span>
</div>
```

---

## 에러 / 로딩 / 빈 상태 UI 명세

### 배경색 원칙
```
NavBar:          #041E42 (항상 고정)
선수 헤더 밴드:   #0A2240 (항상 고정)
탭바:            #FFFFFF
본문 배경:        #F8FAFC  ← 에러/로딩/빈 상태도 동일
카드 배경:        #FFFFFF
```

### 404 페이지 (/players/없는ID, 잘못된 URL)
```
배경: #F8FAFC (라이트모드 기본)
구성:
  - 흐릿한 야구공 아이콘 (opacity: 0.2)
  - "404" 큰 텍스트 (color: #E2E8F0)
  - "선수를 찾을 수 없습니다" (font-size: 14px)
  - 설명 텍스트 (color: #9CA3AF)
  - [홈으로 돌아가기] 버튼 (배경: #041E42)
  - [리더보드 보기] 버튼 (배경: #fff, 테두리: #E2E8F0)
```

### 500 서버 에러
```
배경: #F8FAFC
구성:
  - ⚠️ 아이콘
  - "데이터를 불러오는 중 오류가 발생했습니다"
  - "잠시 후 다시 시도해주세요"
  - [다시 시도] 버튼
```

### 스켈레톤 로딩 UI
```
배경: #F8FAFC (본문), #F1F5F9 (스켈레톤 블록)
애니메이션: pulse (opacity 1 → 0.5 → 1, 1.5s 반복)
실제 레이아웃 형태 그대로 회색 블록으로 대체:
  - 선수 헤더: 원형 아바타 + 텍스트 블록
  - 탭바: 텍스트 블록 3개
  - 퍼센타일 바: 지표명 블록 + 바 블록 + 원형 블록
  - 우측 차트: 사각형 블록
```

### 빈 상태 (데이터 부족)
```
배경: #F8FAFC
조건: 최소 표본 미달 시 해당 지표만 비활성화
  타자: 50 PA 미만
  투수: 20 IP 미만

데이터 없는 지표 표시:
  - 바: 빗금 패턴 (repeating-linear-gradient)
  - 퍼센타일 원: #E8ECF0 배경 + "—" 텍스트
  - 수치: "부족" 텍스트 (color: #9CA3AF)

하단 경고 배너:
  배경: #FFF8E1
  테두리: #FDE68A
  텍스트: "⚠️ 표본 수 부족으로 일부 지표를 표시할 수 없어요 (최소 N PA 필요)"
  color: #92400E
```

---

## 연도별 지표 비교 테이블 최종 명세 (Savant Splits 방식)

### 구조
```
지표명(세로) × 연도(가로) 테이블
연도가 많아지면 가로 스크롤로 처리 (overflow-x: auto)
마지막 컬럼: 통산 (border-left로 구분)
```

### 색상 규칙
```
★ 빨강 (#C0392B) = 커리어 최고값
☆ 파랑 (#2980B9) = 커리어 최저값
현재 선택 연도 컬럼 = #EFF6FF 배경 강조
```

### 섹션 구분 (투수)
```
기본 스탯:      ERA / IP / K% / BB%
세이버메트릭스:  FIP / xERA / ERA- / WAR
구위:           CSW% / Whiff% / Chase% / Pitching RV
허용 타구질:    Hard-Hit% 허용 / Barrel% 허용 / Avg EV 허용
Run Value:      Fastball RV / Breaking RV / Offspeed RV
구속:           포심 / 슬라이더 / 체인지업 평균구속
```

### 섹션 구분 (타자)
```
기본 스탯:      AVG / OBP / SLG / OPS / HR / RBI / SB
세이버메트릭스:  wRC+ / wOBA / BABIP / WAR / BB% / K%
타구질:         Hard-Hit% / Barrel% / Avg EV / xBA / xSLG / xwOBA
선구안:         Chase% / Whiff%
Run Value:      Batting RV
```

### 리그 평균 행
```
각 지표 행 바로 아래 리그 평균값을 회색으로 표시
예:
ERA          | 4.12 | 3.84 | 2.84★
리그 평균     | 4.41 | 4.38 | 4.02    ← color: #9CA3AF
```

### 전년 대비 화살표
```
각 수치 옆에 전년 대비 변화량 표시
개선: ↑ 초록 (#16A34A)
악화: ↓ 빨강 (#DC2626)
예: 2.84 ↓0.37  /  33.2% ↑1.8%p
(투수는 ERA/FIP 낮을수록 개선, K%/CSW% 높을수록 개선 — 방향 자동 판별)
```

---

## 네비게이션 최종 구조 (확정)

```
[🔵 KBO Savant] [스코어보드] [리더보드 ▾] [통계 ▾] [선수 비교] ... [검색창] [🌙]

리더보드 ▾ 드롭다운:
  타격: Exit Velocity & Barrels / Expected Stats / Percentile Rankings / Run Value / Rolling Windows
  투구: Exit Velocity & Barrels / Expected Stats / Percentile Rankings / Pitch Arsenal Stats / Run Value
  팀:   팀 타격 순위 / 팀 투구 순위 / 팀 타구질 비교

통계 ▾ 드롭다운:
  선수 통계: 선수 타격 통계 / 선수 투구 통계
  리그/팀:   리그 타격 / 리그 투구
  구종 분석: Pitch Arsenal Stats / Pitch Movement
  검색:      Statcast 검색 / Park Factors

시각화 메뉴: 없음 (제거)
```

---

## 선수 상세 페이지 최종 스크롤 구조 (탭 없음)

### 고정 영역 (스크롤해도 유지)
```
NavBar
선수 헤더 밴드 (이름/팀/포지션/핵심 스탯 pill)
```

### 스크롤 영역 (3열 레이아웃)
```
열 구성: [커리어 테이블 1fr] [퍼센타일 바 300px] [차트 240px]

── 스크롤 1 ──
좌: 연도별 전체 지표 테이블 (가로 스크롤)
중: Percentile Rankings (1~100 바)
우: 구속 트렌드 + 구종 구성

── 스크롤 2 ── (필터 바: 구종/상대/카운트)
좌: 투구 탄착군
중: 존별 피안타율 히트맵 (9구역 + 바깥 4구역)
우: 볼카운트별 구종 + 좌타 vs 우타 탄착군

── 스크롤 3 ──
Rolling ERA/wOBA 트렌드 (전체 너비)
```

### 탭 없음
```
모든 콘텐츠가 스크롤로 연결
탭 구조 제거 — PC에서는 스크롤이 더 자연스러움
```

---

## 모바일 상세 레이아웃 (확정)

### 반응형 기준점
```
1024px+    → 3열 PC 레이아웃
768~1024px → 2열 태블릿
~768px     → 1열 모바일 + 하단 탭바
```

### 모바일 가로 스크롤 방지 원칙
```
가로 스크롤 허용: 커리어 스탯 테이블만 (overflow-x: auto 래퍼)
나머지 전체:      가로 스크롤 절대 없음
                  컬럼 축소 / 세로 배치로 해결
```

### 컴포넌트별 모바일 처리

**퍼센타일 바**
```
PC:     grid-template-columns: 100px 1fr 75px
모바일: grid-template-columns: 80px 1fr 60px
→ 바가 화면 너비에 맞게 자동 축소, 가로 스크롤 없음
```

**리더보드 테이블**
```
PC:     선수명 / WAR / wRC+ / OPS / Hard-Hit% / Barrel% / EV / xBA
모바일: 선수명 / WAR / wRC+ / HH% (3컬럼만)
→ 나머지는 선수 클릭 → 상세 페이지 확인
```

**커리어 스탯 테이블 (유일한 예외)**
```
overflow-x: auto 래퍼로 감싸서 가로 스크롤 허용
단, 래퍼 바깥 레이아웃은 영향 없게 처리
```

**존별 히트맵**
```
width: 100% SVG → 화면 너비에 맞게 자동 축소
가로 스크롤 없음
```

**투구 탄착군**
```
PC:     차트 + 범례 나란히 (가로)
모바일: 차트 전체 너비 → 범례 아래로
```

**선수 비교 페이지**
```
PC:     선수A 카드 vs 선수B 카드 가로 나란히
모바일: 선수A 카드 → vs → 선수B 카드 세로로
        퍼센타일 바: 지표마다 2줄씩 세로 표시
```

**구종 구성 바**
```
PC:     가로 바 + 수치 나란히
모바일: 동일 (너비 100% 자동 적용)
```

### 모바일 스크롤 순서 (선수 상세)
```
1. 선수 헤더 (고정 — position: sticky)
2. Percentile Rankings
3. 존별 히트맵 (존별 피안타율/타율)
4. 투구 탄착군
5. 볼카운트별 구종 비율
6. 구속 트렌드
7. 커리어 스탯 테이블 (가로 스크롤)
8. Rolling ERA/wOBA
```

### 하단 탭바 (모바일 고정)
```
[홈] [리더보드] [검색] [비교] [통계]
position: fixed; bottom: 0;
height: 56px
background: #041E42
모바일에서만 표시 (md:hidden)
```

### Tailwind 반응형 적용
```tsx
/* 3열 → 1열 전환 */
<div className="grid grid-cols-1 lg:grid-cols-3 gap-0">

/* 퍼센타일 바 그리드 */
<div className="grid gap-2"
  style={{gridTemplateColumns: 'clamp(70px,20%,100px) 1fr clamp(50px,15%,75px)'}}>

/* 커리어 테이블 래퍼 */
<div className="overflow-x-auto max-w-full">
  <table className="min-w-max">...</table>
</div>

/* 하단 탭바 */
<nav className="fixed bottom-0 left-0 right-0 lg:hidden h-14 bg-[#041E42]">
```

---

## 배포 환경변수 (전체 목록)

### 백엔드 — Railway (.env + Railway 환경변수)
```env
# DB
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/kbo_savant

# 보안
SECRET_KEY=your-secret-key-32chars-minimum

# 크롤러
CRAWL_DELAY=1.5
KBO_BASE_URL=https://www.koreabaseball.com
STATIZ_BASE_URL=https://www.statiz.co.kr

# 스케줄러
CRAWL_HOUR=1
CRAWL_MINUTE=0
TIMEZONE=Asia/Seoul

# 환경
ENVIRONMENT=production
ALLOWED_ORIGINS=https://kbo-savant.vercel.app

# ML 모델
MIN_SAMPLE_PA=50
MIN_SAMPLE_IP=20
```

### 프론트엔드 — Vercel (.env.local + Vercel 환경변수)
```env
# API
REACT_APP_API_URL=https://kbo-savant-api.railway.app

# 환경
REACT_APP_ENV=production
```

### 로컬 개발 (.env)
```env
# 백엔드
DATABASE_URL=postgresql://postgres:password@localhost:5432/kbo_savant
SECRET_KEY=local-dev-secret-key
CRAWL_DELAY=1.5
KBO_BASE_URL=https://www.koreabaseball.com
STATIZ_BASE_URL=https://www.statiz.co.kr
CRAWL_HOUR=1
CRAWL_MINUTE=0
TIMEZONE=Asia/Seoul
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000

# 프론트엔드
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
```

### Docker Compose (로컬 DB)
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: kbo_savant
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Railway 배포 설정
```
서비스 1: FastAPI 백엔드
  - 빌드: Dockerfile
  - 포트: 8000
  - 헬스체크: GET /health

서비스 2: PostgreSQL
  - Railway 제공 PostgreSQL 플러그인
  - DATABASE_URL 자동 주입

서비스 3: Cron Job (크롤러 스케줄러)
  - 매일 01:00 KST 실행
  - 명령: python crawlers/scheduler.py
```

### Vercel 배포 설정
```
프레임워크: Create React App
빌드 명령: npm run build
출력 디렉토리: build
환경변수: REACT_APP_API_URL 설정 필수
```

---

## 배포 검증 계획 (교차 테스트 포함)

### 배포 환경 구성
```
로컬 개발:
  프론트엔드  http://localhost:3000  (React)
  백엔드      http://localhost:8000  (FastAPI)
  DB          localhost:5432         (PostgreSQL Docker)

스테이징:
  프론트엔드  https://kbo-savant-staging.vercel.app
  백엔드      https://kbo-savant-api-staging.railway.app
  DB          Railway PostgreSQL (스테이징)

프로덕션:
  프론트엔드  https://kbo-savant.vercel.app
  백엔드      https://kbo-savant-api.railway.app
  DB          Railway PostgreSQL (프로덕션)
```

---

### API 선택 기준

**REST API 선택 이유**
```
GraphQL 대신 REST 선택:
- 팀 규모 1인 → REST가 구현/디버깅 단순
- 데이터 구조가 명확히 정해져 있음
- FastAPI가 REST에 최적화 (자동 문서화)
- 프론트엔드가 React SPA → REST로 충분

엔드포인트 설계 원칙:
- 명사 기반 URL (/players, /leaderboard)
- 동사는 HTTP 메서드로 표현 (GET만 사용, 읽기 전용 서비스)
- 쿼리 파라미터로 필터/정렬/페이지네이션
- 응답은 항상 JSON
```

**주요 API 엔드포인트 전체 목록**
```
# 선수
GET /api/players/search?q={query}
GET /api/players/{id}
GET /api/players/{id}/batting?season={year}
GET /api/players/{id}/pitching?season={year}
GET /api/players/{id}/pitches?season={year}&pitch_type={type}
GET /api/players/{id}/batted-balls?season={year}
GET /api/players/{id}/career/batting
GET /api/players/{id}/career/pitching

# 리더보드
GET /api/leaderboard?type={batting|pitching}&stat={stat}&season={year}&team={team}&page={n}&per_page=30

# 비교
GET /api/compare?ids={id1},{id2}&season={year}

# 리그/팀
GET /api/league/batting?season={year}&team={team}
GET /api/league/pitching?season={year}&team={team}

# 헬스체크
GET /health
```

---

### 교차 테스트 체크리스트

#### 레벨 1 — 단위 테스트 (pytest / Vitest)
```
백엔드 단위:
□ 지표 계산 함수 (xBA, Hard-Hit%, Barrel% 등)
□ RE Matrix Run Value 계산
□ BABIP - xBA 운 성분 계산
□ 퍼센타일 계산 (리그 내 순위 → 0~100)
□ 크롤러 파싱 함수 (HTML → 데이터 구조)
□ 빈 데이터 / 표본 부족 엣지 케이스

프론트엔드 단위:
□ PercentileBar 퍼센타일별 색상 적용
□ StrikeZoneMap 빈 데이터 렌더링
□ SprayChart 타구 좌표 렌더링
□ PlayerSearchInput 자동완성 동작
□ 에러 바운더리 렌더링
```

#### 레벨 2 — API 통합 테스트
```
정상 케이스:
□ GET /api/players/search?q=이정 → 200, 결과 포함
□ GET /api/players/1/batting?season=2024 → 200, 전체 지표 포함
□ GET /api/players/1/pitching?season=2024 → 200, 전체 지표 포함
□ GET /api/leaderboard?type=batting&stat=war → 200, 정렬 확인
□ GET /api/compare?ids=1,2 → 200, 두 선수 데이터 포함
□ GET /health → 200

에러 케이스:
□ GET /api/players/99999 → 404
□ GET /api/players/search?q=가 → 200, 빈 배열 (에러 아님)
□ GET /api/leaderboard?type=invalid → 422
□ GET /api/players/1/batting?season=1900 → 422
□ DB 연결 실패 시 → 500, error_code 포함

응답 형식:
□ 모든 응답에 Content-Type: application/json
□ 에러 응답에 error_code 포함
□ 페이지네이션 응답에 total / page / per_page 포함
```

#### 레벨 3 — 프론트 ↔ 백엔드 교차 테스트
```
이 테스트가 핵심 — 각 환경(로컬/스테이징/프로덕션)에서 실행

□ 프론트 검색창 → API 호출 → 결과 드롭다운 표시
□ 선수 클릭 → API 호출 → 퍼센타일 바 렌더링
□ 리더보드 필터 변경 → API 재호출 → 테이블 업데이트
□ 선수 비교 → 두 선수 API 동시 호출 → 비교 테이블 렌더링
□ 연도 변경 → API 재호출 → 지표 업데이트
□ 구종 필터 → 탄착군 업데이트
```

#### 레벨 4 — 크롤러 데이터 정합성 테스트
```
크롤링 후 반드시 확인:
□ 선수 수 (KBO 등록 선수 대비 누락 없는지)
□ 시즌 데이터 완결성 (전 경기 크롤링 됐는지)
□ 중복 데이터 없음 (같은 경기 2번 저장 안 됐는지)
□ NULL 값 허용 여부 (신인/표본 부족 선수)
□ 지표 계산값 범위 검증
  - ERA: 0~20 사이
  - WAR: -5~15 사이
  - K%: 0~100 사이
  - xBA: 0~1 사이
```

#### 레벨 5 — E2E 테스트 (Playwright)
```
핵심 유저 플로우 5개:

플로우 1: 홈 → 선수 검색 → 투수 상세
  1. 홈 접속
  2. "양현종" 검색
  3. 드롭다운에서 선택
  4. 퍼센타일 바 로딩 확인
  5. 탄착군 차트 렌더링 확인

플로우 2: 홈 → 선수 검색 → 타자 상세
  1. "이정후" 검색 → 상세 페이지
  2. 존별 타율 히트맵 확인
  3. xBA / Hard-Hit% 수치 확인

플로우 3: 리더보드 → 필터 → 정렬 → 상세
  1. 리더보드 접속
  2. 투수 탭 클릭
  3. 시즌 2024 필터
  4. WAR 정렬 (내림차순)
  5. 1위 선수 클릭 → 상세 페이지

플로우 4: 선수 비교
  1. 비교 페이지 접속
  2. 이정후 검색 → 선택
  3. 김도영 검색 → 선택
  4. 퍼센타일 바 2줄 렌더링 확인
  5. 연도 2023으로 변경 → 업데이트 확인

플로우 5: 모바일 (375px)
  1. 뷰포트 375px 설정
  2. 홈 → 검색 → 선수 상세
  3. 가로 스크롤 발생 여부 체크 (없어야 함)
  4. 하단 탭바 표시 확인
  5. 커리어 테이블만 가로 스크롤 허용 확인
```

#### 레벨 6 — 배포 환경별 교차 테스트
```
로컬 → 스테이징 → 프로덕션 순서로 각 레벨 반복

로컬 체크리스트:
□ Docker PostgreSQL 정상 기동
□ FastAPI 서버 정상 기동 (localhost:8000)
□ React 앱 정상 기동 (localhost:3000)
□ API 응답 정상 확인
□ E2E 플로우 1~5 통과

스테이징 체크리스트:
□ Railway 백엔드 배포 성공
□ /health 엔드포인트 응답
□ Vercel 프론트 배포 성공
□ 스테이징 프론트 → 스테이징 API 연동 확인
□ CORS 설정 정상 (ALLOWED_ORIGINS 확인)
□ E2E 플로우 1~5 스테이징 URL로 실행

프로덕션 체크리스트:
□ 스테이징과 동일한 체크리스트
□ 크롤러 스케줄러 Railway Cron 등록 확인
□ DB 마이그레이션 적용 확인
□ 로그 수집 정상 확인
□ 에러 페이지 (404/500) 정상 표시
```

---

### 모니터링 항목
```
API 응답 시간:
  목표: 평균 200ms 이하
  경고: 500ms 초과 시 로그

DB 쿼리:
  느린 쿼리 기준: 100ms 초과
  인덱스 필수: players.name / pitching_stats.player_id+season / batting_stats.player_id+season

크롤러:
  성공률: 99% 이상 목표
  실패 시: logs/crawler.log에 CRITICAL 기록

프론트엔드:
  Lighthouse 점수 목표
  Performance: 90+
  Accessibility: 90+
  Best Practices: 90+
```

---

### DB 인덱스 (성능 최적화)
```sql
-- 선수 검색 (자동완성)
CREATE INDEX idx_players_name ON players(name);

-- 리더보드 조회
CREATE INDEX idx_batting_stats_season ON batting_stats(season, war DESC);
CREATE INDEX idx_pitching_stats_season ON pitching_stats(season, war DESC);

-- 선수별 스탯 조회
CREATE INDEX idx_batting_stats_player ON batting_stats(player_id, season);
CREATE INDEX idx_pitching_stats_player ON pitching_stats(player_id, season);

-- 투구/타구 데이터 조회
CREATE INDEX idx_pitches_pitcher ON pitches(pitcher_id, season, game_date);
CREATE INDEX idx_batted_balls_batter ON batted_balls(batter_id, season);
```

---

## 성능 최적화 전략 (처음부터 적용 필수)

### 원칙
```
성능 최적화는 나중에 하는 게 아니라 처음부터 설계에 반영
리팩토링 비용이 기하급수적으로 커지기 때문
아래 규칙은 Claude Code가 코드 작성 시 반드시 따라야 함
```

---

### 1. API 호출 병렬화 (필수)

```typescript
// 절대 금지 — 순차 호출
const batting = await fetchBatting(id)
const pitches = await fetchPitches(id)
const career = await fetchCareer(id)

// 필수 — 병렬 호출
const [batting, pitches, career] = await Promise.all([
  fetchBatting(id),
  fetchPitches(id),
  fetchCareer(id)
])
```

---

### 2. 점진적 로딩 (스켈레톤 우선)

```
페이지 진입 즉시:
  → NavBar + 선수 헤더 즉시 표시 (캐시된 선수 기본 정보)
  → 나머지 영역은 스켈레톤 UI 표시

데이터 도착 순서 (빠른 것부터):
  1. 선수 기본 정보 (50ms)    → 헤더 pill 채움
  2. 퍼센타일 바 (150ms)     → 바 렌더링
  3. 커리어 테이블 (200ms)   → 테이블 채움
  4. 존별 히트맵 (250ms)     → 히트맵 채움
  5. 투구 탄착군 (400ms)     → 차트 채움

규칙: 데이터 없어도 레이아웃 shift 없어야 함
      스켈레톤이 실제 컴포넌트와 동일한 크기 유지
```

---

### 3. DB 쿼리 최적화 (필수)

```python
# 절대 금지 — N+1 쿼리
players = db.query(Player).all()
for p in players:
    stats = db.query(BattingStat).filter_by(player_id=p.id).first()

# 필수 — JOIN으로 한번에
players = db.query(Player, BattingStat)\
    .join(BattingStat, Player.id == BattingStat.player_id)\
    .filter(BattingStat.season == season)\
    .all()

# 필수 — 필요한 컬럼만 SELECT
db.query(
    Player.id, Player.name, Player.team,
    BattingStat.war, BattingStat.wrc_plus
).join(BattingStat).all()
```

---

### 4. 캐싱 전략

```python
# 레벨 1: HTTP 캐시 헤더 (브라우저 캐시)
# 자주 안 바뀌는 데이터에 적용
@router.get("/api/leaderboard")
async def leaderboard():
    return JSONResponse(
        content=data,
        headers={
            "Cache-Control": "public, max-age=300"  # 5분
        }
    )

# 레벨 2: FastAPI 인메모리 캐시 (Redis 없이)
from functools import lru_cache
import time

_cache = {}
_cache_ttl = {}

def cache_get(key: str):
    if key in _cache and time.time() < _cache_ttl[key]:
        return _cache[key]
    return None

def cache_set(key: str, value, ttl: int = 300):
    _cache[key] = value
    _cache_ttl[key] = time.time() + ttl

# 리더보드 — 5분 캐시
# 선수 기본 정보 — 1시간 캐시
# 퍼센타일 바 — 1시간 캐시
# 투구 탄착군 — 6시간 캐시 (경기 없는 날)
```

---

### 5. 투구 탄착군 데이터 최적화

```python
# 시즌 전체 투구 3000개+ → 한번에 보내면 느림
# 해결: 집계 데이터로 변환해서 저장

# 크롤링 시점에 미리 계산해서 저장
class PitchZoneAggregation(Base):
    """
    투구 탄착군을 존별로 집계해서 저장
    raw 투구 데이터(3000개) → 집계 데이터(13개 구역)
    API 응답 크기 99% 감소
    """
    player_id = Column(Integer)
    season = Column(Integer)
    pitch_type = Column(String)      # 포심/슬라이더 등
    zone = Column(Integer)           # 1~9 존 안, 11~14 존 바깥
    count = Column(Integer)          # 해당 구역 투구 수
    batting_avg = Column(Float)      # 존별 피안타율
    whiff_pct = Column(Float)        # 존별 헛스윙률

# API 응답: 13개 행만 반환 → 매우 빠름
```

---

### 6. 프론트엔드 렌더링 최적화

```typescript
// React.memo — 불필요한 리렌더링 방지
// props가 안 바뀌면 리렌더링 안 함
export const PercentileBar = React.memo(({ label, value, percentile }) => {
    return (...)
})

// useMemo — 무거운 계산 캐시
const sortedLeaderboard = useMemo(() => {
    return [...data].sort((a, b) => b.war - a.war)
}, [data]) // data 바뀔 때만 재계산

// useCallback — 함수 재생성 방지
const handleYearChange = useCallback((year: number) => {
    setSelectedYear(year)
    fetchStats(playerId, year)
}, [playerId]) // playerId 바뀔 때만 재생성

// 리더보드 가상 스크롤 (선수 많을 때)
// 화면에 보이는 행만 렌더링
import { FixedSizeList } from 'react-window'
<FixedSizeList height={600} itemCount={142} itemSize={44}>
    {LeaderboardRow}
</FixedSizeList>
```

---

### 7. D3.js 차트 최적화

```typescript
// 스프레이 차트 / 탄착군 — 점 많을 때 느려짐
// 해결: Canvas 렌더링 (SVG보다 빠름)

// 데이터 500개 이하 → SVG 사용
// 데이터 500개 초과 → Canvas 사용
const useCanvas = data.length > 500

if (useCanvas) {
    // Canvas로 점 렌더링 (GPU 가속)
    const ctx = canvasRef.current.getContext('2d')
    data.forEach(d => {
        ctx.beginPath()
        ctx.arc(d.x, d.y, 3, 0, Math.PI * 2)
        ctx.fill()
    })
} else {
    // SVG 렌더링
}
```

---

### 8. 이미지/폰트 최적화

```
Google Fonts 로딩:
  <link rel="preconnect" href="https://fonts.googleapis.com">
  → 폰트 미리 연결 (로딩 빠름)

폰트 display: swap 설정:
  → 폰트 로딩 전 기본 폰트 먼저 표시
  → 레이아웃 shift 없음
```

---

### 9. 크롤러 성능 (백그라운드 처리)

```python
# 크롤링은 API 요청과 완전히 분리
# 크롤링 중에 API 느려지면 안 됨

# 해결: 비동기 크롤링 + DB 연결 풀 분리
# 크롤러용 DB 연결: max_overflow=5
# API용 DB 연결:    max_overflow=20

CRAWLER_DB_POOL = create_engine(
    DATABASE_URL,
    pool_size=2,
    max_overflow=5
)

API_DB_POOL = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=20
)
```

---

### 10. 페이지 데이터 우선순위

```
선수 상세 페이지 로딩 순서:
Priority 1 (즉시): 선수 기본 정보 → 헤더 표시
Priority 2 (빠름): 퍼센타일 바 → 핵심 콘텐츠
Priority 3 (보통): 커리어 테이블, 존별 히트맵
Priority 4 (느려도 됨): 투구 탄착군, Rolling 트렌드

구현:
  Priority 1~2: 페이지 진입 즉시 fetch
  Priority 3~4: Intersection Observer로 화면에 보일 때 fetch
                (스크롤해서 보이면 그때 로딩)
```

---

### 성능 목표 (Lighthouse 기준)

```
Performance:      90+
First Paint:      1초 이하
API 응답:         평균 200ms 이하
리더보드 로딩:    300ms 이하
선수 상세 첫 화면: 500ms 이하
탄착군 차트:      1초 이하
모바일 성능:      80+
```

---

### Goal별 성능 규칙 체크리스트

```
Goal 5 (API) 완료 조건에 추가:
□ 리더보드 API 응답 300ms 이하
□ 선수 퍼센타일 API 응답 200ms 이하
□ 투구 탄착군 API 응답 1초 이하
□ DB N+1 쿼리 없음 확인

Goal 6 (공통 컴포넌트) 완료 조건에 추가:
□ React.memo 적용 확인
□ 스켈레톤 UI 레이아웃 shift 없음

Goal 8 (리더보드) 완료 조건에 추가:
□ 가상 스크롤 적용 (100명 이상)
□ HTTP 캐시 헤더 적용

Goal 9~10 (선수 상세) 완료 조건에 추가:
□ 병렬 API 호출 확인
□ Intersection Observer 지연 로딩 확인
□ D3 차트 Canvas/SVG 분기 확인
□ Lighthouse Performance 80+ 확인
```

---

## 빌드 테스트 기준 (확정)

### 모든 Goal 빌드 테스트 공통 기준
```
백엔드 빌드 테스트:
□ uvicorn app.main:app 정상 기동 (에러 없음)
□ Python import 오류 없음
□ DB 연결 성공

프론트엔드 빌드 테스트:
□ npm run build 성공
□ TypeScript 에러 0개 (경고는 허용)
□ 번들 사이즈 체크
  - 전체 번들: 1MB 이하
  - 청크 단위: 300KB 이하
  - D3.js / Recharts는 lazy import 적용
```

### 번들 사이즈 관리
```typescript
// D3.js — 필요한 모듈만 import (전체 import 금지)
// 금지: import * as d3 from 'd3'
// 허용: import { select, scaleLinear } from 'd3'

// Recharts — 필요한 컴포넌트만 import
// 금지: import Recharts from 'recharts'
// 허용: import { LineChart, XAxis } from 'recharts'

// 라우트별 코드 스플리팅
const PlayerDetail = React.lazy(() => import('./pages/PlayerDetail'))
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'))
const Compare = React.lazy(() => import('./pages/Compare'))
```

### Goal별 빌드 테스트 체크리스트 (추가분)

**Goal 5 (API) 추가:**
```
□ [빌드] API 응답시간 측정
  - /api/leaderboard: 300ms 이하
  - /api/players/{id}/pitching: 200ms 이하
  - /api/players/{id}/pitches: 1000ms 이하
□ [빌드] DB N+1 쿼리 없음 (SQLAlchemy echo=True로 확인)
```

**Goal 6~11 (프론트) 추가:**
```
□ [빌드] TypeScript 에러 0개
□ [빌드] 번들 사이즈 1MB 이하
□ [빌드] D3/Recharts lazy import 적용 확인
□ [빌드] React.memo 적용 확인 (차트 컴포넌트)
```

**Goal 12 (전체 QA) 추가:**
```
□ [빌드] Lighthouse Performance 80+ (모바일)
□ [빌드] Lighthouse Performance 90+ (데스크탑)
□ [빌드] 번들 최종 사이즈 확인
□ [빌드] 프로덕션 빌드 환경변수 확인
```

### Claude Code 빌드 테스트 실행 명령
```bash
# 백엔드 빌드 테스트
cd backend
python -c "from app.main import app; print('빌드 성공')"
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
sleep 3
curl http://localhost:8000/health

# 프론트엔드 빌드 테스트
cd frontend
npm run build
# TypeScript 에러 체크
npx tsc --noEmit
# 번들 사이즈 체크
npx bundlesize

# API 응답시간 체크
curl -w "@curl-format.txt" -o /dev/null -s \
  http://localhost:8000/api/leaderboard?type=batting
```

---

## 빌드 테스트 기준 최종 확정 (엄격 버전)

### 변경 사항
```
이전: 빌드 성공 + TypeScript 에러 0개 + 번들 사이즈
변경: 빌드 성공 + TypeScript 경고 0개 + Lighthouse 점수 포함
```

### 최종 기준
```
백엔드:
□ uvicorn 정상 기동
□ Python import 오류/경고 0개
□ DB 연결 성공
□ API 응답시간 기준 충족
□ N+1 쿼리 없음

프론트엔드:
□ npm run build 성공
□ TypeScript 에러 0개
□ TypeScript 경고 0개 (any 타입 사용 금지)
□ 번들 전체 1MB 이하
□ 청크 300KB 이하
□ ESLint 경고 0개

최종 QA (Goal 12):
□ Lighthouse Performance 모바일  80+
□ Lighthouse Performance 데스크탑 90+
□ Lighthouse Accessibility        90+
□ Lighthouse Best Practices       90+
□ CLS (Cumulative Layout Shift)   0.1 이하
□ LCP (Largest Contentful Paint)  2.5초 이하
□ FCP (First Contentful Paint)    1.8초 이하
```

### TypeScript 엄격 모드 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictNullChecks": true
  }
}
```

### ESLint 설정
```json
// .eslintrc.json
{
  "rules": {
    "no-console": "warn",
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

---

## Goal별 컴포넌트 상세 명세

### Goal 6 — 공통 컴포넌트

#### PlayerSearchInput
```tsx
interface PlayerSearchInputProps {
  onSelect: (player: Player) => void
  placeholder?: string
}

동작:
  - 2글자 이상 입력 시 API 호출 (debounce 300ms)
  - GET /api/players/search?q={query}
  - 결과 최대 10개 드롭다운 표시
  - 키보드 방향키로 선택 이동
  - Enter / 클릭 → onSelect 콜백
  - ESC → 드롭다운 닫기
  - 바깥 클릭 → 드롭다운 닫기

드롭다운 아이템:
  [선수명] [팀] [포지션]
  예: 이정후  키움  CF
```

#### PercentileBar
```tsx
interface PercentileBarProps {
  label: string           // 지표명 (WAR, CSW% 등)
  value: number | string  // 실제 수치
  percentile: number      // 0~100
  tooltip?: string        // 한국어 설명 (호버 시 표시)
  invertColor?: boolean   // true면 낮을수록 좋음 (Chase%, BB% 등)
}

색상 로직:
  invertColor=false (기본): 높을수록 빨강
  invertColor=true:          낮을수록 빨강 (퍼센타일 반전 계산)

  90+ → #C0392B
  75+ → #E67E22
  40~74 → #95A5A6
  25~39 → #3498DB
  25- → #1E3A8A

레이아웃:
  grid-template-columns: clamp(70px,20%,100px) 1fr clamp(50px,15%,75px)
  → 모바일에서 가로 스크롤 없이 자동 축소
```

#### StatBadge
```tsx
interface StatBadgeProps {
  label: string
  value: number | string
  highlight?: boolean  // true면 빨강 강조
}
선수 헤더 pill 컴포넌트
```

#### SkeletonBlock
```tsx
interface SkeletonBlockProps {
  width?: string   // 기본 100%
  height: string   // 필수
  rounded?: string // border-radius
}
pulse 애니메이션 적용
실제 컴포넌트와 동일한 크기로 구현 (CLS 방지)
```

#### ErrorMessage
```tsx
interface ErrorMessageProps {
  type: 'not_found' | 'server_error' | 'network_error' | 'empty'
  onRetry?: () => void
}
type별 메시지:
  not_found:    "선수를 찾을 수 없습니다"
  server_error: "데이터를 불러오는 중 오류가 발생했습니다"
  network_error: "인터넷 연결을 확인해주세요"
  empty:        "데이터가 없습니다" (표본 부족)
```

---

### Goal 7 — 홈 페이지

#### ScoreboardCard
```tsx
interface ScoreboardCardProps {
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  status: 'scheduled' | 'live' | 'final'
  startTime?: string
  inning?: string
}
```

#### HighlightCard
```tsx
interface HighlightCardProps {
  label: string      // "최고 Hard-Hit%"
  value: string      // "42.3%"
  playerName: string // "이정후"
  playerId: number
}
클릭 시 → /players/:id 이동
```

---

### Goal 8 — 리더보드

#### LeaderboardTable
```tsx
interface LeaderboardTableProps {
  data: LeaderboardRow[]
  type: 'batting' | 'pitching'
  sortStat: string
  sortDir: 'asc' | 'desc'
  onSort: (stat: string) => void
  onPlayerClick: (id: number) => void
  isLoading: boolean
}

모바일 컬럼:
  타자: 선수명 / WAR / wRC+ / HH%
  투수: 선수명 / WAR / FIP / CSW%

PC 컬럼:
  타자: # / 선수 / WAR / wRC+ / OPS / HH% / Barrel% / EV / xBA
  투수: # / 선수 / WAR / FIP / ERA- / CSW% / Whiff% / 허용HH% / xERA

가상 스크롤:
  100명 이상 시 react-window FixedSizeList 적용
  itemSize: 44px
```

---

### Goal 9 — 선수 상세 (투수)

#### PitchZoneMap (투구 탄착군)
```tsx
interface PitchZoneMapProps {
  data: PitchDot[]          // {x, z, pitch_type, result}
  width?: number
  height?: number
  colorBy?: 'pitch_type' | 'result'
}

구현:
  데이터 500개 이하 → SVG
  데이터 500개 초과 → Canvas (GPU 가속)
  스트라이크존 테두리 표시
  구종별 색상:
    포심      → #1E3A8A
    슬라이더  → #0F6E56
    체인지업  → #BA7517
    커브      → #7C3AED
    기타      → #9CA3AF
```

#### ZoneHeatmap (존별 피안타율/타율)
```tsx
interface ZoneHeatmapProps {
  data: ZoneData[]  // {zone: 1~9 | 11~14, batting_avg, count}
  type: 'pitcher' | 'batter'
  colorMetric: 'batting_avg' | 'whiff_pct' | 'hard_hit_pct'
}

존 구성:
  1~9:   스트라이크존 9구역
  11~14: 존 바깥 4구역 (상/하/좌/우)

색상:
  높음 → #C0392B (투수: 피안타율 높음 = 나쁨)
  낮음 → #1E3A8A (투수: 피안타율 낮음 = 좋음)

SVG width: 100% → 모바일 자동 축소
```

#### PitchCountBreakdown (볼카운트별 구종)
```tsx
interface PitchCountBreakdownProps {
  data: {
    count: string        // "0-0" | "2K" | "3B" | "득점권"
    pitches: number      // 해당 카운트 총 투구 수
    breakdown: {
      pitch_type: string
      pct: number
    }[]
  }[]
}
가로 누적 바 차트
```

#### VeloTrend (구속 트렌드)
```tsx
interface VeloTrendProps {
  data: { game_date: string; avg_velocity: number }[]
  pitchType?: string  // 없으면 포심 기본
}
Recharts LineChart 사용
```

#### CareerSplitsTable (연도별 지표 비교)
```tsx
interface CareerSplitsTableProps {
  data: CareerRow[]    // 연도별 데이터
  type: 'pitcher' | 'batter'
  leagueAvg: LeagueAvgRow[]  // 연도별 리그 평균
  selectedYear: number
  onYearSelect: (year: number) => void
}

기능:
  - 연도 클릭 → onYearSelect 콜백 → 퍼센타일 바 업데이트
  - 커리어 최고값 → 빨강 (#C0392B)
  - 커리어 최저값 → 파랑 (#2980B9)
  - 선택된 연도 컬럼 → #EFF6FF 배경
  - 전년 대비 화살표 + 변화량
  - 리그 평균 행 → 회색 (#9CA3AF)
  - 가로 스크롤 (overflow-x: auto)
  - React.memo 적용 필수
```

---

### Goal 10 — 선수 상세 (타자)

#### SprayChart (스프레이 차트)
```tsx
interface SprayChartProps {
  data: SprayDot[]   // {spray_x, spray_y, result, exit_velocity}
  colorBy: 'result' | 'exit_velocity'
  width?: number
  height?: number
}

구현:
  데이터 500개 이하 → SVG
  데이터 500개 초과 → Canvas

색상 (result 기준):
  안타/홈런 → #C0392B
  장타 →      #E67E22
  아웃 →      #95A5A6

야구장 배경:
  D3.js로 구장 외곽선 + 내야 다이아몬드 + 방향선 (좌/중/우)
```

#### BattedBallQuality (타구질 지표)
```tsx
interface BattedBallQualityProps {
  avgEV: number
  hardHitPct: number
  barrelPct: number
  sweetSpotPct: number
  chasePct: number
  whiffPct: number
  percentiles: { [key: string]: number }
}
가로 바 + 수치 표시
```

---

### Goal 11 — 선수 비교

#### CompareHeader
```tsx
interface CompareHeaderProps {
  playerA: Player | null
  playerB: Player | null
  onSelectA: (player: Player) => void
  onSelectB: (player: Player) => void
  season: number
  onSeasonChange: (year: number) => void
  onReset: () => void
}
```

#### ComparePercentileBar
```tsx
interface ComparePercentileBarProps {
  label: string
  playerA: { value: number | string; percentile: number; name: string }
  playerB: { value: number | string; percentile: number; name: string }
  tooltip?: string
  invertColor?: boolean
}

색상 규칙:
  바 색상 = 각 선수의 퍼센타일 기준
  (선수 A/B 구분은 이름 레이블 텍스트로만)
  선수 A 레이블 → #C0392B (빨강)
  선수 B 레이블 → #1E3A8A (파랑)
```

#### CompareStatsTable
```tsx
interface CompareStatsTableProps {
  playerA: Player
  playerB: Player
  stats: { label: string; valueA: number; valueB: number; higherIsBetter: boolean }[]
}

더 좋은 쪽 → 굵게 표시
higherIsBetter=false 지표 (Chase%, Whiff%, ERA 등) → 낮은 쪽이 굵게
```

---

### 공통 규칙

```
모든 차트 컴포넌트:
  □ React.memo 적용 필수
  □ 빈 데이터 → 빈 상태 UI (에러 아님)
  □ 로딩 중 → SkeletonBlock (동일 크기)
  □ SVG width: 100% → 모바일 자동 축소
  □ 툴팁 hover 시 portal로 렌더링 (레이아웃 shift 방지)

모든 테이블 컴포넌트:
  □ 모바일에서 가로 스크롤 금지 (커리어 테이블 제외)
  □ 100행 이상 → react-window 가상 스크롤
  □ 정렬 상태 URL 쿼리 파라미터로 유지
    (/leaderboard?sort=war&dir=desc)

모든 API 호출:
  □ Promise.all로 병렬 처리
  □ Intersection Observer로 지연 로딩
    (화면에 보일 때 fetch)
  □ 에러 → ErrorMessage 컴포넌트
  □ 로딩 → SkeletonBlock 컴포넌트
```
