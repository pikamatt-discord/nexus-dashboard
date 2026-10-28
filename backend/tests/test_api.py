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
    # ensure default admin exists
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

def test_unauthenticated_access_denied():
    res = client.get("/api/v1/system/metrics")
    assert res.status_code == 401

def test_auth_login_success_and_failure():
    # Invalid password
    res = client.post("/api/v1/auth/login", data={"username": "admin", "password": "wrongpassword"})
    assert res.status_code == 401

    # Valid password
    headers = get_auth_header()
    assert "Authorization" in headers

def test_read_users_me():
    headers = get_auth_header()
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["username"] == "admin"

def test_system_metrics_history():
    headers = get_auth_header()
    res = client.get("/api/v1/system/metrics", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "cpu" in data
    assert "host_info" in data
    assert "os_name" in data["host_info"]

    hist_res = client.get("/api/v1/system/metrics/history?limit=10", headers=headers)
    assert hist_res.status_code == 200
    assert isinstance(hist_res.json(), list)

def test_containers_endpoints():
    headers = get_auth_header()
    
    # List containers
    res = client.get("/api/v1/containers", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # List stacks
    stacks_res = client.get("/api/v1/containers/stacks", headers=headers)
    assert stacks_res.status_code == 200

    # Get container logs
    logs_res = client.get("/api/v1/containers/a1b2c3d4e5f6/logs?tail=50", headers=headers)
    assert logs_res.status_code == 200
    assert "logs" in logs_res.json()

    # Disallowed action
    disallowed_res = client.post("/api/v1/containers/a1b2c3d4e5f6/action", json={"action": "rm"}, headers=headers)
    assert disallowed_res.status_code == 400

def test_network_and_ping():
    headers = get_auth_header()
    
    # Interfaces
    if_res = client.get("/api/v1/network/interfaces", headers=headers)
    assert if_res.status_code == 200
    assert "interfaces" in if_res.json()

    # Ping endpoint
    ping_res = client.post("/api/v1/network/ping", json={"name": "Test", "url": "https://httpbin.org/status/200"}, headers=headers)
    assert ping_res.status_code == 200
    assert "reachable" in ping_res.json()

def test_storage_mounts():
    headers = get_auth_header()
    res = client.get("/api/v1/storage/mounts", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_backups_jobs_and_history():
    headers = get_auth_header()
    
    # Jobs list
    jobs_res = client.get("/api/v1/backups/jobs", headers=headers)
    assert jobs_res.status_code == 200
    assert len(jobs_res.json()) >= 3

    # Unknown job ID
    err_run = client.post("/api/v1/backups/jobs/unknown_job/run", headers=headers)
    assert err_run.status_code == 404

    # Valid job run
    run_res = client.post("/api/v1/backups/jobs/database_backup/run", headers=headers)
    assert run_res.status_code == 200
    assert run_res.json()["status"] == "SUCCESS"

    # History
    hist_res = client.get("/api/v1/backups/history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()) > 0

def test_events_filtering():
    headers = get_auth_header()
    res = client.get("/api/v1/events?level=INFO&source=BACKUP", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
