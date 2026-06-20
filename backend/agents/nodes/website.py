from agents.state import OrchestratorState
from agents.prompts import WEBSITE_SYSTEM
from services.groq_service import groq_chat
from db.database import get_database
from bson import ObjectId
from datetime import datetime, timezone
import re

def extract_html(text: str) -> str:
    """Extract clean HTML from LLM output, strip code fences and conversational text"""
    text = text.strip()
    # 1. Try code fences
    match = re.search(r'```(?:html)?\s*([\s\S]*?)```', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # 2. Try strict DOCTYPE to </html> extraction
    match = re.search(r'(<!DOCTYPE\s+html>[\s\S]*?</html>)', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
        
    # 3. Try strict <html> to </html> extraction
    match = re.search(r'(<html[\s\S]*?</html>)', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
        
    return text

async def website_node(state: OrchestratorState) -> dict:
    try:
        system_instruction = "You are an expert frontend developer and designer. Return only raw HTML code."
        prompt = f"""Act as an award-winning Elite UX/UI Designer and Frontend Architect. Design a highly converting, breathtaking, completely unique single-page landing page for this business using HTML5 and Tailwind CSS (via CDN).

Idea: {state['idea']}
Industry: {state.get('industry', 'Technology')}
Location: {state.get('location', 'Global')}

CRITICAL INSTRUCTIONS TO AVOID GENERIC DESIGNS:
1. **AUTHENTICITY & DIVERSITY:** Do NOT use the exact same hero -> features -> CTA layout for every request. Tailor the exact structure, mood, and color palette to the SPECIFIC industry and idea. An AI tech startup should look dark, sleek, and neon. A health clinic should look light, airy, and trustworthy.
2. **PREMIUM AESTHETICS:** Use high-end modern design trends. Use varied border radiuses (e.g. asymmetrical cards), glassmorphism where it makes sense (backdrop-blur), rich tailored gradients (e.g. `bg-gradient-to-br from-indigo-900 via-purple-900 to-black`), and precise spacing (`gap-8`, `py-24`).
3. **TYPOGRAPHY:** Use appropriate Google Fonts pairings (e.g., 'Playfair Display' & 'Inter' for luxury, 'Outfit' for tech, 'Plus Jakarta Sans' for SaaS).
4. **RICH COMPONENTS:** Build complex UI elements like bento grids for features, floating statistic cards overlaying the hero section, interactive pricing toggles, or beautifully styled customer testimonial carousels. Use SVG paths or Lucide-like icons natively inline.
5. **ANIMATIONS:** Add subtle but impactful hover and entrance animations (`hover:-translate-y-2`, `transition-all duration-500`, `hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]`).
6. **IMAGES:** Provide extremely relevant, high-quality Unsplash source URLs for background and placeholder images matching the vibe. Use object-cover for all images.
7. **OUTPUT REQUIREMENT:** Return ONLY valid, self-contained HTML starting with <!DOCTYPE html>. Include the Tailwind CDN <script src="https://cdn.tailwindcss.com"></script>. DO NOT wrap the output in markdown code blocks (```html) or include any conversational text. NEVER output "Here is your code".
"""

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]

        # Use qwen/qwen3-32b because 8b models fail to write good HTML and 70B TPD limit is exhausted
        raw_response = await groq_chat(messages, model="qwen/qwen3-32b", max_tokens=4500)
        html_code = extract_html(raw_response)

        db = get_database()
        await db.projects.update_one(
            {"_id": ObjectId(state["project_id"])},
            {"$set": {"websiteCode": html_code, "updatedAt": datetime.now(timezone.utc)}}
        )

        return {
            "website_code": html_code,
            "current_step": "website",
            "completed_steps": state.get("completed_steps", []) + ["website"]
        }
    except Exception as e:
        return {
            "website_code": None,
            "current_step": "website",
            "completed_steps": state.get("completed_steps", []) + ["website"],
            "error": f"Website failed: {str(e)}"
        }
