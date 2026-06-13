"""AMFQUEST backend regression tests (iteration 2: freemium + Stripe)."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "http://localhost:8001"

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@amfquest.fr"
ADMIN_PASSWORD = "Admin1234!"

TS = int(time.time())
TEST_EMAIL = f"test_user_{TS}@amfquest.fr"
TEST_PASSWORD = "Test1234!"
TEST_NAME = "Test User"

FREE_THEME_KEYS = {"cat-a-deontologie-et-conformite", "cat-c-cadre-institutionnel-reglementaire"}
PREMIUM_THEME_EXAMPLE = "cat-a-blanchiment-dargent"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def user_token(s):
    r = s.post(f"{API}/auth/register",
               json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


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
def test_categories_anonymous_15_themes():
    r = requests.get(f"{API}/categories")
    assert r.status_code == 200
    cats = r.json()
    assert isinstance(cats, list)
    assert len(cats) == 15, f"expected 15 themes, got {len(cats)}"
    free_themes = [c for c in cats if c["is_free_theme"]]
    assert len(free_themes) == 2
    free_keys = {c["key"] for c in free_themes}
    assert free_keys == FREE_THEME_KEYS
    # Anonymous: premium themes are locked, free themes unlocked
    for c in cats:
        assert c["question_count"] > 0
        if c["is_free_theme"]:
            assert c["free_count"] == 25, f"{c['key']} free_count={c['free_count']}"
            assert c["is_locked"] is False
        else:
            assert c["is_locked"] is True


def test_categories_free_user_locks_premium(user_token):
    r = requests.get(f"{API}/categories",
                     headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    cats = r.json()
    for c in cats:
        if c["key"] in FREE_THEME_KEYS:
            assert c["is_locked"] is False
        else:
            assert c["is_locked"] is True


def test_categories_admin_all_unlocked(admin_token):
    r = requests.get(f"{API}/categories",
                     headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    cats = r.json()
    for c in cats:
        assert c["is_locked"] is False, f"{c['key']} still locked for admin"


# ---------- /me with subscription fields ----------
def test_me_has_subscription_fields(user_token):
    r = requests.get(f"{API}/auth/me",
                     headers={"Authorization": f"Bearer {user_token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == TEST_EMAIL
    assert "subscription_active" in body
    assert "subscription_until" in body
    assert body["subscription_active"] is False


def test_me_admin_subscription_active(admin_token):
    r = requests.get(f"{API}/auth/me",
                     headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["subscription_active"] is True


# ---------- Sessions paywall ----------
def test_start_session_premium_theme_blocked_for_free(user_token):
    h = {"Authorization": f"Bearer {user_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h,
                      json={"mode": "training", "category": PREMIUM_THEME_EXAMPLE, "count": 10})
    assert r.status_code == 402
    detail = r.json().get("detail", "")
    assert "Premium" in detail


def test_start_exam_blocked_for_free(user_token):
    h = {"Authorization": f"Bearer {user_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h, json={"mode": "exam"})
    assert r.status_code == 402
    detail = r.json().get("detail", "")
    assert "examen blanc" in detail.lower() or "premium" in detail.lower()


def test_start_training_free_user_uses_free_pool(user_token):
    h = {"Authorization": f"Bearer {user_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h,
                      json={"mode": "training", "count": 50})
    assert r.status_code == 200
    data = r.json()
    # Free pool = 25+25 = 50 unique. count capped at min(50, pool) -> exactly 50
    assert len(data["questions"]) <= 50
    # Validate option array length = 3
    for q in data["questions"]:
        assert len(q["options"]) == 3
        assert "correct_index" not in q


def test_start_training_free_user_free_themes_only_allowed(user_token):
    h = {"Authorization": f"Bearer {user_token}"}
    for k in FREE_THEME_KEYS:
        r = requests.post(f"{API}/sessions/start", headers=h,
                         json={"mode": "training", "category": k, "count": 10})
        assert r.status_code == 200, f"{k}: {r.text}"
        assert len(r.json()["questions"]) == 10


# ---------- Reveal question (training mode) ----------
def test_finish_question_reveal_training(user_token):
    h = {"Authorization": f"Bearer {user_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h,
                      json={"mode": "training", "count": 5})
    assert r.status_code == 200
    sess = r.json()
    sid = sess["id"]
    qid = sess["questions"][0]["id"]
    r = requests.post(f"{API}/sessions/{sid}/finish-question", headers=h,
                      json={"question_id": qid})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "correct_index" in body
    assert "explanation" in body
    assert "source" in body
    assert body["question_id"] == qid


def test_finish_question_blocked_in_exam(admin_token):
    # admin is premium, so exam mode is allowed
    h = {"Authorization": f"Bearer {admin_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h, json={"mode": "exam"})
    assert r.status_code == 200
    sess = r.json()
    sid = sess["id"]
    qid = sess["questions"][0]["id"]
    r = requests.post(f"{API}/sessions/{sid}/finish-question", headers=h,
                     json={"question_id": qid})
    assert r.status_code == 400


# ---------- Admin (premium) exam flow ----------
def test_admin_exam_120_questions(admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h, json={"mode": "exam"})
    assert r.status_code == 200
    data = r.json()
    assert len(data["questions"]) == 120
    assert data["duration_seconds"] == 5400


def test_admin_premium_theme_allowed(admin_token):
    h = {"Authorization": f"Bearer {admin_token}"}
    r = requests.post(f"{API}/sessions/start", headers=h,
                     json={"mode": "training", "category": PREMIUM_THEME_EXAMPLE, "count": 10})
    assert r.status_code == 200
    assert len(r.json()["questions"]) == 10


# ---------- Subscription checkout ----------
def test_subscription_checkout_returns_stripe_url(user_token):
    h = {"Authorization": f"Bearer {user_token}"}
    r = requests.post(f"{API}/subscription/checkout", headers=h,
                      json={"origin_url": BASE_URL})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "url" in body and body["url"].startswith("https://")
    assert "session_id" in body and len(body["session_id"]) > 5


def test_subscription_checkout_requires_auth():
    r = requests.post(f"{API}/subscription/checkout",
                      json={"origin_url": BASE_URL})
    assert r.status_code in (401, 403)


# ---------- Existing flows still work ----------
def test_register_duplicate(s):
    r = s.post(f"{API}/auth/register",
              json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME})
    assert r.status_code == 400


def test_login_wrong_password(s):
    r = s.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": "WrongPass!"})
    assert r.status_code == 401


def test_login_correct(s):
    r = s.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_logout_endpoint(s):
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200
    assert r.json().get("ok") is True
