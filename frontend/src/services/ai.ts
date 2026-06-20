import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Project } from '../types'

const handleAIError = (error: unknown): never => {
  console.error('AI Error:', error)
  throw new Error(
    error instanceof Error ? error.message : 'Failed to generate AI data.'
  )
}

export const generateWebsiteCode = async (project: Project): Promise<string> => {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!geminiApiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured in .env.local.')
  }

  const systemInstruction = `You are a world-class creative director and senior frontend engineer. You ONLY return raw valid HTML. No explanations. No markdown. No code fences. No thinking out loud. Your first character output must be < and your last must be >.`

  const prompt = `Create a breathtaking, award-winning single-page landing page.

Business Idea: ${project.idea}
${project.industry ? `Industry: ${project.industry}` : ''}
${project.targetAudience ? `Target Audience: ${project.targetAudience}` : ''}
${project.location ? `Location: ${project.location}` : ''}

DESIGN REQUIREMENTS:
- Match the visual language to the business soul (dark premium for tech, warm organic for health, etc.)
- GLASS UI: Hero with backdrop-filter: blur(20px); glass cards; frosted sticky nav
- ANIMATIONS: CSS-only. Hero fadeUp entrance, staggered cards, hover translateY(-6px) + glow
- TYPOGRAPHY: Import 2 matching Google Fonts. Hero headline 72px+, font-weight: 800
- LAYOUT: Full-bleed hero → Social proof → Bento grid features → Stats → How it works → Testimonials → CTA → Footer
- Colors: CSS custom properties :root { --primary, --accent, --bg }. Deep dark background
- Glass cards: background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(16px)
- Buttons: gradient background, box-shadow glow, translateY(-3px) on hover
- MUST include: sticky glass navbar, full-viewport hero with animated gradient mesh, features bento grid, 3 stats numbers, testimonials with avatars, CTA section, footer
- Self-contained HTML, Tailwind CSS via CDN, smooth scroll, mobile responsive
- Images: Unsplash URLs only for content images

OUTPUT: Start exactly with <!DOCTYPE html> and end with </html>. Zero text before or after.`

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }], role: 'system' },
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: 65536,
        // @ts-ignore - disable thinking to get clean HTML output without reasoning preamble
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    // Extract ONLY non-thought parts (thinking models return thought parts separately)
    const parts = result.response.candidates?.[0]?.content?.parts ?? []
    const nonThoughtText = parts
      .filter((p: any) => !p.thought)
      .map((p: any) => p.text ?? '')
      .join('')

    let code = nonThoughtText.trim() || result.response.text().trim()

    // Strip markdown fences if present
    const fenceMatch = code.match(/```(?:html)?\s*([\s\S]*?)\s*```/i)
    if (fenceMatch) code = fenceMatch[1]

    // Strip any preamble text before <!DOCTYPE or <html
    const doctypeIdx = code.indexOf('<!DOCTYPE')
    const htmlIdx = code.indexOf('<html')
    const startIdx = doctypeIdx !== -1 ? doctypeIdx : htmlIdx !== -1 ? htmlIdx : -1
    if (startIdx > 0) code = code.substring(startIdx)

    // Strip anything after </html>
    const endIdx = code.lastIndexOf('</html>')
    if (endIdx !== -1) code = code.substring(0, endIdx + 7)

    if (!code.trim().match(/^<!DOCTYPE|^<html/i)) {
      throw new Error('Invalid HTML response from model. Try regenerating.')
    }

    return code.trim()
  } catch (error) {
    return handleAIError(error)
  }
}
