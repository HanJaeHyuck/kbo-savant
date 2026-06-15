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
    height = Column(String(10))   # 신장 (예: "185cm")
    weight = Column(String(10))   # 체중 (예: "88kg")
    draft = Column(String(60))    # 드래프트 정보
    school = Column(String(60))   # 출신교
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
