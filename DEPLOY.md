# KBO Savant 배포 가이드 (Goal 13)

프론트엔드는 **Vercel**, 백엔드 + DB + 크롤러 Cron은 **Railway**에 배포합니다.
아래 단계는 회원님 계정으로 직접 진행해야 합니다(계정/결제 연결 필요).

---

## 1. 사전 준비

```bash
# 코드 푸시 (아직 원격에 없다면)
git push -u origin goal/13-deploy
# 또는 main 머지 후 main 배포 권장
```

- GitHub 저장소에 코드가 올라가 있어야 Vercel/Railway가 연동됩니다.

---

## 2. Railway — 백엔드 + PostgreSQL

### 2-1. PostgreSQL 추가
1. [railway.app](https://railway.app) → New Project → **Provision PostgreSQL**
2. 생성되면 `DATABASE_URL`이 자동 발급됨 (백엔드 서비스에서 참조)

### 2-2. 백엔드 서비스 배포
1. 같은 프로젝트 → **New → GitHub Repo** → 이 저장소 선택
2. **Root Directory**: `backend`
3. Railway가 `backend/Dockerfile` + `backend/railway.json`을 자동 감지
   - 헬스체크 경로: `/health` (railway.json에 설정됨)
   - 포트: Railway가 `$PORT` 주입 → Dockerfile이 자동 바인딩
4. **Variables** 탭에 `backend/.env.example` 값 입력:
   - `DATABASE_URL` → PostgreSQL 서비스의 값 참조 (`${{Postgres.DATABASE_URL}}`)
   - `SECRET_KEY`, `ALLOWED_ORIGINS`(= Vercel 도메인), `ENVIRONMENT=production` 등
5. 배포 완료 후 공개 도메인 발급 (예: `https://kbo-savant-api.up.railway.app`)

### 2-3. 시드 데이터 주입 (최초 1회)
```bash
# Railway 서비스 Shell 또는 로컬에서 프로덕션 DATABASE_URL로
python seed_data.py
```

### 2-4. 크롤러 Cron Job
1. **New → Empty Service** (또는 같은 repo, Root `backend`)
2. **Settings → Cron Schedule**: `0 1 * * *` (매일 01:00)
3. **Start Command**: `python crawlers/scheduler.py --once`
   - `--once` 모드는 크롤링 1회 실행 후 종료 (cron에 적합)

### 검증
```bash
curl https://<railway-backend-url>/health
# → {"status":"ok","db":"connected"}
curl https://<railway-backend-url>/api/players/search?q=이정
```

---

## 3. Vercel — 프론트엔드

1. [vercel.com](https://vercel.com) → **Add New → Project** → 이 저장소 선택
2. **Root Directory**: `frontend`
3. Framework: **Vite** (자동 감지, `frontend/vercel.json`에 명시됨)
   - Build: `npm run build` / Output: `dist`
   - SPA rewrites는 vercel.json에 설정됨 (React Router 새로고침 404 방지)
4. **Environment Variables**:
   - `VITE_API_URL` = `https://<railway-backend-url>` (2-2에서 발급된 도메인)
5. Deploy → 공개 URL 발급 (예: `https://kbo-savant.vercel.app`)

> ⚠️ `VITE_API_URL`을 설정한 뒤에는 **재배포(Redeploy)** 해야 빌드에 반영됩니다.

---

## 4. CORS 연결 확인

- Railway 백엔드의 `ALLOWED_ORIGINS`에 **Vercel 도메인**이 포함돼야 합니다.
- 도메인이 확정된 뒤 Railway Variables에서 값을 갱신 → 백엔드 재배포.

---

## 5. 최종 검증 (Goal 13 체크리스트)

- [ ] Vercel 프론트 URL 접근 가능
- [ ] `GET /health` → `{"status":"ok","db":"connected"}`
- [ ] `GET /api/players/search?q=이정` → 200, 결과 포함
- [ ] 배포 프론트에서 검색 → 선수 상세 → 퍼센타일 바 렌더링 (프론트↔백엔드 연동)
- [ ] `GET /api/players/{id}/arsenal` → 200, 구종별 Pitch Tracking rows
- [ ] `GET /api/players/{id}/similar?season=2024` → 200, 유사 선수 Top 5
- [ ] 투수 상세 — 탄착군/존 히트맵/Movement Profile/Pitch Tracking 표 렌더링
- [ ] 모바일 뷰 정상
- [ ] Railway Cron Job 등록 확인 (`0 1 * * *`, `--once`)

---

## 배포 산출물 요약

| 파일 | 용도 |
|------|------|
| `backend/Dockerfile` | `$PORT` 바인딩, Railway 빌드 |
| `backend/railway.json` | 빌더/헬스체크/재시작 정책 |
| `backend/.dockerignore` | 이미지에서 테스트/캐시 제외 |
| `backend/.env.example` | 백엔드 환경변수 템플릿 |
| `backend/crawlers/scheduler.py` | `--once` Cron 모드 지원 |
| `frontend/vercel.json` | Vite 빌드 + SPA rewrites |
| `frontend/.env.example` | `VITE_API_URL` 템플릿 |
| `frontend/src/api/client.ts` | PROD에서 `VITE_API_URL`로 API 호출 |
