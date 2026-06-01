import pytest
from app.services.stat_calculator import (
    hard_hit_pct, barrel_pct, sweet_spot_pct, avg_ev,
    chase_pct, whiff_pct, csw_pct,
)


def test_hard_hit_pct_basic():
    result = hard_hit_pct([155.0, 145.0, 160.0])
    assert result == 66.7


def test_hard_hit_pct_empty():
    assert hard_hit_pct([]) == 0.0


def test_barrel_pct_basic():
    balls = [{"exit_velocity": 162.1, "launch_angle": 27.5}]
    assert barrel_pct(balls, 4) == 25.0


def test_barrel_pct_empty():
    assert barrel_pct([], 0) == 0.0


def test_sweet_spot_pct_lower_boundary():
    assert sweet_spot_pct([8.0, 5.0, 35.0]) == pytest.approx(33.3, abs=0.1)


def test_sweet_spot_pct_upper_boundary():
    assert sweet_spot_pct([32.0, 33.0, 7.0]) == pytest.approx(33.3, abs=0.1)


def test_sweet_spot_pct_empty():
    assert sweet_spot_pct([]) == 0.0


def test_whiff_pct(mock_pitches):
    # 스윙: 헛스윙(1) + 인플레이(1) = 2, 헛스윙 = 1 → 50.0%
    result = whiff_pct(mock_pitches)
    assert result == pytest.approx(50.0, abs=0.1)


def test_csw_pct(mock_pitches):
    result = csw_pct(mock_pitches)
    assert result == pytest.approx(40.0, abs=0.1)


def test_chase_pct(mock_pitches):
    result = chase_pct(mock_pitches)
    assert result == 0.0


def test_avg_ev_basic(mock_batted_balls):
    evs = [b["exit_velocity"] for b in mock_batted_balls]
    result = avg_ev(evs)
    assert result == pytest.approx(150.6, abs=0.1)


def test_avg_ev_empty():
    assert avg_ev([]) == 0.0
