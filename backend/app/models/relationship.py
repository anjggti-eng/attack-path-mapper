from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class RelationType(str, enum.Enum):
    MEMBER_OF = "member_of"
    HAS_ACCESS = "has_access"
    ADMIN_OF = "admin_of"
    CONNECTS_TO = "connects_to"
    DEPENDS_ON = "depends_on"
    REMOTE_ACCESS = "remote_access"
    FILE_SHARE = "file_share"
    DATABASE_ACCESS = "database_access"
    SERVICE_ACCOUNT = "service_account"


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("assets.id"))
    target_id = Column(Integer, ForeignKey("assets.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    relation_type = Column(String(50))
    privilege_level = Column(String(50))
    protocol = Column(String(50))
    port = Column(Integer)
    risk_score = Column(Float, default=0.0)
    description = Column(Text)
    evidence = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
