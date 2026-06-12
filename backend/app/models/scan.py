from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ScanType(str, enum.Enum):
    FULL = "full"
    QUICK = "quick"
    TARGETED = "targeted"
    CONTINUOUS = "continuous"


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    scan_type = Column(Enum(ScanType), default=ScanType.FULL)
    status = Column(Enum(ScanStatus), default=ScanStatus.PENDING)
    target_range = Column(String(255))
    assets_found = Column(Integer, default=0)
    relationships_found = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
