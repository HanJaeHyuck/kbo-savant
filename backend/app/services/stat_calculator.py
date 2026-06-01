from typing import List, Dict


def hard_hit_pct(exit_velocities: List[float]) -> float:
    if not exit_velocities:
        return 0.0
    count = sum(1 for ev in exit_velocities if ev >= 150)
    return round(count / len(exit_velocities) * 100, 1)


def barrel_pct(batted_balls: List[Dict], total: int) -> float:
    if total == 0:
        return 0.0
    count = sum(
        1 for b in batted_balls
        if b.get("exit_velocity", 0) >= 158
        and 26 <= b.get("launch_angle", -999) <= 30
    )
    return round(count / total * 100, 1)


def sweet_spot_pct(launch_angles: List[float]) -> float:
    if not launch_angles:
        return 0.0
    count = sum(1 for la in launch_angles if 8 <= la <= 32)
    return round(count / len(launch_angles) * 100, 1)


def avg_ev(exit_velocities: List[float]) -> float:
    if not exit_velocities:
        return 0.0
    return round(sum(exit_velocities) / len(exit_velocities), 1)


def chase_pct(pitches: List[Dict]) -> float:
    outside_zone = [p for p in pitches if p.get("zone", 0) in (11, 12, 13, 14)]
    if not outside_zone:
        return 0.0
    swings = sum(
        1 for p in outside_zone
        if p.get("result") in ("헛스윙", "파울", "인플레이", "번트")
    )
    return round(swings / len(outside_zone) * 100, 1)


def whiff_pct(pitches: List[Dict]) -> float:
    swings = [
        p for p in pitches
        if p.get("result") in ("헛스윙", "파울", "인플레이", "번트")
    ]
    if not swings:
        return 0.0
    whiffs = sum(1 for p in swings if p.get("result") == "헛스윙")
    return round(whiffs / len(swings) * 100, 1)


def csw_pct(pitches: List[Dict]) -> float:
    if not pitches:
        return 0.0
    csw = sum(
        1 for p in pitches
        if p.get("result") in ("헛스윙", "루킹스트라이크")
    )
    return round(csw / len(pitches) * 100, 1)


def calc_percentile(value: float, all_values: List[float], higher_is_better: bool = True) -> int:
    if not all_values or value is None:
        return 50
    if higher_is_better:
        below = sum(1 for v in all_values if v <= value)
    else:
        below = sum(1 for v in all_values if v >= value)
    return min(99, max(1, round(below / len(all_values) * 100)))
