"""Goal 4 — 지표 계산 엔진 테스트"""
import pytest
from datetime import date
from app.services.stat_calculator import (
    hard_hit_pct, barrel_pct, sweet_spot_pct,
    avg_ev, chase_pct, whiff_pct, csw_pct, calc_percentile,
)


# ────────────────────────────────────────────
# CLAUDE.md 체크리스트 항목 (명시적 검증)
# ────────────────────────────────────────────

def test_hard_hit_pct_spec():
    """hard_hit_pct([155,145,160]) == 66.7"""
    assert hard_hit_pct([155.0, 145.0, 160.0]) == 66.7


def test_barrel_pct_spec():
    """barrel_pct([{ev:162,la:27}], 전체4개) == 25.0"""
    balls = [{"exit_velocity": 162.0, "launch_angle": 27.0}]
    assert barrel_pct(balls, 4) == 25.0


def test_sweet_spot_pct_lower_boundary_spec():
    """LA=8 경계값 포함"""
    assert sweet_spot_pct([8.0]) == 100.0   # 경계 포함
    assert sweet_spot_pct([7.9]) == 0.0     # 경계 미만


def test_sweet_spot_pct_upper_boundary_spec():
    """LA=32 경계값 포함"""
    assert sweet_spot_pct([32.0]) == 100.0  # 경계 포함
    assert sweet_spot_pct([32.1]) == 0.0    # 경계 초과


def test_all_functions_return_zero_on_empty():
    """빈 리스트 입력 시 모든 함수 0 반환 (ZeroDivisionError 없음)"""
    assert hard_hit_pct([]) == 0.0
    assert barrel_pct([], 0) == 0.0
    assert sweet_spot_pct([]) == 0.0
    assert avg_ev([]) == 0.0
    assert chase_pct([]) == 0.0
    assert whiff_pct([]) == 0.0
    assert csw_pct([]) == 0.0


def test_whiff_pct_fixture(mock_pitches):
    """whiff_pct 픽스처 데이터로 정확도 검증"""
    result = whiff_pct(mock_pitches)
    assert result == pytest.approx(50.0, abs=0.1)


def test_csw_pct_fixture(mock_pitches):
    """csw_pct 픽스처 데이터로 정확도 검증"""
    result = csw_pct(mock_pitches)
    assert result == pytest.approx(40.0, abs=0.1)


def test_chase_pct_fixture(mock_pitches):
    """
    chase_pct 픽스처 데이터로 정확도 검증.
    픽스처에서 zone 13(바깥존) 투구 1개, 결과는 '볼' → 스윙 없음 → 0.0%
    """
    result = chase_pct(mock_pitches)
    assert result == 0.0


# ────────────────────────────────────────────
# 추가 경계값 / 엣지케이스
# ────────────────────────────────────────────

def test_barrel_pct_boundary_ev():
    """EV=158 정확히 경계 (포함)"""
    balls = [{"exit_velocity": 158.0, "launch_angle": 28.0}]
    assert barrel_pct(balls, 1) == 100.0


def test_barrel_pct_below_ev():
    """EV=157.9 → 배럴 아님"""
    balls = [{"exit_velocity": 157.9, "launch_angle": 28.0}]
    assert barrel_pct(balls, 1) == 0.0


def test_barrel_pct_la_boundary():
    """LA=26 / 30 경계 포함"""
    b26 = [{"exit_velocity": 160.0, "launch_angle": 26.0}]
    b30 = [{"exit_velocity": 160.0, "launch_angle": 30.0}]
    assert barrel_pct(b26, 1) == 100.0
    assert barrel_pct(b30, 1) == 100.0


def test_calc_percentile_higher_is_better():
    values = [1.0, 2.0, 3.0, 4.0, 5.0]
    assert calc_percentile(5.0, values, higher_is_better=True) == 99  # 상한 99로 캡핑
    assert calc_percentile(1.0, values, higher_is_better=True) == 20


def test_calc_percentile_lower_is_better():
    values = [1.0, 2.0, 3.0, 4.0, 5.0]
    # ERA: 낮을수록 좋음 → 1.0이 highest percentile (99로 캡핑)
    pct = calc_percentile(1.0, values, higher_is_better=False)
    assert pct == 99


def test_calc_percentile_empty_values():
    assert calc_percentile(5.0, [], higher_is_better=True) == 50


def test_chase_pct_with_swing():
    """존 바깥 투구에 스윙 있을 때"""
    pitches = [
        {"zone": 13, "result": "헛스윙"},
        {"zone": 13, "result": "볼"},
        {"zone": 5, "result": "스트라이크"},
    ]
    result = chase_pct(pitches)
    assert result == pytest.approx(50.0, abs=0.1)


def test_whiff_pct_no_swings():
    """스윙이 없을 때 0 반환"""
    pitches = [{"result": "볼"}, {"result": "스트라이크"}, {"result": "루킹스트라이크"}]
    assert whiff_pct(pitches) == 0.0


# ────────────────────────────────────────────
# stat_updater 통합 테스트
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


def test_update_batter_tracking_stats(db_session):
    from app.services.stat_updater import update_batter_tracking_stats
    from app.models import BattingStat, Player

    player = db_session.query(Player).filter_by(name="이정후").first()
    if not player:
        pytest.skip("이정후 데이터 없음")

    metrics = update_batter_tracking_stats(player.id, 2024, db_session)

    assert "hard_hit_pct" in metrics
    assert "barrel_pct" in metrics
    assert "sweet_spot_pct" in metrics
    assert "avg_ev" in metrics
    assert "chase_pct" in metrics
    assert "whiff_pct" in metrics

    stat = db_session.query(BattingStat).filter_by(
        player_id=player.id, season=2024
    ).first()
    assert stat is not None
    assert stat.hard_hit_pct is not None


def test_update_pitcher_tracking_stats(db_session):
    from app.services.stat_updater import update_pitcher_tracking_stats
    from app.models import PitchingStat, Player

    player = db_session.query(Player).filter_by(name="김광현").first()
    if not player:
        pytest.skip("김광현 데이터 없음")

    metrics = update_pitcher_tracking_stats(player.id, 2024, db_session)

    assert "csw_pct" in metrics
    assert "whiff_pct" in metrics
    assert "chase_pct" in metrics
    assert "avg_ev_allowed" in metrics
    assert "hard_hit_pct" in metrics
    assert "barrel_pct" in metrics


def test_update_all_tracking_stats(db_session):
    from app.services.stat_updater import update_all_tracking_stats

    batters, pitchers = update_all_tracking_stats(2024, db_session)
    assert batters >= 0
    assert pitchers >= 0


# ────────────────────────────────────────────
# percentile_service 테스트
# ────────────────────────────────────────────

def test_compute_batting_percentiles(db_session):
    from app.services.percentile_service import compute_batting_percentiles

    result = compute_batting_percentiles(2024, db_session)
    if not result:
        pytest.skip("2024 타자 스탯 데이터 없음")

    for player_id, pcts in result.items():
        assert "war" in pcts
        assert 1 <= pcts["war"] <= 100


def test_compute_pitching_percentiles(db_session):
    from app.services.percentile_service import compute_pitching_percentiles

    result = compute_pitching_percentiles(2024, db_session)
    if not result:
        pytest.skip("2024 투수 스탯 데이터 없음")

    for player_id, pcts in result.items():
        assert "fip" in pcts
        assert 1 <= pcts["fip"] <= 100


def test_percentile_empty_season(db_session):
    from app.services.percentile_service import (
        compute_batting_percentiles,
        compute_pitching_percentiles,
    )
    assert compute_batting_percentiles(1900, db_session) == {}
    assert compute_pitching_percentiles(1900, db_session) == {}


# ────────────────────────────────────────────
# ML 모델 테스트
# ────────────────────────────────────────────

@pytest.fixture
def trained_model():
    from app.services.ml_models import KBOExpectedStats
    model = KBOExpectedStats()
    balls = (
        [{"exit_velocity": 155.0 + i, "launch_angle": 20.0, "result": "안타"} for i in range(20)]
        + [{"exit_velocity": 125.0 + i, "launch_angle": -5.0, "result": "아웃"} for i in range(20)]
    )
    model.train(balls)
    return model


def test_ml_model_train(trained_model):
    assert trained_model._trained is True


def test_ml_model_predict_xba(trained_model):
    xba = trained_model.predict_xba(160.0, 20.0)
    assert xba is not None
    assert 0.0 <= xba <= 1.0


def test_ml_model_predict_xba_untrained():
    from app.services.ml_models import KBOExpectedStats
    model = KBOExpectedStats()
    assert model.predict_xba(150.0, 15.0) is None


def test_ml_model_insufficient_data():
    from app.services.ml_models import KBOExpectedStats
    model = KBOExpectedStats()
    # 30개 미만 → 학습 실패
    result = model.train([
        {"exit_velocity": 155.0, "launch_angle": 20.0, "result": "안타"}
        for _ in range(10)
    ])
    assert result is False
    assert model._trained is False


def test_ml_model_babip_luck(trained_model):
    luck = trained_model.calc_babip_luck(0.361, 0.320)
    assert luck == pytest.approx(0.041, abs=0.001)


def test_ml_model_calc_player_xba(trained_model):
    balls = [
        {"exit_velocity": 158.0, "launch_angle": 22.0},
        {"exit_velocity": 142.0, "launch_angle": -2.0},
    ]
    xba = trained_model.calc_player_xba(balls)
    assert xba is not None
    assert 0.0 <= xba <= 1.0


def test_ml_model_calc_player_xba_empty(trained_model):
    assert trained_model.calc_player_xba([]) is None
