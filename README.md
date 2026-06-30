# ⚾ KBO Savant

MLB **Baseball Savant** 수준의 KBO 데이터 분석 플랫폼.
스탯티즈에 없는 **트래킹 기반 지표**(타구속도·발사각·Hard-Hit%·Barrel%·CSW% 등)와
**KBO 자체 기대스탯(xBA/xSLG/xwOBA/xERA)·Run Value**를 시각화합니다.

> 데이터 출처: KBO 게임센터(투구/타구 트래킹) + 스탯티즈(WAR/wRC+/FIP 등).
> 로컬 개발은 `seed_data.py`의 더미 데이터(선수 40명·3시즌)를 사용합니다.

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
