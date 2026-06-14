"""AMFQUEST backend regression tests – iteration 3.

Covers:
- 48h trial on registration
- PUT /auth/email, /auth/password
- DELETE /auth/me
- POST /subscription/cancel
- POST /sessions/reset (global + per theme)
- Sessions: training count 100 (cap retiré), exam = 120 questions / 7200s
- Expired trial / no sub -> 402 on /sessions/start
- No more freemium (2 free themes pour anonymous categories still exposed via is_free_theme historique mais is_locked basé sur premium)
"""
import os
import time
from datetime import datetime, timezone, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "http://localhost:8001"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@amfquest.fr"
ADMIN_PASSWORD = "Admin1234!"
TEST_PASSWORD = "Test1234!"
PREMIUM_THEME = "cat-a-blanchiment-dargent"


def _fresh_email(tag: str) -> str:
    return f"test_{tag}_{int(time.time()*1000)}@amfquest.fr"


def _register(email: str, password: str = TEST_PASSWORD):
    r = requests.post(f"{API}/auth/register",
                      json={"email": email, "password": password, "name": "Test"})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _login(email: str, password: str):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password})


def _h(tok: str):
    return {"Authorization": f"Bearer {tok}"}


@pytest.fixture(scope="module")
def admin_token():
    r = _login(ADMIN_EMAIL, ADMIN_PASSWORD)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def trial_user():
    email = _fresh_email("trial")
    tok = _register(email)
    return {"email": email, "password": TEST_PASSWORD, "token": tok}


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("ok") is True


# ---------- 48h trial on register ----------
def test_register_grants_48h_trial():
    email = _fresh_email("48h")
    tok = _register(email)
    r = requests.get(f"{API}/auth/me", headers=_h(tok))
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == email
    assert body.get("subscription_active") is True
    trial = body.get("trial_until")
    assert trial, "trial_until missing on /me"
    tu = datetime.fromisoformat(trial)
    if tu.tzinfo is None:
        tu = tu.replace(tzinfo=timezone.utc)
    delta = tu - datetime.now(timezone.utc)
    # ~48h ± 5 min tolerance
    assert timedelta(hours=47, minutes=55) < delta < timedelta(hours=48, minutes=5), \
        f"trial_until delta = {delta}"


# ---------- /trial-pitch context: inscription page mentions 48h (only frontend) ----------


# ---------- PUT /auth/email ----------
def test_change_email_flow():
    email = _fresh_email("email1")
    tok = _register(email)
    # wrong password
    r = requests.put(f"{API}/auth/email", headers=_h(tok),
                     json={"email": _fresh_email("email1b"), "password": "BadPass1!"})
    assert r.status_code == 401

    # success
    new_email = _fresh_email("email1c")
    r = requests.put(f"{API}/auth/email", headers=_h(tok),
                     json={"email": new_email, "password": TEST_PASSWORD})
    assert r.status_code == 200, r.text
    assert r.json()["email"] == new_email
    # /me shows new email
    r = requests.get(f"{API}/auth/me", headers=_h(tok))
    assert r.json()["email"] == new_email

    # email already used (register another, then try to take it)
    other_email = _fresh_email("email1d")
    _register(other_email)
    r = requests.put(f"{API}/auth/email", headers=_h(tok),
                     json={"email": other_email, "password": TEST_PASSWORD})
    assert r.status_code == 400


# ---------- PUT /auth/password ----------
def test_change_password_flow():
    email = _fresh_email("pwd")
    tok = _register(email)
    new_pwd = "Brand1New!"
    r = requests.put(f"{API}/auth/password", headers=_h(tok),
                     json={"current_password": TEST_PASSWORD, "new_password": new_pwd})
    assert r.status_code == 200, r.text
    # old password no longer works
    r = _login(email, TEST_PASSWORD)
    assert r.status_code == 401
    # new password works
    r = _login(email, new_pwd)
    assert r.status_code == 200


# ---------- POST /subscription/cancel ----------
def test_cancel_subscription_clears_trial():
    email = _fresh_email("cancel")
    tok = _register(email)
    # active before
    r = requests.get(f"{API}/auth/me", headers=_h(tok))
    assert r.json()["subscription_active"] is True
    # cancel
    r = requests.post(f"{API}/subscription/cancel", headers=_h(tok))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("subscription_until") in (None, "")
    assert body.get("trial_until") in (None, "")
    assert body.get("subscription_active") is False
    # /me confirms
    r = requests.get(f"{API}/auth/me", headers=_h(tok))
    assert r.json()["subscription_active"] is False


# ---------- DELETE /auth/me ----------
def test_delete_account_flow():
    email = _fresh_email("del")
    tok = _register(email)
    # wrong password
    r = requests.request("DELETE", f"{API}/auth/me", headers=_h(tok),
                         json={"password": "Wrong1!"})
    assert r.status_code == 401
    # success
    r = requests.request("DELETE", f"{API}/auth/me", headers=_h(tok),
                         json={"password": TEST_PASSWORD})
    assert r.status_code == 200, r.text
    # /me must now fail (user gone -> 401)
    r = requests.get(f"{API}/auth/me", headers=_h(tok))
    assert r.status_code in (401, 404)


def test_admin_cannot_delete_self(admin_token):
    r = requests.request("DELETE", f"{API}/auth/me", headers=_h(admin_token),
                         json={"password": ADMIN_PASSWORD})
    assert r.status_code == 403


# ---------- POST /sessions/reset ----------
def test_reset_history_global_and_by_theme(trial_user):
    tok = trial_user["token"]
    # start 2 sessions on 2 different themes
    r1 = requests.post(f"{API}/sessions/start", headers=_h(tok),
                       json={"mode": "training", "category": PREMIUM_THEME, "count": 5})
    assert r1.status_code == 200, r1.text
    other_theme = "cat-a-deontologie-et-conformite"
    r2 = requests.post(f"{API}/sessions/start", headers=_h(tok),
                       json={"mode": "training", "category": other_theme, "count": 5})
    assert r2.status_code == 200, r2.text

    # reset only PREMIUM_THEME
    r = requests.post(f"{API}/sessions/reset", headers=_h(tok),
                      json={"theme": PREMIUM_THEME})
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["deleted"] >= 1

    # other theme session must remain
    r = requests.get(f"{API}/sessions", headers=_h(tok))
    assert r.status_code == 200
    history = r.json()
    remaining_cats = {s.get("category") for s in history}
    assert other_theme in remaining_cats
    assert PREMIUM_THEME not in remaining_cats

    # global reset
    r = requests.post(f"{API}/sessions/reset", headers=_h(tok), json={})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    r = requests.get(f"{API}/sessions", headers=_h(tok))
    assert r.json() == []

    # second global reset -> deleted == 0
    r = requests.post(f"{API}/sessions/reset", headers=_h(tok), json={})
    assert r.status_code == 200
    assert r.json()["deleted"] == 0


# ---------- Sessions: cap retiré, training count 100 ----------
def test_training_count_100_no_cap(trial_user):
    tok = trial_user["token"]
    r = requests.post(f"{API}/sessions/start", headers=_h(tok),
                      json={"mode": "training", "category": PREMIUM_THEME, "count": 100})
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data["questions"]) == 100
    # options stripped + correct_index hidden
    for q in data["questions"]:
        assert len(q["options"]) == 3
        assert "correct_index" not in q


# ---------- Exam 120 questions / 7200s ----------
def test_exam_120_questions_7200s(trial_user):
    tok = trial_user["token"]
    r = requests.post(f"{API}/sessions/start", headers=_h(tok),
                      json={"mode": "exam"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total"] == 120
    assert len(data["questions"]) == 120
    assert data["duration_seconds"] == 7200, f"got duration_seconds={data['duration_seconds']}"


# ---------- Expired trial / no sub -> 402 ----------
def test_expired_trial_blocks_sessions():
    """Force expire by canceling, then /sessions/start must return 402."""
    email = _fresh_email("expired")
    tok = _register(email)
    # cancel removes trial entirely
    r = requests.post(f"{API}/subscription/cancel", headers=_h(tok))
    assert r.status_code == 200
    # any /sessions/start now must 402
    r = requests.post(f"{API}/sessions/start", headers=_h(tok),
                      json={"mode": "training", "category": PREMIUM_THEME, "count": 10})
    assert r.status_code == 402, r.text
    detail = r.json().get("detail", "").lower()
    assert ("essai" in detail) or ("premium" in detail) or ("expir" in detail)

    # exam mode same result
    r = requests.post(f"{API}/sessions/start", headers=_h(tok), json={"mode": "exam"})
    assert r.status_code == 402


# ---------- Trial user can access all themes (no more freemium) ----------
def test_trial_user_can_access_all_themes(trial_user):
    tok = trial_user["token"]
    r = requests.get(f"{API}/categories", headers=_h(tok))
    assert r.status_code == 200
    cats = r.json()
    assert len(cats) == 15
    # trial user has active sub -> nothing should be locked
    locked = [c for c in cats if c.get("is_locked")]
    assert locked == [], f"trial user sees locked themes: {[c['key'] for c in locked]}"


# ---------- Admin still works ----------
def test_admin_me_premium(admin_token):
    r = requests.get(f"{API}/auth/me", headers=_h(admin_token))
    assert r.status_code == 200
    assert r.json()["subscription_active"] is True
