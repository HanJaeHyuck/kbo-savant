"""
KBO 자체 xBA/xSLG/xwOBA 예측 모델.
입력: Exit Velocity + Launch Angle → 안타/장타 확률
"""
import logging
from typing import Optional
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler


class KBOExpectedStats:
    """
    KBO 타구 데이터 기반 xBA 모델.
    최소 30개 이상의 학습 데이터가 있을 때 훈련한다.
    """
    MIN_SAMPLES = 30

    def __init__(self):
        self.scaler = StandardScaler()
        self.xba_model = LogisticRegression(random_state=42)
        self._trained = False

    def train(self, batted_balls: list[dict]) -> bool:
        """
        타구 데이터로 xBA 모델을 학습한다.
        Returns: 학습 성공 여부
        """
        eligible = [
            b for b in batted_balls
            if b.get("exit_velocity") is not None
            and b.get("launch_angle") is not None
            and b.get("result") is not None
        ]

        if len(eligible) < self.MIN_SAMPLES:
            logging.warning(
                f"[ML] 학습 데이터 부족 ({len(eligible)}개 < {self.MIN_SAMPLES}개), 훈련 스킵"
            )
            return False

        X = np.array([[b["exit_velocity"], b["launch_angle"]] for b in eligible])
        y = np.array([
            1 if b["result"] in ("안타", "2루타", "3루타", "홈런") else 0
            for b in eligible
        ])

        # 클래스가 1개뿐이면 훈련 불가
        if len(set(y)) < 2:
            logging.warning("[ML] 클래스 다양성 부족, 훈련 스킵")
            return False

        X_scaled = self.scaler.fit_transform(X)
        self.xba_model.fit(X_scaled, y)
        self._trained = True
        logging.info(f"[ML] xBA 모델 훈련 완료 (샘플 {len(eligible)}개)")
        return True

    def predict_xba(self, exit_velocity: float, launch_angle: float) -> Optional[float]:
        """타구 한 개의 xBA(안타 확률)를 예측한다."""
        if not self._trained:
            return None
        X = self.scaler.transform([[exit_velocity, launch_angle]])
        prob = self.xba_model.predict_proba(X)[0][1]
        return round(float(prob), 3)

    def calc_player_xba(self, batted_balls: list[dict]) -> Optional[float]:
        """선수의 타구 목록으로 시즌 xBA를 계산한다."""
        if not self._trained:
            return None
        eligible = [
            b for b in batted_balls
            if b.get("exit_velocity") is not None
            and b.get("launch_angle") is not None
        ]
        if not eligible:
            return None
        probs = [
            self.predict_xba(b["exit_velocity"], b["launch_angle"])
            for b in eligible
        ]
        valid = [p for p in probs if p is not None]
        return round(sum(valid) / len(valid), 3) if valid else None

    def calc_babip_luck(self, babip: float, xba: float) -> float:
        """
        BABIP - xBA 차이로 운 성분을 계산한다.
        양수 = 행운 / 음수 = 불운
        """
        return round(babip - xba, 3)
