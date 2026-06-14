from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import stripe
import os
import csv
import uuid
import logging
import random
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    get_current_user,
)
from seed_data import (
    THEMES, FREE_THEME_KEYS, FREE_QUESTIONS_PER_THEME,
    PREMIUM_PRICE_EUR, PREMIUM_DURATION_DAYS, TRIAL_DURATION_HOURS,
    get_theme_by_csv, get_theme_by_key,
)

# from emergentintegrations.payments.stripe.checkout import (
#    StripeCheckout, CheckoutSessionRequest,
# )

import asyncio
import resend

# ------------- DB --------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ------------- App --------------
app = FastAPI(title="AMFQUEST API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("amfquest")


# ------------- Helpers --------------
LETTER_TO_IDX = {"A": 0, "B": 1, "C": 2}


def has_active_subscription(user: dict) -> bool:
    if not user:
        return False
    if user.get("role") == "admin":
        return True
    until = user.get("subscription_until")
    if not until:
        return False
    try:
        dt = datetime.fromisoformat(until)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt > datetime.now(timezone.utc)
    except Exception:
        return False


def csv_label_to_theme_key(csv_label: str) -> Optional[str]:
    t = get_theme_by_csv(csv_label)
    return t["key"] if t else None


async def seed_questions_from_csv():
    """Idempotently load CSV questions into MongoDB on startup."""
    csv_path = ROOT_DIR / "data" / "questions.csv"
    if not csv_path.exists():
        logger.warning("questions.csv not found")
        return
    existing = await db.questions.count_documents({})
    if existing >= 2000:
        logger.info("Questions already seeded (%d)", existing)
        return
    await db.questions.delete_many({})
    docs = []
    free_per_theme_assigned = {k: 0 for k in FREE_THEME_KEYS}
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            theme_key = csv_label_to_theme_key(row["categorie"])
            if not theme_key:
                continue
            options = [row["A"], row["B"], row["C"]]
            ci = LETTER_TO_IDX.get(row["bonne_reponse"])
            if ci is None:
                continue
            qid = hashlib.sha1((row["categorie"] + "|" + row["question"]).encode("utf-8")).hexdigest()
            # Mark first N questions of free themes as is_free=True
            is_free = False
            if theme_key in FREE_THEME_KEYS and free_per_theme_assigned[theme_key] < FREE_QUESTIONS_PER_THEME:
                is_free = True
                free_per_theme_assigned[theme_key] += 1
            docs.append({
                "id": qid,
                "theme_key": theme_key,
                "csv_label": row["categorie"],
                "text": row["question"],
                "options": options,
                "correct_index": ci,
                "explanation": row.get("commentaire", ""),
                "source": row.get("source", ""),
                "is_free": is_free,
            })
    if docs:
        # insert in chunks
        for i in range(0, len(docs), 500):
            await db.questions.insert_many(docs[i:i + 500])
    logger.info("Seeded %d questions (%d free)", len(docs), sum(d["is_free"] for d in docs))


# ------------- Models --------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = None
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class AnswerIn(BaseModel):
    question_id: str
    selected_index: int


class CheckoutIn(BaseModel):
    origin_url: str


# ------------- Auth dependency --------------
async def current_user(request: Request):
    return await get_current_user(request, db)


def _set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False,
                        samesite="lax", max_age=60 * 60 * 12, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False,
                        samesite="lax", max_age=60 * 60 * 24 * 7, path="/")


def _user_payload(user: dict) -> dict:
    now = datetime.now(timezone.utc)
    trial_until = user.get("trial_until")
    trial_active = False
    if trial_until:
        try:
            tu = datetime.fromisoformat(trial_until)
            if tu.tzinfo is None:
                tu = tu.replace(tzinfo=timezone.utc)
            trial_active = tu > now
        except Exception:
            trial_active = False
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "user"),
        "subscription_active": has_active_subscription(user),
        "subscription_until": user.get("subscription_until"),
        "trial_active": trial_active,
        "trial_until": trial_until,
    }


# ------------- Auth routes --------------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email")
    user_id = str(uuid.uuid4())
    trial_until = (datetime.now(timezone.utc) + timedelta(hours=TRIAL_DURATION_HOURS)).isoformat()
    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": "user",
        "subscription_until": trial_until,
        "trial_used": True,
        "trial_until": trial_until,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    _set_auth_cookies(response, access, refresh)
    return {**_user_payload(user_doc), "access_token": access}


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    _set_auth_cookies(response, access, refresh)
    return {**_user_payload(user), "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(request: Request):
    user = await get_current_user(request, db)
    return _user_payload(user)


class ChangeEmailIn(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class DeleteAccountIn(BaseModel):
    password: str


@api.put("/auth/email")
async def change_email(payload: ChangeEmailIn, user=Depends(current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(payload.password, full["password_hash"]):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    new_email = payload.email.lower()
    if new_email == full["email"]:
        return _user_payload(full)
    existing = await db.users.find_one({"email": new_email})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    await db.users.update_one({"id": user["id"]}, {"$set": {"email": new_email}})
    full["email"] = new_email
    return _user_payload(full)


@api.put("/auth/password")
async def change_password(payload: ChangePasswordIn, user=Depends(current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(payload.current_password, full["password_hash"]):
        raise HTTPException(status_code=401, detail="Mot de passe actuel incorrect")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(payload.new_password)}},
    )
    return {"ok": True}


@api.delete("/auth/me")
async def delete_account(payload: DeleteAccountIn, response: Response, user=Depends(current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(payload.password, full["password_hash"]):
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    if full.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Le compte administrateur ne peut pas être supprimé")
    await db.sessions.delete_many({"user_id": user["id"]})
    await db.payment_transactions.delete_many({"user_id": user["id"]})
    await db.users.delete_one({"id": user["id"]})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.post("/subscription/cancel")
async def cancel_subscription(user=Depends(current_user)):
    """Met fin immédiatement à l'abonnement Premium (essai ou payant)."""
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"subscription_until": None, "trial_until": None}},
    )
    full = await db.users.find_one({"id": user["id"]})
    return _user_payload(full)


@api.post("/sessions/reset")
async def reset_history(body: dict | None = None, user=Depends(current_user)):
    """Supprime l'historique de sessions. Si theme fourni, ne supprime que celles du thème."""
    body = body or {}
    theme = body.get("theme")
    query: dict = {"user_id": user["id"]}
    if theme:
        query["category"] = theme
    result = await db.sessions.delete_many(query)
    return {"ok": True, "deleted": result.deleted_count}


# ------------- Contact --------------
@api.post("/contact")
async def create_contact(payload: ContactIn):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "phone": (payload.phone or "").strip(),
        "subject": payload.subject.strip(),
        "message": payload.message.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contacts.insert_one(doc)

    await _send_email(
        os.environ.get("CONTACT_RECEIVER_EMAIL", "contact@amfquest.fr"),
        f"Nouveau message AMFQUEST - {doc['subject']}",
        f"""
        <h2>Nouveau message depuis AMFQUEST</h2>
        <p><b>Nom :</b> {doc['name']}</p>
        <p><b>Email :</b> {doc['email']}</p>
        <p><b>Téléphone :</b> {doc['phone']}</p>
        <p><b>Sujet :</b> {doc['subject']}</p>
        <p><b>Message :</b></p>
        <p>{doc['message']}</p>
        """
    )

return {"ok": True, "id": doc["id"]}


@api.get("/contact")
async def list_contacts(user=Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès interdit")
    cursor = db.contacts.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


# ------------- Categories / Themes --------------
@api.get("/categories")
async def categories(request: Request):
    user = None
    try:
        user = await get_current_user(request, db)
    except HTTPException:
        user = None
    is_premium = has_active_subscription(user) if user else False
    res = []
    for t in THEMES:
        total = await db.questions.count_documents({"theme_key": t["key"]})
        free_n = await db.questions.count_documents({"theme_key": t["key"], "is_free": True})
        res.append({
            **t,
            "question_count": total,
            "free_count": free_n,
            "is_free_theme": t["key"] in FREE_THEME_KEYS,
            "is_locked": (t["key"] not in FREE_THEME_KEYS) and not is_premium,
        })
    return res


# ------------- Subscription / Stripe --------------
@api.post("/subscription/checkout")
async def create_checkout(payload: CheckoutIn, user=Depends(current_user)):
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe non configuré")

    stripe.api_key = api_key

    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/paiement-succes?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/abonnement"

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        customer_email=user["email"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": "AMFQUEST Premium - 30 jours",
                },
                "unit_amount": round(float(PREMIUM_PRICE_EUR) * 100),
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "user_email": user["email"],
            "product": "amfquest_premium_30d",
        },
    )

    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": user["id"],
        "user_email": user["email"],
        "amount": float(PREMIUM_PRICE_EUR),
        "currency": "eur",
        "payment_status": "pending",
        "status": "open",
        "metadata": {"product": "amfquest_premium_30d"},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.id}

@api.get("/subscription/status/{session_id}")
async def subscription_status(session_id: str, user=Depends(current_user)):
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Stripe non configuré")

    stripe.api_key = api_key

    tx = await db.payment_transactions.find_one({
        "session_id": session_id,
        "user_id": user["id"]
    })

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")

    if tx.get("payment_status") == "paid":
        u = await db.users.find_one({"id": user["id"]})
        return {
            "payment_status": "paid",
            "status": "complete",
            "subscription_until": u.get("subscription_until"),
        }

    session = stripe.checkout.Session.retrieve(session_id)

    payment_status = session.payment_status
    status = session.status

    update = {
        "payment_status": payment_status,
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    sub_until = None

    if payment_status == "paid" and tx.get("payment_status") != "paid":
        u = await db.users.find_one({"id": user["id"]})
        current = u.get("subscription_until")
        base = datetime.now(timezone.utc)

        if current:
            try:
                cur_dt = datetime.fromisoformat(current)
                if cur_dt.tzinfo is None:
                    cur_dt = cur_dt.replace(tzinfo=timezone.utc)
                if cur_dt > base:
                    base = cur_dt
            except Exception:
                pass

        new_until = (base + timedelta(days=PREMIUM_DURATION_DAYS)).isoformat()

        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"subscription_until": new_until}}
        )

        sub_until = new_until

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": update}
    )

    if sub_until is None:
        u = await db.users.find_one({"id": user["id"]})
        sub_until = u.get("subscription_until")

    return {
        "payment_status": payment_status,
        "status": status,
        "subscription_until": sub_until,
    }



@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    api_key = os.environ.get("STRIPE_API_KEY")
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    try:
        evt = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        logger.exception("Webhook error: %s", e)
        return {"received": False}
    if evt and evt.session_id and evt.payment_status == "paid":
        tx = await db.payment_transactions.find_one({"session_id": evt.session_id})
        if tx and tx.get("payment_status") != "paid":
            uid = tx.get("user_id")
            u = await db.users.find_one({"id": uid})
            if u:
                current = u.get("subscription_until")
                base = datetime.now(timezone.utc)
                if current:
                    try:
                        cur_dt = datetime.fromisoformat(current)
                        if cur_dt.tzinfo is None:
                            cur_dt = cur_dt.replace(tzinfo=timezone.utc)
                        if cur_dt > base:
                            base = cur_dt
                    except Exception:
                        pass
                new_until = (base + timedelta(days=PREMIUM_DURATION_DAYS)).isoformat()
                await db.users.update_one({"id": uid}, {"$set": {"subscription_until": new_until}})
            await db.payment_transactions.update_one(
                {"session_id": evt.session_id},
                {"$set": {"payment_status": "paid", "status": "complete",
                          "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
    return {"received": True}


# ------------- Sessions / Quiz --------------
async def _pick_questions(user: dict, mode: str, category: Optional[str], count: int) -> List[dict]:
    is_premium = has_active_subscription(user)
    if not is_premium:
        raise HTTPException(status_code=402, detail="Votre période d'essai est expirée. Passez Premium pour continuer.")
    query: dict = {}
    if category:
        query["theme_key"] = category
    pool = await db.questions.find(query).to_list(5000)
    if not pool:
        raise HTTPException(status_code=400, detail="Aucune question disponible pour cette sélection.")
    if mode == "exam":
        target = 120
    else:
        target = max(5, count)
    if len(pool) >= target:
        chosen = random.sample(pool, target)
    else:
        chosen = list(pool)
        while len(chosen) < target:
            chosen.append(random.choice(pool))
    questions = []
    for q in chosen:
        questions.append({
            "id": str(uuid.uuid4()),
            "question_id": q["id"],
            "theme": q["theme_key"],
            "text": q["text"],
            "options": q["options"],
            "correct_index": q["correct_index"],
            "explanation": q.get("explanation", ""),
            "source": q.get("source", ""),
        })
    return questions


@api.post("/sessions/start")
async def start_session(body: dict, user=Depends(current_user)):
    mode = body.get("mode", "training")
    category = body.get("category") or None
    count = int(body.get("count", 10))
    # No upper cap: caller chooses anywhere between 5 and the whole theme size.
    count = max(5, min(count, 5000))
    questions = await _pick_questions(user, mode, category, count)
    session_id = str(uuid.uuid4())
    doc = {
        "id": session_id,
        "user_id": user["id"],
        "mode": mode,
        "category": category,
        "questions": questions,
        "answers": {},
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": None,
        "score": None,
        "total": len(questions),
        "duration_seconds": 60 * 120 if mode == "exam" else None,
    }
    await db.sessions.insert_one(doc)
    safe_qs = [
        {"id": q["id"], "theme": q["theme"], "text": q["text"], "options": q["options"]}
        for q in questions
    ]
    return {
        "id": session_id, "mode": mode, "category": category,
        "questions": safe_qs, "total": len(questions),
        "duration_seconds": doc["duration_seconds"],
        "started_at": doc["started_at"],
    }


@api.post("/sessions/{session_id}/answer")
async def answer_session(session_id: str, body: AnswerIn, user=Depends(current_user)):
    sess = await db.sessions.find_one({"id": session_id, "user_id": user["id"]})
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")
    if sess.get("finished_at"):
        raise HTTPException(status_code=400, detail="Session déjà terminée")
    answers = sess.get("answers", {})
    answers[body.question_id] = body.selected_index
    await db.sessions.update_one({"id": session_id}, {"$set": {"answers": answers}})
    return {"ok": True}


@api.post("/sessions/{session_id}/finish-question")
async def reveal_question(session_id: str, body: dict, user=Depends(current_user)):
    """Reveal correct answer for a single question. Only available in training mode."""
    sess = await db.sessions.find_one({"id": session_id, "user_id": user["id"]})
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")
    if sess.get("mode") == "exam":
        raise HTTPException(status_code=400, detail="La correction n'est dévoilée qu'à la fin d'un examen blanc.")
    qid = body.get("question_id")
    for q in sess.get("questions", []):
        if q["id"] == qid:
            return {
                "question_id": qid,
                "correct_index": q["correct_index"],
                "explanation": q.get("explanation", ""),
                "source": q.get("source", ""),
            }
    raise HTTPException(status_code=404, detail="Question introuvable")


@api.post("/sessions/{session_id}/finish")
async def finish_session(session_id: str, user=Depends(current_user)):
    sess = await db.sessions.find_one({"id": session_id, "user_id": user["id"]})
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")
    answers = sess.get("answers", {})
    score = 0
    review = []
    for q in sess["questions"]:
        sel = answers.get(q["id"])
        ok = sel == q["correct_index"]
        if ok:
            score += 1
        review.append({
            "question_id": q["id"], "theme": q["theme"], "text": q["text"],
            "options": q["options"], "correct_index": q["correct_index"],
            "selected_index": sel, "is_correct": ok,
            "explanation": q.get("explanation", ""),
            "source": q.get("source", ""),
        })
    total = len(sess["questions"])
    pct = round(100 * score / total, 1) if total else 0
    passed = pct >= 80 if sess["mode"] == "exam" else None
    finished_at = datetime.now(timezone.utc).isoformat()
    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"finished_at": finished_at, "score": score, "percent": pct, "passed": passed}},
    )
    return {
        "id": session_id, "mode": sess["mode"], "category": sess.get("category"),
        "score": score, "total": total, "percent": pct, "passed": passed,
        "review": review, "finished_at": finished_at,
    }


@api.get("/sessions/{session_id}")
async def get_session_details(session_id: str, user=Depends(current_user)):
    sess = await db.sessions.find_one({"id": session_id, "user_id": user["id"]}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Session introuvable")
    if not sess.get("finished_at"):
        sess["questions"] = [
            {"id": q["id"], "theme": q["theme"], "text": q["text"], "options": q["options"]}
            for q in sess.get("questions", [])
        ]
    return sess


@api.get("/sessions")
async def list_sessions(user=Depends(current_user)):
    cursor = db.sessions.find(
        {"user_id": user["id"]},
        {"_id": 0, "questions": 0, "answers": 0},
    ).sort("started_at", -1)
    return await cursor.to_list(200)


@api.get("/stats")
async def stats(user=Depends(current_user)):
    cursor = db.sessions.find({"user_id": user["id"], "finished_at": {"$ne": None}})
    total_sessions = 0
    total_questions = 0
    total_correct = 0
    last_sessions = []
    async for s in cursor:
        total_sessions += 1
        total_questions += s.get("total", 0)
        total_correct += s.get("score", 0)
        last_sessions.append({
            "id": s["id"], "mode": s["mode"], "category": s.get("category"),
            "score": s.get("score"), "total": s.get("total"),
            "percent": s.get("percent"), "passed": s.get("passed"),
            "finished_at": s.get("finished_at"),
        })
    pct = round(100 * total_correct / total_questions, 1) if total_questions else 0
    return {
        "total_sessions": total_sessions,
        "total_questions": total_questions,
        "total_correct": total_correct,
        "global_percent": pct,
        "last_sessions": sorted(last_sessions, key=lambda x: x["finished_at"] or "", reverse=True)[:10],
    }


@api.get("/")
async def root():
    return {"name": "AMFQUEST API", "ok": True}


# ------------- Trial reminder e-mails (Resend) --------------
def _render_trial_reminder_html(name: str, hours_left: int, upgrade_url: str) -> str:
    safe_name = (name or "").split(" ")[0] or "vous"
    return f"""\
<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:#FAFAFA;font-family:Arial,Helvetica,sans-serif;color:#0A0A0A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFA;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E4E4E7;">
        <tr><td style="padding:28px 32px 8px 32px;">
          <div style="display:inline-block;width:28px;height:28px;background:#002FA7;color:#ffffff;text-align:center;line-height:28px;font-weight:900;font-family:Georgia,serif;">A</div>
          <span style="margin-left:8px;font-weight:900;letter-spacing:-0.02em;font-size:18px;">AMFQUEST</span>
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px;">
          <div style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;font-weight:700;color:#002FA7;">ESSAI PREMIUM · BIENTÔT TERMINÉ</div>
          <h1 style="font-size:26px;line-height:1.15;margin:14px 0 0 0;letter-spacing:-0.02em;">
            Plus que {hours_left}h pour profiter de votre accès Premium, {safe_name}.
          </h1>
        </td></tr>
        <tr><td style="padding:18px 32px 0 32px;color:#52525B;font-size:15px;line-height:1.6;">
          <p>Votre essai gratuit de 48 heures touche à sa fin. Pour continuer à accéder à&nbsp;:</p>
          <ul style="padding-left:18px;margin:8px 0 16px 0;">
            <li>les <b>2 389 questions</b> couvrant les 15 thèmes officiels AMF,</li>
            <li>l'<b>examen blanc chronométré</b> (120 questions · 90 min · seuil 80%),</li>
            <li>les <b>statistiques détaillées</b> et l'historique complet,</li>
          </ul>
          <p>passez Premium dès maintenant pour seulement <b>19,99&nbsp;€ / 30&nbsp;jours</b>, sans reconduction automatique.</p>
        </td></tr>
        <tr><td style="padding:24px 32px 8px 32px;">
          <a href="{upgrade_url}" style="display:inline-block;background:#002FA7;color:#ffffff;text-decoration:none;padding:14px 22px;font-weight:700;letter-spacing:.02em;">
            Passer Premium · 19,99 €
          </a>
        </td></tr>
        <tr><td style="padding:8px 32px 32px 32px;color:#A1A1AA;font-size:12px;line-height:1.5;">
          Si vous ne souhaitez pas continuer, vous n'avez rien à faire&nbsp;: votre compte ne sera plus actif pour les entraînements à l'issue de l'essai (vous pourrez toujours vous réabonner à tout moment).
          <br/><br/>
          — L'équipe AMFQUEST
        </td></tr>
      </table>
      <div style="color:#A1A1AA;font-size:11px;margin-top:18px;">Vous recevez cet e-mail car vous avez créé un compte AMFQUEST.</div>
    </td></tr>
  </table>
</body>
</html>"""


async def _send_email(to: str, subject: str, html: str) -> Optional[str]:
    if not os.environ.get("RESEND_API_KEY"):
        return None
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    params = {"from": sender, "to": [to], "subject": subject, "html": html}
    try:
        res = await asyncio.to_thread(resend.Emails.send, params)
        return (res or {}).get("id")
    except Exception as e:
        logger.exception("Resend send failed for %s: %s", to, e)
        return None


async def _scan_and_send_trial_reminders():
    """Find users whose trial expires within the configured window and remind them once."""
    window = int(os.environ.get("TRIAL_REMINDER_BEFORE_MINUTES", "60"))
    now = datetime.now(timezone.utc)
    soon = now + timedelta(minutes=window)
    # Fetch candidates: trial_until set, not yet reminded
    cursor = db.users.find({
        "trial_until": {"$ne": None},
        "trial_reminder_sent_at": {"$exists": False},
    })
    public_url = os.environ.get("PUBLIC_APP_URL", "").rstrip("/")
    upgrade_url = f"{public_url}/abonnement" if public_url else "/abonnement"
    async for u in cursor:
        try:
            tu = datetime.fromisoformat(u["trial_until"])
            if tu.tzinfo is None:
                tu = tu.replace(tzinfo=timezone.utc)
        except Exception:
            continue
        if tu <= now or tu > soon:
            continue
        hours_left = max(1, int((tu - now).total_seconds() // 3600) + 1)
        html = _render_trial_reminder_html(u.get("name", ""), hours_left, upgrade_url)
        email_id = await _send_email(
            u["email"],
            "Votre essai Premium AMFQUEST expire bientôt",
            html,
        )
        await db.users.update_one(
            {"id": u["id"]},
            {"$set": {
                "trial_reminder_sent_at": datetime.now(timezone.utc).isoformat(),
                "trial_reminder_email_id": email_id,
            }},
        )
        logger.info("Trial reminder sent to %s (id=%s)", u["email"], email_id)


async def _trial_reminder_loop():
    interval = max(1, int(os.environ.get("TRIAL_REMINDER_SCAN_MINUTES", "10"))) * 60
    # initial small delay so startup logs aren't crowded
    await asyncio.sleep(5)
    while True:
        try:
            await _scan_and_send_trial_reminders()
        except Exception as e:
            logger.exception("Trial reminder loop error: %s", e)
        await asyncio.sleep(interval)


# Manual trigger (admin only) – useful for QA / testing
@api.post("/admin/trial-reminders/run")
async def admin_trigger_trial_reminders(user=Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès interdit")
    await _scan_and_send_trial_reminders()
    return {"ok": True}


# ------------- Startup --------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.sessions.create_index("user_id")
    await db.questions.create_index("theme_key")
    await db.questions.create_index("is_free")
    await db.payment_transactions.create_index("session_id")
    await db.users.create_index("trial_until")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@amfquest.fr").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin1234!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Administrateur",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "subscription_until": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin seeded")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}},
        )

    await seed_questions_from_csv()

    # Configure Resend
    resend_key = os.environ.get("RESEND_API_KEY")
    if resend_key:
        resend.api_key = resend_key
        app.state.trial_reminder_task = asyncio.create_task(_trial_reminder_loop())
        logger.info("Resend configured, trial reminder scheduler started")
    else:
        logger.warning("RESEND_API_KEY not set, trial reminders disabled")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
