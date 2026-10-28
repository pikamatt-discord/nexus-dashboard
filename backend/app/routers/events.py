from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db, AuditEvent
from ..security import get_current_user, User

router = APIRouter(prefix="/events", tags=["Events"])

@router.get("")
def get_audit_events(
    level: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditEvent)
    if level:
        query = query.filter(AuditEvent.level == level.upper())
    if source:
        query = query.filter(AuditEvent.source == source.upper())
    
    events = query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "level": e.level,
            "source": e.source,
            "message": e.message,
            "details": e.details,
            "user": e.user,
        }
        for e in events
    ]
