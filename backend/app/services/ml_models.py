"""
KBO 자체 기대 스탯 예측 모델.
입력: Exit Velocity + Launch Angle → 안타 확률(xBA) / 기대 누루타(xSLG) / 기대 wOBA(xwOBA)
"""
import logging
from typing import Optional
import numpy as np
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.preprocessing import StandardScaler

# 타구 결과별 누루타 (xSLG용)
_TOTAL_BASES = {"안타": 1, "2루타": 2, "3루타": 3, "홈런": 4}
# 타구 결과별 wOBA 가중치 (contact 기준 근사)
_WOBA_WEIGHT = {"안타": 0.88, "2루타": 1.24, "3루타": 1.56, "홈런": 2.00}


class KBOExpectedStats:
    """
    KBO 타구 데이터(EV+LA) 기반 기대 스탯 모델.
    최소 30개 이상의 학습 데이터가 있을 때 훈련한다.
    """
    MIN_SAMPLES = 30

    def __init__(self):
        self.scaler = StandardScaler()
        self.xba_model = LogisticRegression(random_state=42)
        self.xslg_model = LinearRegression()
        self.xwoba_model = LinearRegression()
        self._trained = False

    def train(self, batted_balls: list[dict]) -> bool:
        """타구 데이터로 xBA/xSLG/xwOBA 모델을 학습한다."""
        eligible = [
            b for b in batted_balls
            if b.get("exit_velocity") is not None
            and b.get("launch_angle") is not None
            and b.get("result") is not None
        ]
        if len(eligible) < self.MIN_SAMPLES:
            logging.warning(f"[ML] 학습 데이터 부족 ({len(eligible)} < {self.MIN_SAMPLES}), 훈련 스킵")
            return False

        X = np.array([[b["exit_velocity"], b["launch_angle"]] for b in eligible])
        y_hit = np.array([1 if b["result"] in _TOTAL_BASES else 0 for b in eligible])
        if len(set(y_hit)) < 2:
            logging.warning("[ML] 클래스 다양성 부족, 훈련 스킵")
            return False

        y_tb = np.array([_TOTAL_BASES.get(b["result"], 0) for b in eligible], dtype=float)
        y_woba = np.array([_WOBA_WEIGHT.get(b["result"], 0.0) for b in eligible], dtype=float)

        X_scaled = self.scaler.fit_transform(X)
        self.xba_model.fit(X_scaled, y_hit)
        self.xslg_model.fit(X_scaled, y_tb)
        self.xwoba_model.fit(X_scaled, y_woba)
        self._trained = True
        logging.info(f"[ML] 기대 스탯 모델 훈련 완료 (샘플 {len(eligible)}개)")
        return True

    @property
    def trained(self) -> bool:
        return self._trained

    def _predict(self, model, ev: float, la: float, clip=None) -> float:
        X = self.scaler.transform([[ev, la]])
        if isinstance(model, LogisticRegression):
            v = model.predict_proba(X)[0][1]
        else:
            v = float(model.predict(X)[0])
        if clip:
            v = max(clip[0], min(clip[1], v))
        return v

    def predict_xba(self, ev: float, la: float) -> Optional[float]:
        if not self._trained:
            return None
        return round(self._predict(self.xba_model, ev, la, clip=(0.0, 1.0)), 3)

    def _player_mean(self, batted_balls: list[dict], model, clip) -> Optional[float]:
        if not self._trained:
            return None
        # 배치 예측 (개별 호출 오버헤드 제거 — 수천 건도 1회 transform/predict로 처리)
        pts = [
            (b["exit_velocity"], b["launch_angle"])
            for b in batted_balls
            if b.get("exit_velocity") is not None and b.get("launch_angle") is not None
        ]
        if not pts:
            return None
        X = self.scaler.transform(np.asarray(pts, dtype=float))
        if isinstance(model, LogisticRegression):
            vals = model.predict_proba(X)[:, 1]
        else:
            vals = model.predict(X)
        if clip:
            vals = np.clip(vals, clip[0], clip[1])
        return round(float(np.mean(vals)), 3)

    def calc_player_xba(self, batted_balls: list[dict]) -> Optional[float]:
        return self._player_mean(batted_balls, self.xba_model, (0.0, 1.0))

    def calc_player_xslg(self, batted_balls: list[dict]) -> Optional[float]:
        return self._player_mean(batted_balls, self.xslg_model, (0.0, 4.0))

    def calc_player_xwoba(self, batted_balls: list[dict]) -> Optional[float]:
        return self._player_mean(batted_balls, self.xwoba_model, (0.0, 2.0))

    def calc_babip_luck(self, babip: float, xba: float) -> float:
        """BABIP - xBA → 운 성분 (양수=행운, 음수=불운)"""
        return round(babip - xba, 3)
