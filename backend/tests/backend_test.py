"""AMFQUEST backend regression tests."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to internal
    BASE_URL = "http://localhost:8001"

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@amfquest.fr"
ADMIN_PASSWORD = "Admin1234!"

# Unique test user per run
TS = int(time.time())
TEST_EMAIL = f"test_user_{TS}@amfquest.fr"
TEST_PASSWORD = "Test1234!"
TEST_NAME = "Test User"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def user_token(s):
    r = s.post(f"{API}/auth/register",
               json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ---------- Categories ----------
def test_categories():
    r = requests.get(f"{API}/categories")
    assert r.status_code == 200
    cats = r.json()
    assert isinstance(cats, list)
    assert len(cats) == 12
    for c in cats:
        assert c.get("question_count", 0) > 0


# ---------- Auth ----------
def test_register_and_duplicate(s, user_token):
    # user_token fixture already created the user
    r = s.post(f"{API}/auth/register",
               json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME})
    assert r.status_code == 400
    assert "existe déjà" in r.json().get("detail", "")


def test_login_wrong_password(s):
    r = s.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": "WrongPass!"})
    assert r.status_code == 401
    assert "Identifiants invalides" in r.json().get("detail", "")


def test_login_correct(s):
    r = s.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_me_with_token(user_token):
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == TEST_EMAIL
    assert body["role"] == "user"
    assert "password_hash" not in body


def test_me_no_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_admin_role(admin_token):
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


# ---------- Contact ----------
def test_contact_create_and_admin_list(admin_token, user_token):
    r = requests.post(f"{API}/contact", json={
        "name": "Test Contact", "email": "TEST_contact@example.com",
        "subject": "Bonjour", "message": "Message test",
    })
    assert r.status_code == 200
    assert r.json().get("ok") is True

    # admin can list
    r = requests.get(f"{API}/contact", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    # non-admin gets 403
    r = requests.get(f"{API}/contact", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 403


# ---------- Sessions: training ----------
def test_training_full_flow(user_token):
    h = {"Authorization": f"Bearer {user_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h,
                      json={"mode": "training", "count": 10})
    assert r.status_code == 200
    data = r.json()
    assert data["mode"] == "training"
    assert len(data["questions"]) == 10
    # correct_index must be stripped
    for q in data["questions"]:
        assert "correct_index" not in q
        assert "options" in q
    sid = data["id"]

    # answer one question
    q0 = data["questions"][0]
    r = requests.post(f"{API}/sessions/{sid}/answer", headers=h,
                      json={"question_id": q0["id"], "selected_index": 0})
    assert r.status_code == 200

    # finish
    r = requests.post(f"{API}/sessions/{sid}/finish", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert "score" in body and "percent" in body
    assert isinstance(body["review"], list) and len(body["review"]) == 10
    assert "correct_index" in body["review"][0]
    assert "explanation" in body["review"][0]


# ---------- Sessions: exam ----------
def test_exam_session(user_token):
    h = {"Authorization": f"Bearer {user_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h, json={"mode": "exam"})
    assert r.status_code == 200
    data = r.json()
    assert len(data["questions"]) == 120
    assert data["duration_seconds"] == 5400


# ---------- Sessions list isolation ----------
def test_sessions_list_isolation(user_token, admin_token):
    r = requests.get(f"{API}/sessions", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    user_sess = r.json()
    assert isinstance(user_sess, list)
    # user should have at least 2 (training + exam)
    assert len(user_sess) >= 2

    r = requests.get(f"{API}/sessions", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    admin_sess = r.json()
    # cross-user leak check
    user_ids = {s_["id"] for s_ in user_sess}
    admin_ids = {s_["id"] for s_ in admin_sess}
    assert user_ids.isdisjoint(admin_ids)


# ---------- Stats ----------
def test_stats(user_token):
    r = requests.get(f"{API}/stats", headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    body = r.json()
    assert "total_sessions" in body
    assert "last_sessions" in body
    assert body["total_sessions"] >= 1
