import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Linkedin, LayoutGrid, ImagePlus, X } from 'lucide-react'
import { runOwnIdea, runOwnIdeaPlatform, uploadBrandAsset } from '../api'
import { useProjectStore } from '../../../store/project'

const PLATFORM_OPTIONS = ['LinkedIn', 'Twitter', 'Instagram', 'Facebook']

export default function OwnIdeaFlow() {
  const navigate = useNavigate()
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'linkedin' | 'platform'>('linkedin')
  const [platforms, setPlatforms] = useState<string[]>(['LinkedIn', 'Twitter'])
  const [submitting, setSubmitting] = useState(false)
  const [assetPreview, setAssetPreview] = useState<string | null>(null)
  const [assetError, setAssetError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const togglePlatform = (p: string) => {
    setPlatforms((cur) => cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p])
  }

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAssetError(null)
    const reader = new FileReader()
    reader.onload = () => setAssetPreview(reader.result as string)
    reader.onerror = () => setAssetError('Could not read that file.')
    reader.readAsDataURL(file)
  }

  const clearAsset = () => {
    setAssetPreview(null)
    setAssetError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      let brandAssetUrl: string | undefined
      if (assetPreview) {
        try {
          brandAssetUrl = await uploadBrandAsset(assetPreview)
        } catch (err) {
          console.error('[OwnIdeaFlow] asset upload error', err)
          setAssetError('Brand asset upload failed — generating without it.')
        }
      }
      if (mode === 'linkedin') {
        const { session_id } = await runOwnIdea(trimmed, brandAssetUrl, activeProjectId)
        navigate(`/dashboard/marketing-kit/preview/${session_id}`)
      } else {
        const { session_id } = await runOwnIdeaPlatform(trimmed, platforms, brandAssetUrl, activeProjectId)
        navigate(`/dashboard/marketing-kit/platform/${session_id}`)
      }
    } catch (err) {
      console.error('[OwnIdeaFlow] submit error', err)
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto pt-12 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Own Idea</h1>
        <p className="text-zinc-500 text-sm">Describe what you want to post about — we'll handle the rest</p>
      </div>

      <div className="grad-border p-[1px] rounded-2xl">
        <div className="rounded-2xl p-7" style={{ background: '#0c0c1a' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div
              className="flex rounded-xl p-1 gap-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {(
                [
                  { value: 'linkedin', icon: Linkedin, label: 'LinkedIn Post', hint: 'One polished LinkedIn post' },
                  { value: 'platform', icon: LayoutGrid, label: 'Multi-Platform Kit', hint: 'One post per platform' },
                ] as const
              ).map(({ value, icon: Icon, label, hint }) => {
                const active = mode === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all"
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(244,114,182,0.18), rgba(129,140,248,0.18))',
                      border: '1px solid rgba(244,114,182,0.35)',
                      color: '#f472b6',
                    } : { color: '#52525b', border: '1px solid transparent' }}
                    title={hint}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </button>
                )
              })}
            </div>

            {mode === 'platform' && (
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((p) => {
                  const active = platforms.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={active
                        ? { background: 'rgba(244,114,182,0.12)', border: '1px solid rgba(244,114,182,0.35)', color: '#f472b6' }
                        : { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#52525b' }
                      }
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            )}

            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">Brand asset (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAssetChange}
                className="hidden"
                id="brand-asset-input"
              />
              {assetPreview ? (
                <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img src={assetPreview} alt="Brand asset preview" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <span className="text-zinc-400 text-xs flex-1 truncate">Used as a style reference for generated images</span>
                  <button type="button" onClick={clearAsset} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="brand-asset-input"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', color: '#71717a' }}
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Upload a logo or reference image
                </label>
              )}
              {assetError && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{assetError}</p>}
            </div>

            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                What's the idea? <span style={{ color: '#f472b6' }}>*</span>
              </label>
              <textarea
                rows={5}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-base resize-none w-full"
                style={{ borderRadius: '14px' }}
                placeholder="e.g. We just shipped a new onboarding flow that cuts signup time in half…"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !input.trim() || (mode === 'platform' && platforms.length === 0)}
              className="btn-gradient w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting
                ? <><span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Generating…</>
                : <><Sparkles className="w-4 h-4" /> Generate</>
              }
            </button>
          </form>
        </div>
      </div>
      <p className="text-center text-zinc-700 text-xs mt-5">⌘+Enter to submit</p>
    </div>
  )
}
