from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True)
    full_name = Column(String(255))
    email = Column(String(255))
    domain = Column(String(255))
    is_admin = Column(Boolean, default=False)
    is_domain_admin = Column(Boolean, default=False)
    is_service_account = Column(Boolean, default=False)
    is_orphaned = Column(Boolean, default=False)
    is_inactive = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    password_last_set = Column(DateTime(timezone=True))
    risk_score = Column(Float, default=0.0)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    groups = relationship("Group", secondary="user_groups", back_populates="users")
