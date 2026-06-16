from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, func
from app.database import Base


class BattedBall(Base):
    __tablename__ = "batted_balls"

    id = Column(Integer, primary_key=True)
    game_id = Column(String(30), nullable=False)
    batter_id = Column(Integer, ForeignKey("players.id"))
    pitcher_id = Column(Integer, ForeignKey("players.id"))
    season = Column(Integer, nullable=False)
    game_date = Column(Date, nullable=False)
    pitch_type = Column(String(20))   # 타구를 만든 투구 구종
    exit_velocity = Column(Float)
    launch_angle = Column(Float)
    hit_distance = Column(Float)
    direction = Column(String(10))
    batted_type = Column(String(20))
    result = Column(String(20))
    spray_x = Column(Float)
    spray_y = Column(Float)
    created_at = Column(DateTime, default=func.now())
