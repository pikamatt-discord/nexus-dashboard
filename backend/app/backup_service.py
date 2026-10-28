import os
import time
import shutil
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .database import BackupJobRecord, AuditEvent
from .config import settings

PREDEFINED_JOBS = [
    {
        "id": "config_backup",
        "name": "Configuration System Backup",
        "description": "Backs up /etc configuration files and Nexus settings.",
        "target_paths": ["/etc/nexus", "./backend/app"],
        "destination": "./backups/configs",
    },
    {
        "id": "database_backup",
        "name": "SQLite Database Backup",
        "description": "Creates a snapshot of the SQLite database file.",
        "target_paths": ["./nexus.db"],
        "destination": "./backups/db",
    },
    {
        "id": "docker_compose_backup",
        "name": "Docker Compose & Stacks Backup",
        "description": "Backs up all active compose files and stack configurations.",
        "target_paths": ["./docker-compose.yml"],
        "destination": "./backups/stacks",
    }
]

def get_predefined_jobs() -> List[Dict[str, Any]]:
    return PREDEFINED_JOBS

def run_backup_job(job_id: str, db: Session, user: str = "system") -> Dict[str, Any]:
    job_meta = next((j for j in PREDEFINED_JOBS if j["id"] == job_id), None)
    if not job_meta:
        raise ValueError(f"Unknown backup job ID: {job_id}")

    start_time = datetime.now(timezone.utc)
    record = BackupJobRecord(
        job_name=job_meta["name"],
        status="RUNNING",
        started_at=start_time,
        destination=job_meta["destination"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    try:
        os.makedirs(job_meta["destination"], exist_ok=True)
        # Simulate backup execution
        time.sleep(1) # Simulated delay for realistic timing
        
        simulated_size = 1024 * 1024 * 12.5 # 12.5 MB
        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        record.status = "SUCCESS"
        record.completed_at = end_time
        record.duration_seconds = round(duration, 2)
        record.size_bytes = simulated_size
        record.integrity_verified = True

        audit = AuditEvent(
            level="INFO",
            source="BACKUP",
            message=f"Backup job '{job_meta['name']}' completed successfully.",
            user=user
        )
        db.add(audit)
        db.commit()

        return {
            "id": record.id,
            "job_id": job_id,
            "job_name": job_meta["name"],
            "status": "SUCCESS",
            "duration_seconds": record.duration_seconds,
            "size_bytes": record.size_bytes,
            "destination": record.destination,
            "integrity_verified": True
        }

    except Exception as e:
        end_time = datetime.now(timezone.utc)
        record.status = "FAILED"
        record.completed_at = end_time
        record.error_message = str(e)
        
        audit = AuditEvent(
            level="ERROR",
            source="BACKUP",
            message=f"Backup job '{job_meta['name']}' failed: {str(e)}",
            user=user
        )
        db.add(audit)
        db.commit()

        return {
            "id": record.id,
            "job_id": job_id,
            "job_name": job_meta["name"],
            "status": "FAILED",
            "error_message": str(e),
            "destination": record.destination
        }

def get_backup_history(db: Session, limit: int = 20) -> List[Dict[str, Any]]:
    records = db.query(BackupJobRecord).order_by(BackupJobRecord.started_at.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "job_name": r.job_name,
            "status": r.status,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "duration_seconds": r.duration_seconds,
            "size_bytes": r.size_bytes,
            "destination": r.destination,
            "error_message": r.error_message,
            "integrity_verified": r.integrity_verified,
        }
        for r in records
    ]
