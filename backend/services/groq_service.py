import httpx
import json
import re
from typing import Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from core.config import settings

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

def extract_json(text: str) -> str:
    """Strip markdown code fences and extract clean JSON"""
    text = text.strip()
    # Try ```json ... ``` or ``` ... ```
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if match:
        return match.group(1).strip()
    # Try to find JSON array or object directly
    json_match = re.search(r'(\[[\s\S]*\]|\{[\s\S]*\})', text)
    if json_match:
        return json_match.group(1).strip()
    return text

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=10, max=65),
    retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TimeoutException))
)
async def groq_chat(
    messages: list,
    model: str = "llama-3.1-8b-instant",
    max_tokens: int = 4096,
    temperature: float = 1.0
) -> str:
    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(
            GROQ_CHAT_URL,
            headers={
                "Authorization": f"Bearer {settings.groq_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": messages,
                "max_completion_tokens": max_tokens,
                "temperature": temperature,
                "top_p": 1,
                "stream": False
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def groq_safety_check(message: str) -> bool:
    """Returns True if message is safe, False if flagged as unsafe"""
    try:
        result = await groq_chat(
            messages=[{"role": "user", "content": message}],
            model="llama-guard-3-8b",
            max_tokens=20,
            temperature=0
        )
        return "unsafe" not in result.lower()
    except Exception:
        return True  # Fail open if safety check errors
