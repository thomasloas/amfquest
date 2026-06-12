from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import random
from datetime import datetime, timezone
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
from seed_data import AMF_CATEGORIES, AMF_QUESTIONS

# ------------- DB --------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ------------- App --------------
app = FastAPI(title="AMFQUEST API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("amfquest")

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


# ------------- Auth dependency --------------
async def current_user(request: Request):
    return await get_current_user(request, db)


def _set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False,
                        samesite="lax", max_age=60 * 60 * 12, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False,
                        samesite="lax", max_age=60 * 60 * 24 * 7, path="/")


# ------------- Auth routes --------------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Un compte existe déjà avec cet email")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    _set_auth_cookies(response, access, refresh)
    return {
        "id": user_id, "email": email, "name": payload.name.strip(), "role": "user",
        "access_token": access,
    }


@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    _set_auth_cookies(response, access, refresh)
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "role": user.get("role", "user"), "access_token": access,
    }


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return user


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
    return {"ok": True, "id": doc["id"]}


@api.get("/contact")
async def list_contacts(user=Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès interdit")
    cursor = db.contacts.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


# ------------- Categories + Questions --------------
@api.get("/categories")
async def categories():
    res = []
    for c in AMF_CATEGORIES:
        n = sum(1 for q in AMF_QUESTIONS if q["theme"] == c["key"])
        res.append({**c, "question_count": n})
    return res


@api.get("/questions/sample")
async def public_sample():
    """Public sample (for landing) – returns 3 demo questions WITHOUT correct answers."""
    sample = random.sample(AMF_QUESTIONS, k=min(3, len(AMF_QUESTIONS)))
    return [
        {
            "id": f"public-{i}",
            "theme": q["theme"],
            "text": q["text"],
            "options": q["options"],
        } for i, q in enumerate(sample)
    ]


# ------------- Sessions --------------
def _build_questions(mode: str, category: Optional[str], count: int):
    pool = [q for q in AMF_QUESTIONS if (not category or q["theme"] == category)]
    if not pool:
        pool = list(AMF_QUESTIONS)
    if mode == "exam":
        target = 120
    else:
        target = count
    questions = []
    while len(questions) < target:
        random.shuffle(pool)
        for q in pool:
            if len(questions) >= target:
                break
            qid = str(uuid.uuid4())
            questions.append({
                "id": qid,
                "theme": q["theme"],
                "text": q["text"],
                "options": q["options"],
                "correct_index": q["correct_index"],
                "explanation": q["explanation"],
            })
    return questions


@api.post("/sessions/start")
async def start_session(body: dict, user=Depends(current_user)):
    mode = body.get("mode", "training")
    category = body.get("category")
    count = int(body.get("count", 10))
    count = max(5, min(count, 50))
    questions = _build_questions(mode, category, count)
    session_id = str(uuid.uuid4())
    doc = {
        "id": session_id,
        "user_id": user["id"],
        "mode": mode,  # 'training' | 'exam'
        "category": category,
        "questions": questions,
        "answers": {},  # qid -> selected_index
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": None,
        "score": None,
        "total": len(questions),
        "duration_seconds": 60 * 90 if mode == "exam" else None,
    }
    await db.sessions.insert_one(doc)
    # Strip correct + explanation for client during the run
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
            "selected_index": sel, "is_correct": ok, "explanation": q["explanation"],
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
    per_theme = {}
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
        "per_theme": per_theme,
        "last_sessions": sorted(last_sessions, key=lambda x: x["finished_at"] or "", reverse=True)[:10],
    }


@api.get("/")
async def root():
    return {"name": "AMFQUEST API", "ok": True}


# ------------- Startup --------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.sessions.create_index("user_id")
    # Seed admin
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
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin seeded")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}},
        )


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
