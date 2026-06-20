from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from datetime import datetime, timezone
import re
import json
from models.chat_message import ChatMessageCreate, ChatMessageOut
from agents.prompts import CHAT_SYSTEM_TEMPLATE
from services.groq_service import groq_chat, groq_safety_check
from core.dependencies import get_current_user, get_project_or_404
from db.database import get_database

router = APIRouter()

def build_chat_system_prompt(project: dict) -> str:
    competitors = project.get("competitors", [])
    competitor_names = ", ".join([c.get("name", "") for c in competitors]) if competitors else "None identified yet"
    return CHAT_SYSTEM_TEMPLATE.format(
        name=project.get("name", ""),
        idea=project.get("idea", ""),
        industry=project.get("industry", "Not specified"),
        target_audience=project.get("targetAudience", "Not specified"),
        location=project.get("location", "Global"),
        has_market_research="Yes" if project.get("marketResearch") else "No",
        competitor_names=competitor_names,
        has_website="Yes" if project.get("websiteCode") else "No",
        has_marketing="Yes" if project.get("marketingKit") else "No",
        has_funding="Yes" if project.get("fundingOpportunities") else "No"
    )

def parse_tool_call(response_text: str):
    """Extract tool call from response text. Returns (clean_text, tool_args_or_None)"""
    pattern = r'TOOL_CALL:\s*update_project\s*\nARGS_JSON:\s*([\s\S]*?)\nEND_TOOL_CALL'
    match = re.search(pattern, response_text)
    if match:
        try:
            args = json.loads(match.group(1).strip())
            clean_text = re.sub(pattern, '', response_text).strip()
            return clean_text, args
        except json.JSONDecodeError:
            pass
    return response_text, None

@router.post("/{project_id}/chat", response_model=dict)
async def send_chat_message(
    project_id: str,
    body: ChatMessageCreate,
    project=Depends(get_project_or_404),
    current_user=Depends(get_current_user),
    db=Depends(get_database)
):
    # Safety check
    is_safe = await groq_safety_check(body.message)
    if not is_safe:
        now = datetime.now(timezone.utc)
        refusal_msg = {
            "project_id": ObjectId(project_id),
            "user_id": ObjectId(current_user["id"]),
            "role": "assistant",
            "content": "I'm not able to help with that request. Please keep our conversation focused on building your business.",
            "timestamp": now
        }
        result = await db.chat_messages.insert_one(refusal_msg)
        return {
            "message": ChatMessageOut(
                id=str(result.inserted_id),
                projectId=project_id,
                role="assistant",
                content=refusal_msg["content"],
                timestamp=now
            ),
            "updates": None
        }

    # Load last 20 messages for context
    cursor = db.chat_messages.find(
        {"project_id": ObjectId(project_id)},
        sort=[("timestamp", -1)],
        limit=20
    )
    history = await cursor.to_list(length=20)
    history.reverse()

    # Build messages for Groq
    system_prompt = build_chat_system_prompt(project)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        role = "user" if msg["role"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["content"]})
    messages.append({"role": "user", "content": body.message})

    # Generate AI response
    try:
        ai_response = await groq_chat(messages=messages, max_tokens=2000, temperature=0.8)
    except Exception as e:
        ai_response = f"I encountered an error: {str(e)}. Please try again."

    # Parse tool calls
    clean_response, tool_args = parse_tool_call(ai_response)
    project_updates = None

    if tool_args:
        # Apply updates to project
        from models.project import ProjectUpdate
        allowed_fields = ["name", "industry", "targetAudience", "location",
                          "marketResearch", "competitors", "websiteCode",
                          "marketingKit", "fundingOpportunities"]
        filtered = {k: v for k, v in tool_args.items() if k in allowed_fields}
        if filtered:
            filtered["updatedAt"] = datetime.now(timezone.utc)
            await db.projects.update_one(
                {"_id": ObjectId(project_id)},
                {"$set": filtered}
            )
            project_updates = filtered

    now = datetime.now(timezone.utc)

    # Save user message
    user_msg_doc = {
        "project_id": ObjectId(project_id),
        "user_id": ObjectId(current_user["id"]),
        "role": "user",
        "content": body.message,
        "timestamp": now
    }
    await db.chat_messages.insert_one(user_msg_doc)

    # Save assistant message
    assistant_msg_doc = {
        "project_id": ObjectId(project_id),
        "user_id": ObjectId(current_user["id"]),
        "role": "assistant",
        "content": clean_response,
        "timestamp": datetime.now(timezone.utc)
    }
    result = await db.chat_messages.insert_one(assistant_msg_doc)

    return {
        "message": ChatMessageOut(
            id=str(result.inserted_id),
            projectId=project_id,
            role="assistant",
            content=clean_response,
            timestamp=assistant_msg_doc["timestamp"]
        ),
        "updates": project_updates
    }

@router.get("/{project_id}/chat/history", response_model=List[ChatMessageOut])
async def get_chat_history(
    project_id: str,
    project=Depends(get_project_or_404),
    db=Depends(get_database)
):
    cursor = db.chat_messages.find(
        {"project_id": ObjectId(project_id)},
        sort=[("timestamp", 1)]
    )
    messages = await cursor.to_list(length=500)
    return [
        ChatMessageOut(
            id=str(m["_id"]),
            projectId=str(m["project_id"]),
            role=m["role"],
            content=m["content"],
            timestamp=m["timestamp"]
        )
        for m in messages
    ]
