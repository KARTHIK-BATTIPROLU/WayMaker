from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId
from datetime import datetime, timezone
import json

from agents.prompts import IDEATION_SYSTEM
from services.groq_service import groq_chat, extract_json
from core.dependencies import get_current_user, get_project_or_404
from core.ideation import compute_confidence, compute_ready
from db.database import get_database

router = APIRouter()

# Switch to a larger Groq model here (e.g. "llama-3.3-70b-versatile") if
# scoring quality from the 8B is too weak. The rest of the code is unchanged.
IDEATION_MODEL = "llama-3.3-70b-versatile"

# ── Request / Response schemas ───────────────────────────────────────────────

class IdeateRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _safe_scores(raw: dict) -> dict:
    """Clamp every dimension score to [0, 100] and fill missing keys with 0."""
    keys = ["problem", "targetCustomer", "solutionWedge", "alternatives", "valueAndWillingness"]
    return {k: max(0, min(100, int(raw.get(k, 0)))) for k in keys}


def _safe_extracted(raw: dict) -> dict:
    keys = ["problem", "targetCustomer", "solutionWedge", "alternatives",
            "valueAndWillingness", "industry", "location"]
    return {k: str(raw.get(k, "")) for k in keys}


_FALLBACK_SCORES = {"problem": 0, "targetCustomer": 0, "solutionWedge": 0,
                    "alternatives": 0, "valueAndWillingness": 0}
_FALLBACK_EXTRACTED = {"problem": "", "targetCustomer": "", "solutionWedge": "",
                       "alternatives": "", "valueAndWillingness": "", "industry": "", "location": ""}


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/{project_id}/ideate", response_model=dict)
async def ideate(
    project_id: str,
    body: IdeateRequest,
    project=Depends(get_project_or_404),
    current_user=Depends(get_current_user),
    db=Depends(get_database),
):
    """
    One-turn ideation exchange.
    1. Load existing conversation from project.ideation.messages
    2. Build full history + new user message → Groq
    3. Parse JSON response, compute confidence/ready in code
    4. Persist updated ideation state to project
    5. Return full response
    """
    now = datetime.now(timezone.utc)

    # ── Handle special "__analyzed__" message to mark ideation phase as done ──
    if body.message == "__analyzed__":
        existing_ideation: dict = project.get("ideation") or {}
        existing_ideation["status"] = "analyzed"
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"ideation": existing_ideation, "updatedAt": now}},
        )

        def _serialise_msg(m: dict) -> dict:
            ts = m.get("timestamp")
            return {
                "role": m["role"],
                "content": m["content"],
                "timestamp": ts.isoformat() if hasattr(ts, "isoformat") else str(ts),
            }

        return {
            "reply": "Analyzing...",
            "nextQuestion": "",
            "extracted": existing_ideation.get("extracted", _FALLBACK_EXTRACTED),
            "dimensionScores": existing_ideation.get("dimensionScores", _FALLBACK_SCORES),
            "confidence": existing_ideation.get("confidence", 0),
            "ready": existing_ideation.get("ready", False),
            "messages": [_serialise_msg(m) for m in existing_ideation.get("messages", [])],
        }


    # ── 1. Load existing history ──────────────────────────────────────────────
    existing_ideation: dict = project.get("ideation") or {}
    existing_messages: list = existing_ideation.get("messages", [])
    prev_scores: dict = existing_ideation.get("dimensionScores", _FALLBACK_SCORES.copy())
    prev_extracted: dict = existing_ideation.get("extracted", _FALLBACK_EXTRACTED.copy())

    # ── 2. Build Groq message array ───────────────────────────────────────────
    groq_messages = [{"role": "system", "content": IDEATION_SYSTEM}]
    for msg in existing_messages:
        groq_messages.append({"role": msg["role"], "content": msg["content"]})
    groq_messages.append({"role": "user", "content": body.message})

    # ── 3. Call LLM ───────────────────────────────────────────────────────────
    reply_text = "Sorry, can you rephrase that?"
    next_question = ""
    scores = prev_scores.copy()
    extracted = prev_extracted.copy()

    try:
        raw_response = await groq_chat(
            messages=groq_messages,
            model=IDEATION_MODEL,
            max_tokens=1024,
            temperature=0.4,  # Low temp for reliable JSON
        )
        clean_json = extract_json(raw_response)
        parsed: dict = json.loads(clean_json)

        reply_text = str(parsed.get("reply", reply_text))
        next_question = str(parsed.get("nextQuestion", ""))
        if "dimensionScores" in parsed:
            scores = _safe_scores(parsed["dimensionScores"])
        if "extracted" in parsed:
            extracted = _safe_extracted(parsed["extracted"])

    except Exception as exc:
        # On parse failure: keep previous scores, return safe fallback message
        print(f"[ideate] JSON parse error: {exc}")
        # reply_text and scores remain as fallbacks set above

    # ── 4. Compute confidence & ready in code (never trust the LLM for math) ─
    confidence = compute_confidence(scores)
    ready = compute_ready(scores, confidence)

    # ── 5. Persist to MongoDB ─────────────────────────────────────────────────
    user_msg = {"role": "user", "content": body.message, "timestamp": now}
    assistant_msg = {
        "role": "assistant",
        "content": f"{reply_text}\n\n{next_question}".strip() if next_question else reply_text,
        "timestamp": datetime.now(timezone.utc),
    }
    new_messages = existing_messages + [user_msg, assistant_msg]

    # Determine status
    current_status = existing_ideation.get("status", "ideating")
    if current_status != "analyzed":
        new_status = "ready" if ready else "ideating"
    else:
        new_status = "analyzed"

    updated_ideation = {
        "messages": new_messages,
        "extracted": extracted,
        "dimensionScores": scores,
        "confidence": confidence,
        "ready": ready,
        "status": new_status,
    }

    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"ideation": updated_ideation, "updatedAt": now}},
    )

    # ── 6. Return response ────────────────────────────────────────────────────
    # Convert timestamps to ISO strings for JSON serialisation
    def _serialise_msg(m: dict) -> dict:
        ts = m.get("timestamp")
        return {
            "role": m["role"],
            "content": m["content"],
            "timestamp": ts.isoformat() if hasattr(ts, "isoformat") else str(ts),
        }

    return {
        "reply": reply_text,
        "nextQuestion": next_question,
        "extracted": extracted,
        "dimensionScores": scores,
        "confidence": confidence,
        "ready": ready,
        "messages": [_serialise_msg(m) for m in new_messages],
    }
