from sqlalchemy import Column, Integer, String, Date, DateTime, func
from app.database import Base


class Game(Base):
    """
    KBO 공식 게임센터에서 수집한 경기 일정/결과 (실데이터).
    트래킹 지표와 달리 KBO가 공개하는 범위라 실제 값으로 채워진다.
    """
    __tablename__ = "games"

    id = Column(Integer, primary_key=True)
    game_id = Column(String(30), unique=True, nullable=False)  # 예: 20260812HHOB0
    game_date = Column(Date, nullable=False, index=True)
    season = Column(Integer, nullable=False)

    stadium = Column(String(30))          # 구장 (s_nm)
    broadcast = Column(String(50))        # 중계 방송사
    start_time = Column(String(10))       # 경기 시작 시간 "19:00"
    status = Column(String(20))           # 경기예정 / 경기중 / 경기종료 / 취소
    status_code = Column(Integer)         # game_sc (1=예정, 3=종료 등)

    away_code = Column(String(5))         # HH
    home_code = Column(String(5))         # OB
    away_name = Column(String(20))        # 한화
    home_name = Column(String(20))        # 두산
    away_score = Column(Integer)
    home_score = Column(Integer)

    # 선발 / 승패세 투수 (이름 문자열 — KBO 표기 그대로)
    away_pitcher = Column(String(30))
    home_pitcher = Column(String(30))
    win_pitcher = Column(String(30))
    lose_pitcher = Column(String(30))
    save_pitcher = Column(String(30))

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
