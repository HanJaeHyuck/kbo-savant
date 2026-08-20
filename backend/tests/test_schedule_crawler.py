"""KBO 경기 일정/결과 파서 테스트 — 실제 게임센터 HTML 구조 기준."""
from datetime import date
from pathlib import Path
import pytest

from crawlers.kbo_schedule_crawler import parse_games

FIXTURE = Path(__file__).parent / "fixtures" / "kbo_gamecenter_sample.html"


@pytest.fixture
def html() -> str:
    return FIXTURE.read_text(encoding="utf-8")


def test_parses_all_games(html):
    games = parse_games(html)
    assert len(games) == 2


def test_finished_game_fields(html):
    g = next(x for x in games_of(html) if x["game_id"] == "20260812HHOB0")
    assert g["game_date"] == date(2026, 8, 12)
    assert g["season"] == 2026
    assert g["status"] == "경기종료"
    assert g["stadium"] == "잠실"
    assert g["broadcast"] == "SBS SPORTS"
    assert (g["away_name"], g["away_score"]) == ("한화", 4)
    assert (g["home_name"], g["home_score"]) == ("두산", 3)
    assert g["win_pitcher"] == "박상원"
    assert g["lose_pitcher"] == "이영하"
    assert g["save_pitcher"] == "이민우"


def test_scheduled_game_fields(html):
    g = next(x for x in games_of(html) if x["game_id"] == "20260813HHOB0")
    assert g["status"] == "경기예정"
    assert g["start_time"] == "19:00"
    # 예정 경기는 점수 없음, 선발투수만 존재
    assert g["away_score"] is None and g["home_score"] is None
    assert g["away_pitcher"] == "류현진"
    assert g["home_pitcher"] == "최민석"
    assert g["win_pitcher"] is None


def test_empty_html_returns_empty_list():
    assert parse_games("<html><body>경기가 없습니다</body></html>") == []


def games_of(html: str) -> list[dict]:
    return parse_games(html)
