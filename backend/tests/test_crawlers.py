import pytest


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
