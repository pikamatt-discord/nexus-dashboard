import pytest
from datetime import timedelta
from backend.app.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    is_ip_allowed,
)
from backend.app.config import settings
from jose import jwt

def test_password_hashing():
    password = "MySecurePassword123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token():
    data = {"sub": "testuser"}
    token = create_access_token(data, expires_delta=timedelta(minutes=10))
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["sub"] == "testuser"

def test_lan_ip_allowed(monkeypatch):
    monkeypatch.setattr(settings, "ENFORCE_LAN_ONLY", True)
    assert is_ip_allowed("127.0.0.1") is True
    assert is_ip_allowed("192.168.1.50") is True
    assert is_ip_allowed("10.0.0.15") is True
    assert is_ip_allowed("8.8.8.8") is False
