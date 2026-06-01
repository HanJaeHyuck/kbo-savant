from sqlalchemy import Column, Integer, String, Date, DateTime, func
from app.database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    kbo_id = Column(String(20), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    name_en = Column(String(100))
    team = Column(String(30), nullable=False)
    position = Column(String(10), nullable=False)
    birth_date = Column(Date)
    throws = Column(String(5))
    bats = Column(String(5))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
