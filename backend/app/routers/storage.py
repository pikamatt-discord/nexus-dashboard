from fastapi import APIRouter, Depends
from ..security import get_current_user, User
from ..system_service import get_system_metrics

router = APIRouter(prefix="/storage", tags=["Storage"])

@router.get("/mounts")
def get_storage_mounts(current_user: User = Depends(get_current_user)):
    metrics = get_system_metrics()
    return metrics["storage"]
