from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint, func
from app.database import Base


class PitchingStat(Base):
    __tablename__ = "pitching_stats"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    season = Column(Integer, nullable=False)
    games = Column(Integer)
    gs = Column(Integer)
    ip = Column(Float)
    wins = Column(Integer)
    losses = Column(Integer)
    saves = Column(Integer)
    era = Column(Float)
    fip = Column(Float)
    xfip = Column(Float)
    era_minus = Column(Float)
    fip_minus = Column(Float)
    k_pct = Column(Float)
    bb_pct = Column(Float)
    hr9 = Column(Float)
    babip = Column(Float)
    lob_pct = Column(Float)
    war = Column(Float)
    avg_ev_allowed = Column(Float)
    hard_hit_pct = Column(Float)
    barrel_pct = Column(Float)
    csw_pct = Column(Float)
    whiff_pct = Column(Float)
    chase_pct = Column(Float)
    arm_angle = Column(Float)   # 릴리스 암 앵글 (도, 0=사이드암 ~ 90=오버핸드)

    __table_args__ = (UniqueConstraint("player_id", "season"),)
