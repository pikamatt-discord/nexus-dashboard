from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..security import get_current_user, User
from ..backup_service import get_predefined_jobs, run_backup_job, get_backup_history

router = APIRouter(prefix="/backups", tags=["Backups"])

@router.get("/jobs")
def list_backup_jobs(current_user: User = Depends(get_current_user)):
    return get_predefined_jobs()

@router.post("/jobs/{job_id}/run")
def trigger_backup_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        res = run_backup_job(job_id, db=db, user=current_user.username)
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/history")
def read_backup_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_backup_history(db=db, limit=limit)
