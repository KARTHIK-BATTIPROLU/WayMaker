import re
from core.config import settings
from services.groq_service import groq_chat

def extract_html(text: str) -> str:
    """Extract clean HTML from LLM output, strip code fences and any conversational/thinking text"""
    text = text.strip()

    # Strip <think>...</think> blocks some reasoning models emit
    text = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.IGNORECASE).strip()

    match = re.search(r'```(?:html)?\s*([\s\S]*?)```', text, re.IGNORECASE)
    if match:
        text = match.group(1).strip()

    doctype_match = re.search(r'(<!DOCTYPE\s+html>[\s\S]*?</html>)', text, re.IGNORECASE)
    if doctype_match:
        return doctype_match.group(1).strip()

    html_match = re.search(r'(<html[\s\S]*?</html>)', text, re.IGNORECASE)
    if html_match:
        return html_match.group(1).strip()

    return text

def build_website_prompt(idea: str, industry: str = None, location: str = None) -> str:
    header = f"""Act as an award-winning Elite UX/UI Designer and Frontend Architect. Design a highly converting, breathtaking, completely unique single-page landing page for this business using HTML5 and Tailwind CSS (via CDN).

Idea: {idea}
Industry: {industry or 'Technology'}
Location: {location or 'Global'}

CRITICAL INSTRUCTIONS — every single one is mandatory. Output that violates any of these (empty-looking sections, broken icons, missing images, dead whitespace) is a failed result.

"""
    body = """1. **AUTHENTICITY & DIVERSITY:** Do NOT use the exact same hero -> features -> CTA layout for every request. Tailor the exact structure, mood, and color palette to the SPECIFIC industry and idea. An AI tech startup should look dark, sleek, and neon. A health clinic should look light, airy, and trustworthy.

2. **NO DEAD SPACE — THIS IS THE #1 FAILURE MODE.** Never use `min-h-screen` on anything except the hero section, and even the hero's content must be vertically centered with a real background filling the entire viewport (image + gradient overlay), never a blank area above the content. Every other `<section>` uses bounded padding only: `py-16 md:py-24` (never more). Wrap section content in `max-w-7xl mx-auto px-6`. Before finishing, mentally check: does any section have a large blank gap above or below its content? If yes, that section's padding/height is wrong — fix it.

3. **REAL WORKING IMAGES — MANDATORY, NOT OPTIONAL.** Every section (hero, at least one feature/content block, testimonials background) must contain at least one real photographic image. Use ONLY this exact URL pattern with a real, specific Unsplash photo ID (never `source.unsplash.com`, which is dead): `https://images.unsplash.com/photo-<ID>?auto=format&fit=crop&w=1600&q=80`. Pick photo IDs that genuinely exist and match the topic, e.g.:
   - Water/nature/sustainability: photo-1559825481-12a05cc00344, photo-1538300342682-cf57afb97285, photo-1502691876148-a84978e59af8
   - Technology/SaaS/AI: photo-1518770660439-4636190af475, photo-1551434678-e076c223a692, photo-1487058792275-0ad4aaf24ca7
   - Business/team/office: photo-1521737604893-d14cc237f11d, photo-1556761175-5973dc0f32e7, photo-1542744173-8e7e53415bb0
   - Health/wellness: photo-1576091160550-2173dba999ef, photo-1505751172876-fa1923c5c528
   - Food/restaurant: photo-1517248135467-4c7edcad34c4, photo-1414235077428-338989a2e8c0
   - Finance: photo-1559526324-4b87b5e36e44, photo-1454165804606-c3d57bc86b40
   Always set `object-cover` plus explicit width/height container classes so images never collapse to 0 height. If unsure an ID fits, prefer one from the lists above over inventing a new one.

4. **ICONS MUST BE INLINE SVG, NEVER ICON FONTS OR LIGATURE TEXT, AND EVERY ICON MUST BE VISUALLY DIFFERENT.** Never output bare words like `water_drop` or icon-font class names (`<i class="fa-...">`) — these render as broken text or empty circles when the font isn't loaded, which is unacceptable. Never reuse the exact same `<path>` data for more than one icon on the page — a page with 5 different feature cards needs 5 visibly different icon shapes, not the same circle repeated. Use `viewBox="0 0 24 24"`, `stroke="currentColor"`, `fill="none"`, `stroke-width="2"`, `class="w-6 h-6"`. Pick a different one of these real Feather-style paths for each icon instead of inventing your own from scratch:
   - checkmark: `<path d="M20 6L9 17l-5-5"/>`
   - droplet: `<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>`
   - shield: `<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>`
   - bolt: `<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>`
   - leaf: `<path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 3 17 3c1 5-1 6-2 6.5-1 .5-3 1.5-3 1.5"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>`
   - users/community: `<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75"/>`
   - clock/speed: `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`
   - trending-up/growth: `<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>`

5. **PREMIUM AESTHETICS:** Use high-end modern design trends. Use varied border radiuses (e.g. asymmetrical cards), glassmorphism where it makes sense (backdrop-blur), rich tailored gradients (e.g. `bg-gradient-to-br from-indigo-900 via-purple-900 to-black`), real drop shadows (`shadow-xl shadow-indigo-500/20`), and precise spacing (`gap-8`).

6. **TYPOGRAPHY — FONTS MUST ACTUALLY APPLY.** Import 2 Google Fonts via `<link>` and pair them deliberately (e.g., 'Playfair Display' & 'Inter' for luxury, 'Outfit' for tech, 'Plus Jakarta Sans' for SaaS). The Tailwind CDN build does NOT know any custom font name by default — `font-outfit` or `font-jakarta` are NOT real utility classes and will silently fall back to the browser default font if you just invent them. You MUST register the fonts first with a `tailwind.config` script placed immediately before the CDN script tag, exactly like this pattern (swap in your chosen font names):
   ```html
   <script>
     tailwind.config = { theme: { extend: { fontFamily: { display: ['Outfit','sans-serif'], body: ['Plus Jakarta Sans','sans-serif'] } } } }
   </script>
   <script src="https://cdn.tailwindcss.com"></script>
   ```
   Then use `font-display` for headings and `font-body` (or just leave body default if `body` is mapped to the base `font-sans` extension) on the `<body>` tag. Headings should be bold and large (`text-5xl md:text-7xl font-bold tracking-tight`) — never default thin/small text for hero headlines.

7. **RICH COMPONENTS:** Build complex UI elements like bento grids for features, floating statistic cards overlaying the hero section (with a colored icon chip, not a bare circle), interactive-looking pricing cards, or styled testimonial cards with a small avatar (use `https://i.pravatar.cc/100?img=<1-70>` for avatar photos — always a real working URL).

8. **SMALL, REAL ANIMATIONS — NOT JUST PAGE-LOAD FADES, AND THE REVEAL SCRIPT MUST ACTUALLY WORK.** A very common bug to avoid: querying `.visible` elements with `querySelectorAll` and observing them does nothing, because no element starts with that class — there is nothing to observe. The correct pattern is to give revealable elements a `reveal` class that starts hidden, then ADD `visible` to it on intersect:
   ```html
   <style>
     .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
     .reveal.visible { opacity: 1; transform: translateY(0); }
   </style>
   <script>
     const revealEls = document.querySelectorAll('.reveal');
     const observer = new IntersectionObserver((entries) => {
       entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
     }, { threshold: 0.2 });
     revealEls.forEach(el => observer.observe(el));
   </script>
   ```
   This script alone reveals nothing if you forget the next step: you MUST also write `class="reveal ...your other classes..."` directly on every `<section>` wrapper and every card/grid-item element in the HTML body itself. Writing the `.reveal` CSS rule and the observer script but never actually putting `reveal` in any element's `class` attribute is a failure — go back through the page after writing it and confirm each section/card div's `class` list literally contains the word `reveal`. Beyond that, every interactive element needs a tasteful micro-interaction:
   - Buttons: `transition-all duration-300` with `hover:scale-105 hover:shadow-lg` and a subtle gradient-shift or glow on hover.
   - Cards: `hover:-translate-y-2 hover:shadow-2xl transition-all duration-500`.
   - Icons inside feature cards: wrap the icon's parent in `group` and use `group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300` on the icon.
   - Stat numbers: store the real target on a `data-target` attribute (never inside the starting text, since the element starts at "0" and the target value has to come from somewhere else), e.g. `<span class="stat-num" data-target="500">0</span>`, then on intersect read `parseInt(el.dataset.target)` and animate `el.textContent` up to it with `requestAnimationFrame`.
   - At least one subtle ambient animation unrelated to scroll/hover: a slow-pulsing gradient blob, a soft floating icon (define `@keyframes float` AND actually apply it via a class like `animation: float 5s ease-in-out infinite` on a real element — don't define an unused keyframe), or a gentle background gradient shift — kept subtle (`opacity-20`–`opacity-40`, slow durations 4–8s) so it never distracts.
   - `scroll-behavior: smooth` on `html`. Nothing should pop in abruptly.

9. **NO INVISIBLE TEXT — THE #1 CAUSE OF BLANK-LOOKING CARDS.** A very common bug: a dark hero section sets `text-white` on its outer content wrapper for the heading/subtext, and then a light/white card (a stat chip, a testimonial card, a pricing card) is nested inside that same wrapper to overlay the hero. That white card inherits `text-white` from the ancestor, so its icon (`stroke="currentColor"`), numbers, and labels all render white-on-white — an apparently blank box. Rule: any time you nest a `bg-white` or other light-background element inside a container that has `text-white` (or any light text color) applied to it or an ancestor, you MUST explicitly set a dark text color (e.g. `text-gray-900`) and an explicit icon color (e.g. `text-blue-500`, never bare `currentColor` inheriting from outside) directly on that nested card and everything inside it — never rely on inheritance across a light/dark boundary. Before finishing, check every `bg-white`/light-background element: does it explicitly set its own text/icon colors, or could it be silently inheriting an invisible color from a dark ancestor? If you can't be sure, set the colors explicitly.

10. **`absolute` POSITIONING NEEDS A `relative` ANCESTOR.** Any element using `absolute` (e.g. a floating stat card overlaying the hero) must have its nearest meaningful container (usually the `<section>` itself) explicitly marked `relative`, otherwise it positions against the body/viewport instead of staying pinned inside that section and will drift or overlap incorrectly. Always pair `class="relative ..."` on the section/wrapper with `class="absolute ..."` on the child it contains.

11. **OUTPUT REQUIREMENT:** Return ONLY valid, self-contained HTML starting with <!DOCTYPE html>. Include the Tailwind CDN <script src="https://cdn.tailwindcss.com"></script>. DO NOT wrap the output in markdown code blocks (```html) or include any conversational text, reasoning, or preamble of any kind. NEVER output "Here is your code".
"""
    return header + body

async def groq_generate_website(prompt: str) -> str:
    """Generate a complete, polished, animated HTML landing page using Groq (dedicated key)"""
    system_instruction = (
        "You are a world-class creative director and senior frontend engineer who has shipped landing pages for "
        "Stripe, Linear, and Apple. You obsess over two things above all else: zero dead whitespace (every section "
        "is filled edge-to-edge with real content, real photos, and real icons — never a blank gap) and tasteful, "
        "small, purposeful animation on every interactive element. You never use icon fonts or ligature text for "
        "icons, only inline SVG. You never use placeholder or fake image URLs — only real Unsplash photo IDs that "
        "exist. You ONLY return raw valid HTML. No explanations. No markdown. No code fences. "
        "No thinking out loud, no preamble, no commentary before or after the code. "
        "Your first character output must be < and your last must be >."
    )

    raw_response = await groq_chat(
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ],
        model="llama-3.3-70b-versatile",
        max_tokens=8192,
        temperature=0.85,
        api_key=settings.groq_api_key_2,
    )

    return extract_html(raw_response)
