from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os
from .config import settings

# SQLite Database connection
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

class MetricHistory(Base):
    __tablename__ = "metrics_history"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    cpu_percent = Column(Float, nullable=False)
    ram_percent = Column(Float, nullable=False)
    ram_used_bytes = Column(Float, nullable=False)
    ram_total_bytes = Column(Float, nullable=False)
    disk_percent = Column(Float, nullable=False)
    net_bytes_sent = Column(Float, nullable=False)
    net_bytes_recv = Column(Float, nullable=False)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    level = Column(String, default="INFO", index=True) # INFO, WARNING, ERROR
    source = Column(String, index=True) # SYSTEM, CONTAINER, BACKUP, AUTH
    message = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    user = Column(String, nullable=True)

class BackupJobRecord(Base):
    __tablename__ = "backup_job_records"
    
    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False) # SUCCESS, FAILED, RUNNING
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    size_bytes = Column(Float, nullable=True)
    destination = Column(String, nullable=False)
    error_message = Column(Text, nullable=True)
    integrity_verified = Column(Boolean, default=False)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
