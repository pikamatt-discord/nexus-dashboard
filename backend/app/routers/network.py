import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..security import get_current_user, User
from ..system_service import get_system_metrics

router = APIRouter(prefix="/network", tags=["Network"])

class PingTarget(BaseModel):
    name: str
    url: str

@router.get("/interfaces")
def get_network_interfaces(current_user: User = Depends(get_current_user)):
    metrics = get_system_metrics()
    return metrics["network"]

@router.post("/ping")
async def ping_dependency(target: PingTarget, current_user: User = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(target.url)
            return {
                "target": target.name,
                "url": target.url,
                "reachable": True,
                "status_code": res.status_code
            }
    except Exception as e:
        return {
            "target": target.name,
            "url": target.url,
            "reachable": False,
            "error": str(e)
        }
