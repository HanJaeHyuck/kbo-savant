from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, func
from app.database import Base


class Pitch(Base):
    __tablename__ = "pitches"

    id = Column(Integer, primary_key=True)
    game_id = Column(String(30), nullable=False)
    pitcher_id = Column(Integer, ForeignKey("players.id"))
    batter_id = Column(Integer, ForeignKey("players.id"))
    season = Column(Integer, nullable=False)
    game_date = Column(Date, nullable=False)
    inning = Column(Integer)
    pitch_number = Column(Integer)
    pitch_type = Column(String(20))
    velocity = Column(Float)
    spin_rate = Column(Integer)
    plate_x = Column(Float)
    plate_z = Column(Float)
    balls = Column(Integer)
    strikes = Column(Integer)
    result = Column(String(20))
    zone = Column(Integer)
    created_at = Column(DateTime, default=func.now())
