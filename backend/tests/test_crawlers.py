import pytest
from pathlib import Path
from datetime import date

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def mock_game_html():
    return (FIXTURES_DIR / "mock_kbo_game.html").read_text(encoding="utf-8")


# ────────────────────────────────────────────
# 단위: 투구 파싱
# ────────────────────────────────────────────

def test_parse_pitches_fields(mock_game_html):
    from crawlers.kbo_game_crawler import parse_pitches
    pitches = parse_pitches(mock_game_html)
    assert len(pitches) == 5, f"투구 5개 기대, {len(pitches)}개 파싱됨"
    for p in pitches:
        assert "pitch_type" in p and p["pitch_type"]
        assert "velocity" in p and p["velocity"] is not None
        assert "plate_x" in p
        assert "plate_z" in p
        assert "zone" in p
        assert "result" in p and p["result"]


def test_parse_pitches_values(mock_game_html):
    from crawlers.kbo_game_crawler import parse_pitches
    pitches = parse_pitches(mock_game_html)
    first = pitches[0]
    assert first["pitch_type"] == "직구"
    assert first["velocity"] == 148.0
    assert first["zone"] == 5
    assert first["result"] == "스트라이크"
    assert first["balls"] == 0
    assert first["strikes"] == 0
    # zone 5 → 중앙 좌표
    assert first["plate_x"] is not None
    assert first["plate_z"] is not None


def test_parse_pitches_zone_coords(mock_game_html):
    from crawlers.kbo_game_crawler import parse_pitches, ZONE_COORDS
    pitches = parse_pitches(mock_game_html)
    for p in pitches:
        zone = p["zone"]
        if zone in ZONE_COORDS:
            expected_x, expected_z = ZONE_COORDS[zone]
            assert p["plate_x"] == pytest.approx(expected_x, abs=0.01)
            assert p["plate_z"] == pytest.approx(expected_z, abs=0.01)


def test_parse_pitches_numbering(mock_game_html):
    from crawlers.kbo_game_crawler import parse_pitches
    pitches = parse_pitches(mock_game_html)
    for i, p in enumerate(pitches, start=1):
        assert p["pitch_number"] == i


def test_parse_pitches_empty_html():
    from crawlers.kbo_game_crawler import parse_pitches
    assert parse_pitches("<html><body></body></html>") == []


# ────────────────────────────────────────────
# 단위: 타구 파싱
# ────────────────────────────────────────────

def test_parse_batted_balls_fields(mock_game_html):
    from crawlers.kbo_game_crawler import parse_batted_balls
    balls = parse_batted_balls(mock_game_html)
    assert len(balls) == 3, f"타구 3개 기대, {len(balls)}개 파싱됨"
    for b in balls:
        assert "exit_velocity" in b and b["exit_velocity"] is not None
        assert "launch_angle" in b and b["launch_angle"] is not None
        assert "direction" in b and b["direction"]
        assert "result" in b and b["result"]


def test_parse_batted_balls_values(mock_game_html):
    from crawlers.kbo_game_crawler import parse_batted_balls
    balls = parse_batted_balls(mock_game_html)
    first = balls[0]
    assert first["exit_velocity"] == pytest.approx(155.2)
    assert first["launch_angle"] == pytest.approx(18.4)
    assert first["direction"] == "우"
    assert first["result"] == "안타"
    assert first["spray_x"] == pytest.approx(45.2)
    assert first["spray_y"] == pytest.approx(120.3)


def test_parse_batted_balls_empty_html():
    from crawlers.kbo_game_crawler import parse_batted_balls
    assert parse_batted_balls("<html><body></body></html>") == []


# ────────────────────────────────────────────
# 기존 픽스처 파싱 테스트 (Goal 1에서 이어짐)
# ────────────────────────────────────────────

def test_mock_pitches_fields(mock_pitches):
    for pitch in mock_pitches:
        assert "pitch_type" in pitch
        assert "velocity" in pitch
        assert "plate_x" in pitch
        assert "plate_z" in pitch
        assert "zone" in pitch
        assert "result" in pitch


def test_mock_batted_balls_fields(mock_batted_balls):
    for ball in mock_batted_balls:
        assert "exit_velocity" in ball
        assert "launch_angle" in ball
        assert "direction" in ball
        assert "result" in ball


# ────────────────────────────────────────────
# 통합: DB 저장 + 중복 방지
# ────────────────────────────────────────────

@pytest.fixture
def db_session():
    """실제 PostgreSQL 연결 (DB가 없으면 스킵)"""
    try:
        from app.database import SessionLocal, engine, Base
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        yield db
        db.close()
    except Exception as e:
        pytest.skip(f"DB 연결 불가 — 통합 테스트 스킵: {e}")


def test_save_pitches_to_db(db_session, mock_game_html):
    from crawlers.kbo_game_crawler import parse_pitches
    from crawlers.crawler_db_service import save_game_pitches
    from app.models import Pitch

    game_id = "TEST_PITCH_2024_UNIT"
    # 클린업
    db_session.query(Pitch).filter(Pitch.game_id == game_id).delete()
    db_session.commit()

    pitches = parse_pitches(mock_game_html)
    count = save_game_pitches(game_id, 2024, date(2024, 4, 1), pitches, db_session)
    assert count == 5

    saved = db_session.query(Pitch).filter(Pitch.game_id == game_id).all()
    assert len(saved) == 5
    # 클린업
    db_session.query(Pitch).filter(Pitch.game_id == game_id).delete()
    db_session.commit()


def test_save_batted_balls_to_db(db_session, mock_game_html):
    from crawlers.kbo_game_crawler import parse_batted_balls
    from crawlers.crawler_db_service import save_game_batted_balls
    from app.models import BattedBall

    game_id = "TEST_BATTED_2024_UNIT"
    db_session.query(BattedBall).filter(BattedBall.game_id == game_id).delete()
    db_session.commit()

    balls = parse_batted_balls(mock_game_html)
    count = save_game_batted_balls(game_id, 2024, date(2024, 4, 1), balls, db_session)
    assert count == 3

    saved = db_session.query(BattedBall).filter(BattedBall.game_id == game_id).all()
    assert len(saved) == 3
    db_session.query(BattedBall).filter(BattedBall.game_id == game_id).delete()
    db_session.commit()


def test_no_duplicate_pitches(db_session, mock_game_html):
    """동일 경기 2회 크롤링 시 중복 데이터 없음"""
    from crawlers.kbo_game_crawler import parse_pitches
    from crawlers.crawler_db_service import save_game_pitches
    from app.models import Pitch

    game_id = "TEST_DEDUP_PITCH_2024"
    db_session.query(Pitch).filter(Pitch.game_id == game_id).delete()
    db_session.commit()

    pitches = parse_pitches(mock_game_html)
    count1 = save_game_pitches(game_id, 2024, date(2024, 4, 1), pitches, db_session)
    count2 = save_game_pitches(game_id, 2024, date(2024, 4, 1), pitches, db_session)

    assert count1 == 5
    assert count2 == 0  # 두 번째는 스킵

    total = db_session.query(Pitch).filter(Pitch.game_id == game_id).count()
    assert total == 5  # 중복 없음
    db_session.query(Pitch).filter(Pitch.game_id == game_id).delete()
    db_session.commit()


def test_no_duplicate_batted_balls(db_session, mock_game_html):
    """동일 경기 2회 크롤링 시 타구 중복 데이터 없음"""
    from crawlers.kbo_game_crawler import parse_batted_balls
    from crawlers.crawler_db_service import save_game_batted_balls
    from app.models import BattedBall

    game_id = "TEST_DEDUP_BATTED_2024"
    db_session.query(BattedBall).filter(BattedBall.game_id == game_id).delete()
    db_session.commit()

    balls = parse_batted_balls(mock_game_html)
    count1 = save_game_batted_balls(game_id, 2024, date(2024, 4, 1), balls, db_session)
    count2 = save_game_batted_balls(game_id, 2024, date(2024, 4, 1), balls, db_session)

    assert count1 == 3
    assert count2 == 0

    total = db_session.query(BattedBall).filter(BattedBall.game_id == game_id).count()
    assert total == 3
    db_session.query(BattedBall).filter(BattedBall.game_id == game_id).delete()
    db_session.commit()
