import json
from typing import List
from services.groq_service import groq_chat, extract_json

def _persona_prefix(voice: str) -> str:
    return (
        "You are Waymaker's social media growth lead -- you write content for startup founders "
        f"building their company in public. Match the brand voice below exactly.\n\nBRAND VOICE:\n{voice}\n\n"
    )

LINKEDIN_INSTRUCTIONS = (
    "Write ONE LinkedIn post about the idea the user gives you.\n"
    "Return ONLY valid JSON, no markdown, no explanation:\n"
    '{"post_text": "the full LinkedIn post, 3-6 short paragraphs, no hashtags inline", '
    '"hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"], '
    '"image_prompt": "a detailed prompt for generating a single supporting image"}'
)

PLATFORM_INSTRUCTIONS = (
    "Write platform-optimized social content for the idea the user gives you, one entry per "
    "requested platform. Tailor length, tone, and hashtag count to each platform's norms "
    "(e.g. punchy + few hashtags for Twitter/X, professional for LinkedIn, visual-first for Instagram).\n"
    "Return ONLY a valid JSON array, one object per requested platform, no markdown, no explanation:\n"
    '[{"platform": "<platform name as given>", "content": "the post caption", '
    '"hashtags": ["#tag1", "#tag2"], "image_prompt": "detailed prompt for this post\'s image"}]'
)


async def generate_post(user_input: str, preferences: str) -> dict:
    response = await groq_chat(
        messages=[
            {"role": "system", "content": _persona_prefix(preferences) + LINKEDIN_INSTRUCTIONS},
            {"role": "user", "content": user_input},
        ],
        model="llama-3.3-70b-versatile",
        max_tokens=1500,
        temperature=0.9,
    )
    data = json.loads(extract_json(response), strict=False)
    return {
        "post_text": data.get("post_text", ""),
        "hashtags": data.get("hashtags", []),
        "image_prompt": data.get("image_prompt", user_input),
    }


async def generate_platform_kit(user_input: str, target_platforms: List[str], preferences: str) -> List[dict]:
    user_message = f"{user_input}\n\nPlatforms required: {', '.join(target_platforms)}"
    response = await groq_chat(
        messages=[
            {"role": "system", "content": _persona_prefix(preferences) + PLATFORM_INSTRUCTIONS},
            {"role": "user", "content": user_message},
        ],
        model="llama-3.3-70b-versatile",
        max_tokens=3000,
        temperature=0.9,
    )
    data = json.loads(extract_json(response), strict=False)
    if not isinstance(data, list):
        data = []
    by_platform = {item.get("platform", "").lower(): item for item in data}
    kit = []
    for platform in target_platforms:
        item = by_platform.get(platform.lower(), {})
        kit.append({
            "platform": platform,
            "content": item.get("content", ""),
            "hashtags": item.get("hashtags", []),
            "image_prompt": item.get("image_prompt", user_input),
        })
    return kit
