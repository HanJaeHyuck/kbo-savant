from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, UniqueConstraint, func
from app.database import Base


class BattingStat(Base):
    __tablename__ = "batting_stats"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    season = Column(Integer, nullable=False)
    games = Column(Integer)
    pa = Column(Integer)
    ab = Column(Integer)
    hits = Column(Integer)
    doubles = Column(Integer)
    triples = Column(Integer)
    hr = Column(Integer)
    rbi = Column(Integer)
    sb = Column(Integer)
    bb = Column(Integer)
    k = Column(Integer)
    avg = Column(Float)
    obp = Column(Float)
    slg = Column(Float)
    ops = Column(Float)
    woba = Column(Float)
    wrc_plus = Column(Float)
    babip = Column(Float)
    war = Column(Float)
    hard_hit_pct = Column(Float)
    barrel_pct = Column(Float)
    sweet_spot_pct = Column(Float)
    avg_ev = Column(Float)
    chase_pct = Column(Float)
    whiff_pct = Column(Float)

    __table_args__ = (UniqueConstraint("player_id", "season"),)
