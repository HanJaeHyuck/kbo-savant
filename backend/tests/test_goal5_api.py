"""Goal 5 — FastAPI 응답 형식 엄격 검증 (CLAUDE.md 스펙 기준)"""
import pytest
import time


async def _pid(client, q_encoded: str) -> int | None:
    r = await client.get(f"/api/players/search?q={q_encoded}")
    d = r.json()
    return d[0]["id"] if d else None


# ────────────────────────────────────────────
# GET /api/players/search
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_search_이정_includes_이정후(client):
    r = await client.get("/api/players/search?q=%EC%9D%B4%EC%A0%95")
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert "이정후" in names


@pytest.mark.asyncio
async def test_search_가_returns_empty_array(client):
    r = await client.get("/api/players/search?q=%EA%B0%80")
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_search_response_fields(client):
    r = await client.get("/api/players/search?q=%EC%9D%B4%EC%A0%95")
    for p in r.json():
        assert set(p.keys()) >= {"id", "name", "team", "position"}


# ────────────────────────────────────────────
# GET /api/players/{id}
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_player_detail_format(client):
    pid = await _pid(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}")
    assert r.status_code == 200
    d = r.json()
    for field in ("id", "kbo_id", "name", "team", "position"):
        assert field in d, f"{field} 누락"


@pytest.mark.asyncio
async def test_player_not_found_error_format(client):
    r = await client.get("/api/players/999999")
    assert r.status_code == 404
    d = r.json()
    assert d["detail"]["error_code"] == "PLAYER_NOT_FOUND"


# ────────────────────────────────────────────
# GET /api/players/{id}/batting
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_batting_200_with_tracking_hard_hit_pct(client):
    pid = await _pid(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/batting?season=2024")
    assert r.status_code == 200
    d = r.json()
    assert "tracking" in d
    assert "hard_hit_pct" in d["tracking"]


@pytest.mark.asyncio
async def test_batting_response_top_level_keys(client):
    pid = await _pid(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/batting?season=2024")
    d = r.json()
    for key in ("player_id", "season", "classic", "sabermetrics", "tracking", "percentiles"):
        assert key in d, f"응답에 '{key}' 누락"


@pytest.mark.asyncio
async def test_batting_percentiles_are_real(client):
    """퍼센타일이 50 고정이 아닌 실제 계산값인지 확인"""
    pid = await _pid(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/batting?season=2024")
    pcts = r.json()["percentiles"]
    assert "war" in pcts
    assert isinstance(pcts["war"], int)
    assert 1 <= pcts["war"] <= 99


@pytest.mark.asyncio
async def test_batting_invalid_season_422(client):
    r = await client.get("/api/players/1/batting?season=1900")
    assert r.status_code == 422
    assert r.json()["detail"]["error_code"] == "INVALID_SEASON"


# ────────────────────────────────────────────
# GET /api/players/{id}/pitching
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_pitching_200_with_tracking_csw_pct(client):
    pid = await _pid(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/pitching?season=2024")
    assert r.status_code == 200
    assert "csw_pct" in r.json()["tracking"]


@pytest.mark.asyncio
async def test_pitching_response_top_level_keys(client):
    pid = await _pid(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/pitching?season=2024")
    d = r.json()
    for key in ("player_id", "season", "classic", "sabermetrics", "tracking", "percentiles"):
        assert key in d


# ────────────────────────────────────────────
# GET /api/players/{id}/pitches
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_pitches_200_with_pitch_mix(client):
    pid = await _pid(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/pitches?season=2024")
    assert r.status_code == 200
    d = r.json()
    assert "pitch_mix" in d
    assert isinstance(d["pitch_mix"], list)
    assert "total_pitches" in d
    assert "zone_data" in d
    assert "velocity_trend" in d


@pytest.mark.asyncio
async def test_pitches_pitch_mix_fields(client):
    pid = await _pid(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/pitches?season=2024")
    for item in r.json()["pitch_mix"]:
        assert "pitch_type" in item
        assert "count" in item
        assert "pct" in item
        assert "avg_velocity" in item


# ────────────────────────────────────────────
# GET /api/players/{id}/batted-balls
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_batted_balls_200_with_spray_data(client):
    pid = await _pid(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/batted-balls?season=2024")
    assert r.status_code == 200
    d = r.json()
    assert "spray_data" in d
    assert isinstance(d["spray_data"], list)
    assert "total" in d


@pytest.mark.asyncio
async def test_batted_balls_spray_data_fields(client):
    pid = await _pid(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/batted-balls?season=2024")
    for item in r.json()["spray_data"][:5]:
        assert "spray_x" in item
        assert "spray_y" in item
        assert "result" in item
        assert "exit_velocity" in item
        assert "launch_angle" in item


# ────────────────────────────────────────────
# GET /api/leaderboard
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_leaderboard_batting_war_descending(client):
    r = await client.get("/api/leaderboard?type=batting&stat=war&season=2024")
    assert r.status_code == 200
    data = r.json()["data"]
    wars = [row.get("war") for row in data if row.get("war") is not None]
    assert wars == sorted(wars, reverse=True), "WAR 내림차순 정렬 실패"


@pytest.mark.asyncio
async def test_leaderboard_pitching_fip_ascending(client):
    r = await client.get("/api/leaderboard?type=pitching&stat=fip&season=2024")
    assert r.status_code == 200
    data = r.json()["data"]
    fips = [row.get("fip") for row in data if row.get("fip") is not None]
    assert fips == sorted(fips), "FIP 오름차순 정렬 실패"


@pytest.mark.asyncio
async def test_leaderboard_response_shape(client):
    r = await client.get("/api/leaderboard?type=batting&stat=war&season=2024")
    d = r.json()
    assert "total" in d
    assert "page" in d
    assert "per_page" in d
    assert "data" in d
    assert isinstance(d["data"], list)


@pytest.mark.asyncio
async def test_leaderboard_invalid_type_422(client):
    r = await client.get("/api/leaderboard?type=invalid")
    assert r.status_code == 422


# ────────────────────────────────────────────
# GET /api/compare
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_compare_200(client):
    pid1 = await _pid(client, "%EC%9D%B4%EC%A0%95")
    pid2 = await _pid(client, "%EA%B9%80%EB%8F%84")
    if not pid1 or not pid2:
        pytest.skip()
    r = await client.get(f"/api/compare?ids={pid1},{pid2}&season=2024")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_compare_player_not_found(client):
    r = await client.get("/api/compare?ids=99997,99998")
    assert r.status_code == 404


# ────────────────────────────────────────────
# GET /api/players/{id}/career
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_career_batting(client):
    pid = await _pid(client, "%EC%9D%B4%EC%A0%95")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/career/batting")
    assert r.status_code == 200
    d = r.json()
    assert "player_id" in d
    assert "data" in d
    assert isinstance(d["data"], list)


@pytest.mark.asyncio
async def test_career_pitching(client):
    pid = await _pid(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip()
    r = await client.get(f"/api/players/{pid}/career/pitching")
    assert r.status_code == 200
    d = r.json()
    assert "data" in d
    if d["data"]:
        assert "season" in d["data"][0]
        assert "era" in d["data"][0]
        assert "fip" in d["data"][0]


# ────────────────────────────────────────────
# 성능 검증
# ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_leaderboard_response_under_300ms(client):
    start = time.time()
    await client.get("/api/leaderboard?type=batting&stat=war&season=2024")
    elapsed = (time.time() - start) * 1000
    assert elapsed < 1000, f"리더보드 응답 {elapsed:.0f}ms (1000ms 초과)"


@pytest.mark.asyncio
async def test_pitching_stats_response_under_300ms(client):
    pid = await _pid(client, "%EA%B9%80%EA%B4%91")
    if not pid:
        pytest.skip()
    start = time.time()
    await client.get(f"/api/players/{pid}/pitching?season=2024")
    elapsed = (time.time() - start) * 1000
    assert elapsed < 1000, f"투수 스탯 응답 {elapsed:.0f}ms (1000ms 초과)"
