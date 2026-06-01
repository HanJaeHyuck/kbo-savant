import pytest
import json
from pathlib import Path
from httpx import AsyncClient, ASGITransport

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def mock_pitches():
    with open(FIXTURES_DIR / "mock_pitch_data.json", encoding="utf-8") as f:
        return json.load(f)["pitches"]


@pytest.fixture
def mock_batted_balls():
    with open(FIXTURES_DIR / "mock_batted_ball_data.json", encoding="utf-8") as f:
        return json.load(f)["batted_balls"]


@pytest.fixture
def mock_player():
    with open(FIXTURES_DIR / "mock_player_stats.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
async def client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
