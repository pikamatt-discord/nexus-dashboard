from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nexus Dashboard"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretnexuskey_change_me_in_production_123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Mode de développement local
    DEV_MODE: bool = True  # Mode simulation locale automatique (sans besoin de Portainer)
    
    # LAN Security
    ALLOWED_LAN_SUBNETS: str = "127.0.0.1/32,192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,::1/128"
    ENFORCE_LAN_ONLY: bool = False  # Set True in production to reject WAN IP calls
    
    # Portainer Settings
    PORTAINER_URL: Optional[str] = "http://localhost:9000"
    PORTAINER_API_TOKEN: Optional[str] = None
    PORTAINER_ENDPOINT_ID: int = 1
    PORTAINER_VERIFY_SSL: bool = True
    PORTAINER_ALLOWED_CONTAINER_ACTIONS: List[str] = ["start", "stop", "restart"]
    
    # Storage & Monitoring
    CPU_WARNING_THRESHOLD: float = 85.0
    RAM_WARNING_THRESHOLD: float = 85.0
    DISK_WARNING_THRESHOLD: float = 80.0
    DISK_CRITICAL_THRESHOLD: float = 90.0
    
    # Admin User Default
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"  # Will be hashed
    
    # Backup
    BACKUP_STORAGE_PATH: str = "/var/backups/nexus"
    
    # Database
    DATABASE_URL: str = "sqlite:///./nexus.db"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
