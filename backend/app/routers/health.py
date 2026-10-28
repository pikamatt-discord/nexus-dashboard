from fastapi import APIRouter
from datetime import datetime, timezone
from ..portainer_service import portainer_service

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def health_check():
    portainer_health = await portainer_service.check_health()
    return {
        "status": "HEALTHY",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "backend": "ONLINE",
            "portainer": portainer_health["status"],
            "portainer_message": portainer_health["message"]
        }
    }
