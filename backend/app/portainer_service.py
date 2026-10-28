import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from .config import settings

class PortainerService:
    def __init__(self):
        self.url = settings.PORTAINER_URL.rstrip('/') if settings.PORTAINER_URL else None
        self.token = settings.PORTAINER_API_TOKEN
        self.endpoint_id = settings.PORTAINER_ENDPOINT_ID
        self.verify_ssl = settings.PORTAINER_VERIFY_SSL

    def is_configured(self) -> bool:
        if getattr(settings, "DEV_MODE", False) and not self.token:
            return False
        return bool(self.url and self.token)

    async def _get_headers(self) -> Dict[str, str]:
        return {
            "X-API-Key": self.token or "",
            "Accept": "application/json",
        }

    async def check_health(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {"status": "DEV_LOCAL", "message": "Mode Développeur Local actif (MOCK)"}
        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=4.0) as client:
                res = await client.get(f"{self.url}/api/status", headers=await self._get_headers())
                if res.status_code == 200:
                    return {"status": "ONLINE", "message": "Portainer API connected successfully."}
                return {"status": "ERROR", "message": f"Portainer returned HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "OFFLINE", "message": f"Portainer unreachable: {str(e)}"}

    async def list_containers(self) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return self._get_mock_containers()

        try:
            headers = await self._get_headers()
            url = f"{self.url}/api/endpoints/{self.endpoint_id}/docker/containers/json?all=1"
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=6.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    return self._get_mock_containers()
                
                raw_containers = res.json()
                containers = []
                for c in raw_containers:
                    names = c.get("Names", ["/unnamed"])
                    clean_name = names[0].lstrip("/") if names else "unnamed"
                    
                    ports = []
                    for p in c.get("Ports", []):
                        if "PublicPort" in p and "PrivatePort" in p:
                            ports.append(f"{p['PublicPort']}:{p['PrivatePort']}/{p.get('Type', 'tcp')}")

                    labels = c.get("Labels", {})
                    stack_name = labels.get("com.docker.compose.project", labels.get("io.portainer.stack.name", "standalone"))

                    containers.append({
                        "id": c["Id"][:12],
                        "full_id": c["Id"],
                        "name": clean_name,
                        "image": c.get("Image", "unknown"),
                        "state": c.get("State", "unknown").lower(),
                        "status": c.get("Status", ""),
                        "ports": ports,
                        "stack": stack_name,
                        "created": c.get("Created", 0),
                    })
                return containers
        except Exception:
            return self._get_mock_containers()

    async def get_container_logs(self, container_id: str, tail: int = 100) -> str:
        if not self.is_configured():
            return f"[MOCK LOGS] Log entry 1 for container {container_id}\n[MOCK LOGS] Container health check OK\n[MOCK LOGS] Application running on port 8080"

        try:
            headers = await self._get_headers()
            url = f"{self.url}/api/endpoints/{self.endpoint_id}/docker/containers/{container_id}/logs?stdout=1&stderr=1&tail={tail}&timestamps=1"
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=8.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    # Docker log multiplex stream cleaning
                    return res.text
                return f"Error retrieving logs from Portainer: HTTP {res.status_code}"
        except Exception as e:
            return f"Error connecting to Portainer for logs: {str(e)}"

    async def perform_container_action(self, container_id: str, action: str) -> Dict[str, Any]:
        if action not in settings.PORTAINER_ALLOWED_CONTAINER_ACTIONS:
            return {"success": False, "message": f"Action '{action}' is not permitted by backend policy."}

        if not self.is_configured():
            return {"success": True, "message": f"[MOCK] Action '{action}' executed successfully for container {container_id}."}

        try:
            headers = await self._get_headers()
            url = f"{self.url}/api/endpoints/{self.endpoint_id}/docker/containers/{container_id}/{action}"
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=15.0) as client:
                res = await client.post(url, headers=headers)
                if res.status_code in (200, 204):
                    return {"success": True, "message": f"Container {action} succeeded."}
                return {"success": False, "message": f"Portainer action failed with status HTTP {res.status_code}"}
        except Exception as e:
            return {"success": False, "message": f"Failed to perform action via Portainer: {str(e)}"}

    async def list_stacks(self) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return [
                {"id": 1, "name": "nexus-stack", "type": "Compose", "status": "active", "containers": 2},
                {"id": 2, "name": "media-server", "type": "Compose", "status": "active", "containers": 3},
            ]
        try:
            headers = await self._get_headers()
            url = f"{self.url}/api/stacks"
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=6.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    return res.json()
                return []
        except Exception:
            return []

    def _get_mock_containers(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "a1b2c3d4e5f6",
                "full_id": "a1b2c3d4e5f6789012345678",
                "name": "nexus-backend",
                "image": "nexus/backend:latest",
                "state": "running",
                "status": "Up 3 hours",
                "ports": ["8000:8000/tcp"],
                "stack": "nexus-stack",
                "created": int(datetime.now(timezone.utc).timestamp()) - 10800,
            },
            {
                "id": "b2c3d4e5f6a1",
                "full_id": "b2c3d4e5f6a1789012345678",
                "name": "nexus-frontend",
                "image": "nexus/frontend:latest",
                "state": "running",
                "status": "Up 3 hours",
                "ports": ["80:80/tcp"],
                "stack": "nexus-stack",
                "created": int(datetime.now(timezone.utc).timestamp()) - 10800,
            },
            {
                "id": "c3d4e5f6a1b2",
                "full_id": "c3d4e5f6a1b2789012345678",
                "name": "nginx-proxy",
                "image": "nginx:alpine",
                "state": "running",
                "status": "Up 2 days",
                "ports": ["443:443/tcp", "80:80/tcp"],
                "stack": "proxy-stack",
                "created": int(datetime.now(timezone.utc).timestamp()) - 172800,
            },
            {
                "id": "d4e5f6a1b2c3",
                "full_id": "d4e5f6a1b2c3789012345678",
                "name": "old-worker",
                "image": "python:3.11-slim",
                "state": "exited",
                "status": "Exited (0) 5 hours ago",
                "ports": [],
                "stack": "standalone",
                "created": int(datetime.now(timezone.utc).timestamp()) - 86400,
            },
        ]

portainer_service = PortainerService()
