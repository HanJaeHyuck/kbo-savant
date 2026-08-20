# ⚾ KBO Savant

MLB **Baseball Savant** 수준의 KBO 데이터 분석 플랫폼.
스탯티즈에 없는 **트래킹 기반 지표**(타구속도·발사각·Hard-Hit%·Barrel%·CSW% 등)와
**KBO 자체 기대스탯(xBA/xSLG/xwOBA/xERA)·Run Value**를 시각화합니다.

> ⚠️ **현재 모든 데이터는 `seed_data.py`가 생성한 데모(샘플) 값입니다.**
> KBO는 투구·타구 트래킹 데이터를 공개하지 않으며, KBO·스탯티즈 모두 이용약관과
> robots.txt로 자동 수집을 금지합니다. 자세한 내용은 아래 [데이터 정책](#️-데이터-정책-중요) 참고.

---

## 주요 기능

### 선수 상세 — 투수 (Baseball Savant 스타일)
- **퍼센타일 랭킹**: 가치(Value) / 투구(Pitching) 2섹션, POOR·AVERAGE·GREAT 스케일
  - Pitching/Fastball/Breaking/Offspeed **Run Value**, WAR, ERA-, FIP
  - xERA, **허용 xBA**, **Fastball Velo**, 허용 EV, CSW%, Whiff%, K%, Chase%, BB%, 허용 Barrel%, 허용 HH%, **GB%**
- **Movement Profile**: 구종별 수평×수직 무브먼트 원형 차트 + Arm Angle
- **투구 탄착군**: 구종별 KDE 밀도 히트맵(가우시안 스무딩) · **전체/vs 우타/vs 좌타 토글**
- **스트라이크존 히트맵**: 7×8 고해상 그리드(피안타율/Whiff%)
- **Attack Zones (Swing/Take)**: Heart/Shadow/Chase/Waste 4영역별 투구%·스윙%·Whiff%
- **Rolling 트렌드**: 경기별 이동평균(구속/Whiff%/CSW%) 토글 라인차트
- **vs 좌/우타 성적 스플릿**: 피안타율·wOBA·Whiff%·Chase%·CSW%·허용 HH%·허용 EV 좌우 비교
- **구종별 Pitch Tracking 테이블**: 연도×구종 — #/우타/좌타/구속/Spin/PA~BBE/BA/xBA/SLG/xSLG/wOBA/xwOBA/EV/LA/Whiff%/PutAway%
- **좌측 히어로**: 사진·바이오·커리어표(W/L/ERA/G/GS/SV/IP/SO/WHIP) + Pitch Usage(vs 좌/우타) + 트래킹 지표 + Player Apps
- **누락 랭킹 보강**: 허용 xBA · Fastball Velo · GB% (Extension은 실측값 없어 제외)

### 선수 상세 — 타자
- 퍼센타일 랭킹(생산/타구질/선구안), 스프레이 차트, 존별 히트맵, 레이더 차트, xBA/xSLG/xwOBA

### 경기 일정·결과 (크롤러 비활성)
- `Game` 모델 / `/api/games` / 홈 스코어보드 UI / 파서까지 구현 완료
- **단, 자동 수집은 기본 차단 상태입니다.** 아래 데이터 정책 참고

---

## ⚠️ 데이터 정책 (중요)

이 프로젝트가 목표한 지표는 **현재 합법적으로 확보할 수 있는 무료 데이터 경로가 없습니다.**
조사 결과를 그대로 남깁니다.

| 데이터 | 출처 | 확보 가능 여부 |
|---|---|---|
| 트래킹(타구속도·발사각·구속·스핀) | 어디에도 없음 | ❌ KBO 미공개 — 원천 부재 |
| 세이버(WAR·wRC+·FIP 등) | 스탯티즈 | ❌ robots.txt + 이용약관 제20조 금지 |
| 경기 결과·기본 기록 | KBO 공식 | ❌ robots.txt + 이용약관 제16조 차항 금지 |

- **KBO robots.txt**: `본 사이트의 데이터를 사전 승인 없이 자동 수집·크롤링·복제하는 행위를 금지합니다.` / `User-agent: *` → `Disallow: /`
- **KBO 이용약관 제16조 차항**: 사전 서면 동의 또는 공식 API 없이 크롤러·스크래퍼·봇으로 경기 결과·선수통계를 대량 반복 수집 금지, 수집 데이터의 **타 플랫폼 연동·2차가공도 금지**
- **스탯티즈 robots.txt**: Google/Naver/Bing만 허용, 그 외 전부 `Disallow: /` (ClaudeBot·GPTBot 등 명시 차단)
- **스탯티즈 이용약관 제20조**: 위와 동일한 취지의 금지 조항

### 그래서 현재 동작 방식
- **모든 화면은 `seed_data.py`의 데모 데이터로 구동됩니다.**
- 크롤러 3종(KBO 일정 / KBO 게임 / 스탯티즈)은 코드만 남기고 **네트워크 접근을 하드 차단**했습니다.
  각 크롤러의 `_assert_permitted()`가 `PermissionError`를 던지며, 스케줄러도 기본 비활성입니다.
- 파서 함수(`parse_games` 등)는 네트워크 접근이 없어 오프라인 테스트에 사용됩니다.
- 정식 승인(사전 서면 동의 또는 공식 API)을 확보한 경우에만 아래 환경변수로 활성화하세요.
  ```env
  ENABLE_KBO_CRAWL=true      # KBO 승인 확보 시
  ENABLE_STATIZ_CRAWL=true   # 스탯티즈 승인 확보 시 (war@statiz.co.kr)
  ```

### 화면상 데이터 신뢰도 표기
- 트래킹 파생 지표에는 `DEMO` 배지가 붙습니다 (KBO 미공개 → 실데이터 대체 불가)
- 실제 수집 데이터가 들어오면 `실데이터` 배지가 붙습니다 (현재는 크롤러 비활성이라 표시되지 않음)

---

### 공통
- **유사 선수(Player Similarity)**: 같은 포지션군 스탯 프로필 유사도 Top 5
- 리더보드(정렬·팀 필터·페이지네이션), 선수 비교(퍼센타일 이중 바), 홈 하이라이트
- 라이트/다크 모드, 반응형(데스크탑 3열 → 모바일 1열 + 하단 탭바)

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프론트엔드 | React 18 · TypeScript · Vite · Tailwind CSS · Recharts · D3(SVG) |
| 백엔드 | FastAPI(Python 3.11) · SQLAlchemy 2.0 · PostgreSQL 15 |
| 기대스탯 모델 | scikit-learn (LogisticRegression xBA / LinearRegression xSLG·xwOBA) |
| 크롤링 | Playwright · BeautifulSoup4 · APScheduler |
| 테스트 | pytest · Vitest · Playwright(E2E) |
| 배포 | Vercel(프론트) · Railway(백엔드+DB+Cron) |

---

## 로컬 실행

### 백엔드
```bash
cd backend
pip install -r requirements.txt
# .env 작성 (DATABASE_URL 등 — .env.example 참고)
python seed_data.py            # 더미 데이터 주입 (재실행 시 player id 변경됨)
uvicorn app.main:app --port 8000 --reload
# http://localhost:8000/health → {"status":"ok","db":"connected"}
```
> 서버 기동 시 최근 3시즌 ML 모델/퍼센타일을 백그라운드로 워밍업하여 첫 페이지 로딩을 1초 미만으로 유지합니다.

### 프론트엔드
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173 (dev는 Vite 프록시로 8000 연결)
npm run build                  # 프로덕션 빌드
```

---

## 주요 API 엔드포인트

```
GET /api/players/search?q=                선수 검색(2글자+)
GET /api/players/{id}                      기본 정보
GET /api/players/{id}/batting?season=      타자 스탯 + 퍼센타일 + 기대스탯
GET /api/players/{id}/pitching?season=     투수 스탯 + 퍼센타일 + Run Value
GET /api/players/{id}/pitches?season=      투구/탄착군(bat_hand)/존 그리드/무브먼트/구속트렌드/Rolling/vs_hand/사용률
GET /api/players/{id}/batted-balls?season= 타구(스프레이/존별)
GET /api/players/{id}/arsenal              구종별 Pitch Tracking 테이블(전 시즌)
GET /api/players/{id}/similar?season=      유사 선수 Top 5
GET /api/players/{id}/career/{batting|pitching}
GET /api/leaderboard?type=&stat=&season=&team=&page=
GET /api/compare?ids=1,2&season=
GET /api/games?game_date=YYYY-MM-DD    경기 일정/결과 (실데이터)
GET /api/games/dates                   저장된 경기 날짜 목록
GET /health
```

---

## 테스트

```bash
cd backend  && python -m pytest -q        # 111 passed
cd frontend && npx vitest run             # 단위 테스트
cd frontend && npx playwright test        # E2E
```

---

## 배포

[DEPLOY.md](DEPLOY.md) 참고 — Vercel(프론트) + Railway(백엔드/DB/Cron) 단계별 가이드.
