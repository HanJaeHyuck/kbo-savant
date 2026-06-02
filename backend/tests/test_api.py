import pytest


# ── 헬퍼 ──────────────────────────────────────────
async def _get_player_id(client, name_prefix: str) -> int | None:
    resp = await client.get(f"/api/players/search?q={name_prefix}")
    data = resp.json()
    return data[0]["id"] if data else None


# ── 기본 엔드포인트 ────────────────────────────────

@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_search_empty_result(client):
    resp = await client.get("/api/players/search?q=가")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_player_not_found(client):
    resp = await client.get("/api/players/99999")
    assert resp.status_code == 404
    assert resp.json()["detail"]["error_code"] == "PLAYER_NOT_FOUND"


@pytest.mark.asyncio
async def test_leaderboard_batting(client):
    resp = await client.get("/api/leaderboard?type=batting&stat=war&season=2024")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "data" in data


@pytest.mark.asyncio
async def test_leaderboard_pitching(client):
    resp = await client.get("/api/leaderboard?type=pitching&stat=fip&season=2024")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_leaderboard_invalid_type(client):
    resp = await client.get("/api/leaderboard?type=invalid")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_invalid_season(client):
    resp = await client.get("/api/players/1/batting?season=1900")
    assert resp.status_code == 422


# ── 선수 검색 ──────────────────────────────────────

@pytest.mark.asyncio
async def test_search_returns_player(client):
    resp = await client.get("/api/players/search?q=%EC%9D%B4%EC%A0%95")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert any(p["name"] == "이정후" for p in data)


# ── 선수 상세 ──────────────────────────────────────

@pytest.mark.asyncio
async def test_player_detail(client):
    pid = await _get_player_id(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip("이정후 데이터 없음")
    resp = await client.get(f"/api/players/{pid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "이정후"
    assert "team" in data
    assert "position" in data


# ── 타자 스탯 엔드포인트 ───────────────────────────

@pytest.mark.asyncio
async def test_batting_stats_response_format(client):
    pid = await _get_player_id(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip("이정후 데이터 없음")
    resp = await client.get(f"/api/players/{pid}/batting?season=2024")
    assert resp.status_code == 200
    data = resp.json()
    assert data["player_id"] == pid
    assert data["season"] == 2024
    assert "classic" in data
    assert "sabermetrics" in data
    assert "tracking" in data
    assert "percentiles" in data


@pytest.mark.asyncio
async def test_batting_stats_tracking_fields(client):
    pid = await _get_player_id(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip("이정후 데이터 없음")
    resp = await client.get(f"/api/players/{pid}/batting?season=2024")
    tracking = resp.json()["tracking"]
    assert "hard_hit_pct" in tracking
    assert "barrel_pct" in tracking
    assert "avg_ev" in tracking
    assert "chase_pct" in tracking
    assert "whiff_pct" in tracking


# ── 투수 스탯 엔드포인트 ───────────────────────────

@pytest.mark.asyncio
async def test_pitching_stats_response_format(client):
    pid = await _get_player_id(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip("김광현 데이터 없음")
    resp = await client.get(f"/api/players/{pid}/pitching?season=2024")
    assert resp.status_code == 200
    data = resp.json()
    assert data["player_id"] == pid
    assert "classic" in data
    assert "sabermetrics" in data
    assert "tracking" in data


@pytest.mark.asyncio
async def test_pitching_stats_tracking_fields(client):
    pid = await _get_player_id(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip("김광현 데이터 없음")
    resp = await client.get(f"/api/players/{pid}/pitching?season=2024")
    tracking = resp.json()["tracking"]
    assert "csw_pct" in tracking
    assert "whiff_pct" in tracking
    assert "avg_ev_allowed" in tracking


# ── 투구/타구 데이터 엔드포인트 ────────────────────

@pytest.mark.asyncio
async def test_pitches_response_format(client):
    pid = await _get_player_id(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip("김광현 데이터 없음")
    resp = await client.get(f"/api/players/{pid}/pitches?season=2024")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_pitches" in data
    assert "pitch_mix" in data
    assert "zone_data" in data


@pytest.mark.asyncio
async def test_batted_balls_response_format(client):
    pid = await _get_player_id(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip("이정후 데이터 없음")
    resp = await client.get(f"/api/players/{pid}/batted-balls?season=2024")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "spray_data" in data


# ── 비교 엔드포인트 ────────────────────────────────

@pytest.mark.asyncio
async def test_compare_two_players(client):
    pid1 = await _get_player_id(client, "%EC%9D%B4%EC%A0%95")
    pid2 = await _get_player_id(client, "%EA%B9%80%EB%8F%84")
    if not pid1 or not pid2:
        pytest.skip("선수 데이터 없음")
    resp = await client.get(f"/api/compare?ids={pid1},{pid2}&season=2024")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["player_id"] == pid1
    assert data[1]["player_id"] == pid2


@pytest.mark.asyncio
async def test_compare_invalid_ids(client):
    resp = await client.get("/api/compare?ids=abc,def")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_compare_player_not_found(client):
    resp = await client.get("/api/compare?ids=99998,99999")
    assert resp.status_code == 404


# ── 리더보드 정렬 검증 ─────────────────────────────

@pytest.mark.asyncio
async def test_leaderboard_batting_sorted_by_war(client):
    resp = await client.get("/api/leaderboard?type=batting&stat=war&season=2024")
    data = resp.json()["data"]
    if len(data) >= 2:
        assert data[0]["war"] >= data[1]["war"]


@pytest.mark.asyncio
async def test_leaderboard_pitching_sorted_by_fip(client):
    resp = await client.get("/api/leaderboard?type=pitching&stat=fip&season=2024")
    data = resp.json()["data"]
    if len(data) >= 2:
        # FIP는 낮을수록 좋으므로 오름차순
        assert data[0]["fip"] <= data[1]["fip"]


@pytest.mark.asyncio
async def test_leaderboard_team_filter(client):
    resp = await client.get(
        "/api/leaderboard?type=batting&stat=war&season=2024&team=KIA%20%ED%83%80%EC%9D%B4%EA%B1%B0%EC%A6%88"
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    for row in data:
        assert row["team"] == "KIA 타이거즈"
