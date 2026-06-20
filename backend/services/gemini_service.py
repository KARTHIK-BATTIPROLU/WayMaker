import re
import google.generativeai as genai
from core.config import settings

genai.configure(api_key=settings.gemini_api_key)

def extract_html(text: str) -> str:
    """Extract clean HTML from LLM output, strip code fences"""
    text = text.strip()
    # Remove ```html ... ``` or ``` ... ```
    match = re.search(r'```(?:html)?\s*([\s\S]*?)```', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    # If it already starts with DOCTYPE or html tag, return as-is
    if text.startswith('<!DOCTYPE') or text.lower().startswith('<html'):
        return text
    return text

async def gemini_generate_website(project_description: str) -> str:
    """Generate a complete HTML landing page using Gemini"""
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction="""You are an award-winning elite UX/UI designer and senior frontend developer.
Create a complete, beautiful, production-ready landing page HTML file using Tailwind CSS CDN.
Return ONLY the raw HTML starting with <!DOCTYPE html> — absolutely no code fences, no markdown, no explanation."""
    )
    response = await model.generate_content_async(project_description)
    return extract_html(response.text)
