from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, Float
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class AssetType(str, enum.Enum):
    COMPUTER = "computer"
    SERVER = "server"
    SWITCH = "switch"
    FIREWALL = "firewall"
    ROUTER = "router"
    PRINTER = "printer"
    MOBILE = "mobile"
    OTHER = "other"


class AssetCriticality(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), unique=True, index=True)
    ip_address = Column(String(45), index=True)
    mac_address = Column(String(17))
    asset_type = Column(Enum(AssetType), default=AssetType.COMPUTER)
    operating_system = Column(String(100))
    os_version = Column(String(100))
    criticality = Column(Enum(AssetCriticality), default=AssetCriticality.MEDIUM)
    function = Column(String(100))
    department = Column(String(100))
    location = Column(String(255))
    description = Column(Text)
    risk_score = Column(Float, default=0.0)
    last_scan = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
