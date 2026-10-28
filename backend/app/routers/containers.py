from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db, AuditEvent
from ..security import get_current_user, User
from ..portainer_service import portainer_service
from pydantic import BaseModel

router = APIRouter(prefix="/containers", tags=["Containers"])

class ActionRequest(BaseModel):
    action: str  # start, stop, restart

@router.get("")
async def list_containers(current_user: User = Depends(get_current_user)):
    return await portainer_service.list_containers()

@router.get("/stacks")
async def list_stacks(current_user: User = Depends(get_current_user)):
    return await portainer_service.list_stacks()

@router.get("/{container_id}/logs")
async def get_container_logs(
    container_id: str,
    tail: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user)
):
    return {"id": container_id, "logs": await portainer_service.get_container_logs(container_id, tail=tail)}

@router.post("/{container_id}/action")
async def perform_container_action(
    container_id: str,
    payload: ActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await portainer_service.perform_container_action(container_id, payload.action)
    
    audit = AuditEvent(
        level="INFO" if res["success"] else "ERROR",
        source="CONTAINER",
        message=f"Action '{payload.action}' on container '{container_id}': {res['message']}",
        user=current_user.username
    )
    db.add(audit)
    db.commit()

    if not res["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res["message"])

    return res
