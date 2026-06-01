import pytest


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
