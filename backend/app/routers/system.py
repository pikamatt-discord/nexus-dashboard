from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db, MetricHistory, AuditEvent
from ..security import get_current_user, User
from ..system_service import (
    get_system_metrics,
    perform_system_power_action,
    get_security_audit,
    get_system_updates
)

router = APIRouter(prefix="/system", tags=["System"])

class PowerActionRequest(BaseModel):
    action: str  # reboot, shutdown

@router.get("/metrics")
def read_system_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    metrics = get_system_metrics()
    
    # Save metric snapshot to history table for historical graphs
    history_entry = MetricHistory(
        cpu_percent=metrics["cpu"]["percent"],
        ram_percent=metrics["memory"]["percent"],
        ram_used_bytes=metrics["memory"]["used_bytes"],
        ram_total_bytes=metrics["memory"]["total_bytes"],
        disk_percent=metrics["storage"][0]["percent"] if metrics["storage"] else 0.0,
        net_bytes_sent=metrics["network"]["bytes_sent"],
        net_bytes_recv=metrics["network"]["bytes_recv"],
    )
    db.add(history_entry)
    db.commit()

    return metrics

@router.get("/metrics/history")
def read_system_metrics_history(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(MetricHistory).order_by(MetricHistory.timestamp.desc()).limit(limit).all()
    records.reverse()
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "cpu_percent": r.cpu_percent,
            "ram_percent": r.ram_percent,
            "ram_used_bytes": r.ram_used_bytes,
            "disk_percent": r.disk_percent,
            "net_bytes_sent": r.net_bytes_sent,
            "net_bytes_recv": r.net_bytes_recv,
        }
        for r in records
    ]

@router.post("/power")
def trigger_power_action(
    payload: PowerActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        res = perform_system_power_action(payload.action)
        audit = AuditEvent(
            level="WARNING",
            source="SYSTEM",
            message=f"Power action '{payload.action}' executed on Ubuntu host.",
            user=current_user.username
        )
        db.add(audit)
        db.commit()
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/security-audit")
def read_security_audit(current_user: User = Depends(get_current_user)):
    return get_security_audit()

@router.get("/updates")
def read_system_updates(current_user: User = Depends(get_current_user)):
    return get_system_updates()
