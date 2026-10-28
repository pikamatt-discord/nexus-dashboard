import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db, SessionLocal, User
from backend.app.security import get_password_hash

init_db()
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    db = SessionLocal()
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(username="admin", hashed_password=get_password_hash("admin123"))
        db.add(admin)
        db.commit()
    db.close()

def get_auth_header():
    res = client.post("/api/v1/auth/login", data={"username": "admin", "password": "admin123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_browse_files():
    headers = get_auth_header()
    res = client.get("/api/v1/files/browse?path=./backend", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "current_path" in data
    assert "items" in data
    assert isinstance(data["items"], list)

def test_read_file_content():
    headers = get_auth_header()
    res = client.get("/api/v1/files/content?path=./backend/requirements.txt", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "content" in data
    assert "fastapi" in data["content"]
