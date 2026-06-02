import pytest
from pathlib import Path
from datetime import date

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def batting_html():
    return (FIXTURES_DIR / "mock_statiz_batting.html").read_text(encoding="utf-8")


@pytest.fixture
def pitching_html():
    return (FIXTURES_DIR / "mock_statiz_pitching.html").read_text(encoding="utf-8")


# ────────────────────────────────────────────
# 단위: 타자 스탯 파싱
# ────────────────────────────────────────────

def test_parse_batting_stats_count(batting_html):
    from crawlers.statiz_crawler import parse_batting_stats
    stats = parse_batting_stats(batting_html)
    assert len(stats) == 3


def test_parse_batting_stats_required_fields(batting_html):
    from crawlers.statiz_crawler import parse_batting_stats
    stats = parse_batting_stats(batting_html)
    for s in stats:
        assert "war" in s and s["war"] is not None
        assert "wrc_plus" in s and s["wrc_plus"] is not None
        assert "babip" in s and s["babip"] is not None
        assert "woba" in s and s["woba"] is not None


def test_parse_batting_stats_values(batting_html):
    from crawlers.statiz_crawler import parse_batting_stats
    stats = parse_batting_stats(batting_html)
    jh = next(s for s in stats if s["name"] == "이정후")
    assert jh["war"] == pytest.approx(7.2)
    assert jh["wrc_plus"] == pytest.approx(158.0)
    assert jh["babip"] == pytest.approx(0.361)
    assert jh["woba"] == pytest.approx(0.412)
    assert jh["avg"] == pytest.approx(0.349)
    assert jh["hr"] == 23
    assert jh["games"] == 144


def test_parse_batting_stats_empty_html():
    from crawlers.statiz_crawler import parse_batting_stats
    assert parse_batting_stats("<html><body></body></html>") == []


# ────────────────────────────────────────────
# 단위: 투수 스탯 파싱
# ────────────────────────────────────────────

def test_parse_pitching_stats_count(pitching_html):
    from crawlers.statiz_crawler import parse_pitching_stats
    stats = parse_pitching_stats(pitching_html)
    assert len(stats) == 3


def test_parse_pitching_stats_required_fields(pitching_html):
    from crawlers.statiz_crawler import parse_pitching_stats
    stats = parse_pitching_stats(pitching_html)
    for s in stats:
        assert "fip" in s and s["fip"] is not None
        assert "era_minus" in s and s["era_minus"] is not None
        assert "k_pct" in s and s["k_pct"] is not None
        assert "bb_pct" in s and s["bb_pct"] is not None


def test_parse_pitching_stats_values(pitching_html):
    from crawlers.statiz_crawler import parse_pitching_stats
    stats = parse_pitching_stats(pitching_html)
    kh = next(s for s in stats if s["name"] == "김광현")
    assert kh["fip"] == pytest.approx(3.12)
    assert kh["era_minus"] == pytest.approx(72.0)
    assert kh["k_pct"] == pytest.approx(28.4)
    assert kh["bb_pct"] == pytest.approx(7.1)
    assert kh["era"] == pytest.approx(2.84)
    assert kh["war"] == pytest.approx(6.2)
    assert kh["ip"] == pytest.approx(195.2)


def test_parse_pitching_stats_empty_html():
    from crawlers.statiz_crawler import parse_pitching_stats
    assert parse_pitching_stats("<html><body></body></html>") == []


# ────────────────────────────────────────────
# 통합: DB 저장
# ────────────────────────────────────────────

@pytest.fixture
def db_session():
    try:
        from app.database import SessionLocal, engine, Base
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        yield db
        db.close()
    except Exception as e:
        pytest.skip(f"DB 연결 불가: {e}")


def test_save_batting_stats_to_db(db_session, batting_html):
    from crawlers.statiz_crawler import parse_batting_stats
    from crawlers.statiz_db_service import save_batting_stats
    from app.models import BattingStat, Player

    # 테스트용 선수가 없으면 삽입
    season = 2023
    for name, kbo_id, team, pos in [
        ("이정후", "73912", "키움 히어로즈", "CF"),
        ("김도영", "60128", "KIA 타이거즈", "3B"),
        ("노시환", "61204", "한화 이글스", "3B"),
    ]:
        if not db_session.query(Player).filter_by(name=name).first():
            db_session.add(Player(kbo_id=kbo_id, name=name, team=team, position=pos))
    db_session.commit()

    # 기존 데이터 클린업
    player_ids = [p.id for p in db_session.query(Player).filter(
        Player.name.in_(["이정후", "김도영", "노시환"])
    ).all()]
    db_session.query(BattingStat).filter(
        BattingStat.player_id.in_(player_ids),
        BattingStat.season == season
    ).delete(synchronize_session=False)
    db_session.commit()

    stats = parse_batting_stats(batting_html)
    count = save_batting_stats(season, stats, db_session)
    assert count == 3

    saved = db_session.query(BattingStat).filter(
        BattingStat.player_id.in_(player_ids),
        BattingStat.season == season
    ).all()
    assert len(saved) == 3

    jh = next(s for s in saved if s.player_id == db_session.query(Player).filter_by(name="이정후").first().id)
    assert jh.war == pytest.approx(7.2)
    assert jh.wrc_plus == pytest.approx(158.0)
    assert jh.babip == pytest.approx(0.361)
    assert jh.woba == pytest.approx(0.412)


def test_save_pitching_stats_to_db(db_session, pitching_html):
    from crawlers.statiz_crawler import parse_pitching_stats
    from crawlers.statiz_db_service import save_pitching_stats
    from app.models import PitchingStat, Player

    season = 2023
    for name, kbo_id, team in [
        ("김광현", "31027", "SSG 랜더스"),
        ("양현종", "40112", "KIA 타이거즈"),
        ("고영표", "44801", "KT 위즈"),
    ]:
        if not db_session.query(Player).filter_by(name=name).first():
            db_session.add(Player(kbo_id=kbo_id, name=name, team=team, position="P"))
    db_session.commit()

    player_ids = [p.id for p in db_session.query(Player).filter(
        Player.name.in_(["김광현", "양현종", "고영표"])
    ).all()]
    db_session.query(PitchingStat).filter(
        PitchingStat.player_id.in_(player_ids),
        PitchingStat.season == season
    ).delete(synchronize_session=False)
    db_session.commit()

    stats = parse_pitching_stats(pitching_html)
    count = save_pitching_stats(season, stats, db_session)
    assert count == 3

    saved = db_session.query(PitchingStat).filter(
        PitchingStat.player_id.in_(player_ids),
        PitchingStat.season == season
    ).all()
    assert len(saved) == 3

    kh = next(s for s in saved if s.player_id == db_session.query(Player).filter_by(name="김광현").first().id)
    assert kh.fip == pytest.approx(3.12)
    assert kh.era_minus == pytest.approx(72.0)
    assert kh.k_pct == pytest.approx(28.4)
    assert kh.bb_pct == pytest.approx(7.1)
