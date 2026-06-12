from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class PathType(str, enum.Enum):
    SHORTEST = "shortest"
    MOST_DANGEROUS = "most_dangerous"
    MOST_LIKELY = "most_likely"
    FASTEST = "fastest"


class AttackPath(Base):
    __tablename__ = "attack_paths"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    source_asset_id = Column(Integer, ForeignKey("assets.id"))
    target_asset_id = Column(Integer, ForeignKey("assets.id"))
    path_type = Column(Enum(PathType), default=PathType.SHORTEST)
    path_steps = Column(JSON)
    total_risk_score = Column(Float, default=0.0)
    hop_count = Column(Integer, default=0)
    techniques = Column(JSON)
    description = Column(Text)
    remediation = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
