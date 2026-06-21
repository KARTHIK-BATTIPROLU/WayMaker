import re
import uuid
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from typing import Optional
from db.database import get_database

CONFIG_ID = "config"
PREFERENCES_ID = "brand_voice"

DEFAULT_BRAND_VOICE = (
    "Voice: confident, builder-to-builder, no fluff. We talk to founders the way a sharp "
    "co-founder would -- direct, specific, a little irreverent, never corporate. Favor concrete "
    "numbers and outcomes over adjectives. Every post should make a founder feel like Waymaker "
    "already understands the grind of building a company from zero."
)

DEFAULT_CONFIG = {
    "_id": CONFIG_ID,
    "domain": "AI tools for startup founders",
    "keywords": [],
    "timezone": "Asia/Kolkata",
    "daily_topic_count": 30,
    "forward_horizon_months": 12,
    "active": True,
    "last_run_at": None,
}


def ist_today_str() -> str:
    return datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%d")


def normalize_dedupe_key(title: str) -> str:
    key = re.sub(r"[^a-z0-9\s]", "", title.lower())
    return re.sub(r"\s+", " ", key).strip()


def new_id() -> str:
    return uuid.uuid4().hex[:16]


async def ensure_indexes():
    db = get_database()
    await db.marketing_daily_topics.create_index([("date", -1)])
    await db.marketing_permanent_topics.create_index("dedupe_key", unique=True)


# ── Sessions ──────────────────────────────────────────────────────────────

async def create_session(doc: dict) -> str:
    db = get_database()
    session_id = new_id()
    doc["_id"] = session_id
    now = datetime.now(timezone.utc)
    doc.setdefault("created_at", now)
    doc["updated_at"] = now
    await db.marketing_sessions.insert_one(doc)
    return session_id


async def get_session(session_id: str) -> Optional[dict]:
    db = get_database()
    return await db.marketing_sessions.find_one({"_id": session_id})


async def update_session(session_id: str, updates: dict) -> None:
    db = get_database()
    updates["updated_at"] = datetime.now(timezone.utc)
    await db.marketing_sessions.update_one({"_id": session_id}, {"$set": updates})


# ── Calendar config ─────────────────────────────────────────────────────────

async def get_config() -> dict:
    db = get_database()
    config = await db.marketing_calendar_config.find_one({"_id": CONFIG_ID})
    if not config:
        config = dict(DEFAULT_CONFIG)
        await db.marketing_calendar_config.insert_one(dict(config))
    return config


async def update_config(updates: dict) -> dict:
    db = get_database()
    await get_config()  # ensure it exists
    if updates:
        await db.marketing_calendar_config.update_one({"_id": CONFIG_ID}, {"$set": updates})
    return await get_config()


async def set_config_last_run(date_str: str) -> None:
    db = get_database()
    await db.marketing_calendar_config.update_one(
        {"_id": CONFIG_ID},
        {"$set": {"last_run_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


# ── Followed sources ─────────────────────────────────────────────────────────

async def list_sources(active_only: bool = False) -> list[dict]:
    db = get_database()
    query = {"active": True} if active_only else {}
    cursor = db.marketing_sources.find(query)
    return await cursor.to_list(length=200)


async def create_source(doc: dict) -> dict:
    db = get_database()
    doc["_id"] = new_id()
    doc.setdefault("active", True)
    await db.marketing_sources.insert_one(doc)
    return doc


async def delete_source(source_id: str) -> bool:
    db = get_database()
    result = await db.marketing_sources.delete_one({"_id": source_id})
    return result.deleted_count > 0


# ── Daily topics ─────────────────────────────────────────────────────────────

async def get_today_topics(date_str: Optional[str] = None) -> list[dict]:
    """Returns topics for `date_str`, or for the most recent date with topics (so a failed
    refresh keeps showing the prior day's set instead of going blank)."""
    db = get_database()
    if not date_str:
        latest = await db.marketing_daily_topics.find_one({}, sort=[("date", -1)])
        date_str = latest["date"] if latest else ist_today_str()
    cursor = db.marketing_daily_topics.find({"date": date_str})
    return await cursor.to_list(length=200)


async def replace_daily_topics(topics: list[dict], date_str: str) -> None:
    db = get_database()
    for topic in topics:
        topic.setdefault("_id", new_id())
        topic["date"] = date_str
        topic.setdefault("created_at", datetime.now(timezone.utc))
        topic.setdefault("used", False)
    await db.marketing_daily_topics.delete_many({"date": date_str})
    if topics:
        await db.marketing_daily_topics.insert_many(topics)


async def get_topic_by_id(topic_id: str) -> Optional[dict]:
    db = get_database()
    topic = await db.marketing_daily_topics.find_one({"_id": topic_id})
    if not topic:
        topic = await db.marketing_permanent_topics.find_one({"_id": topic_id})
    return topic


async def mark_topic_used(topic_id: str) -> None:
    db = get_database()
    await db.marketing_daily_topics.update_one({"_id": topic_id}, {"$set": {"used": True}})
    await db.marketing_permanent_topics.update_one({"_id": topic_id}, {"$set": {"used": True}})


# ── Permanent topics ──────────────────────────────────────────────────────────

async def list_permanent() -> list[dict]:
    db = get_database()
    cursor = db.marketing_permanent_topics.find({}, sort=[("added_at", -1)])
    return await cursor.to_list(length=10000)


async def add_permanent(topic: dict, source_daily_topic_id: Optional[str]) -> dict:
    db = get_database()
    doc = {
        "_id": new_id(),
        "title": topic["title"],
        "description": topic.get("description", ""),
        "horizon": topic.get("horizon", "upcoming"),
        "category": topic.get("category"),
        "sources": topic.get("sources", []),
        "added_at": datetime.now(timezone.utc),
        "source_daily_topic_id": source_daily_topic_id,
        "dedupe_key": normalize_dedupe_key(topic["title"]),
        "used": False,
    }
    await db.marketing_permanent_topics.insert_one(doc)
    return doc


async def delete_permanent(topic_id: str) -> bool:
    db = get_database()
    result = await db.marketing_permanent_topics.delete_one({"_id": topic_id})
    return result.deleted_count > 0


# ── Brand voice preferences ──────────────────────────────────────────────────

async def get_preferences() -> str:
    db = get_database()
    doc = await db.marketing_preferences.find_one({"_id": PREFERENCES_ID})
    if not doc:
        await db.marketing_preferences.insert_one({"_id": PREFERENCES_ID, "content": DEFAULT_BRAND_VOICE})
        return DEFAULT_BRAND_VOICE
    return doc.get("content", DEFAULT_BRAND_VOICE)


async def set_preferences(content: str) -> None:
    db = get_database()
    await db.marketing_preferences.update_one(
        {"_id": PREFERENCES_ID}, {"$set": {"content": content}}, upsert=True
    )
