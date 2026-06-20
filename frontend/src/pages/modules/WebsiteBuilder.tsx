import { useState, useEffect } from 'react'
import { useProject, useUpdateProject } from '../../hooks'
import { useProjectStore } from '../../store/project'
import { Download, Copy, Send, Sparkles, Eye, Code, RefreshCw, AlertCircle, CheckCircle2, ExternalLink, Monitor, Smartphone } from 'lucide-react'
import { generateWebsiteCode } from '../../services/ai'

const getSafeHtml = (html: string) => `${html}
<script>
  document.addEventListener('click',function(e){const a=e.target.closest('a');if(a){e.preventDefault();}});
  document.addEventListener('submit',function(e){e.preventDefault();});
</script>`

const loadingSteps = [
  { icon: '🔍', text: 'Analyzing your business concept & competitors...' },
  { icon: '🎨', text: 'Selecting an industry-matched color palette...' },
  { icon: '✍️', text: 'Writing persuasive landing page copy...' },
  { icon: '⚡', text: 'Building responsive Tailwind CSS layout...' },
  { icon: '💎', text: 'Adding glassmorphism & animation effects...' },
  { icon: '🚀', text: 'Finalizing and polishing the page...' },
]

export default function WebsiteBuilder() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const { data: project, isLoading } = useProject(activeProjectId)
  const { mutateAsync: updateProject } = useUpdateProject(activeProjectId!)

  const [tab, setTab]               = useState<'preview'|'code'>('preview')
  const [device, setDevice]         = useState<'desktop'|'mobile'>('desktop')
  const [copied, setCopied]         = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError]           = useState<string|null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [sendingZap, setSendingZap] = useState(false)
  const [zapStatus, setZapStatus]   = useState<'idle'|'success'|'error'>('idle')

  useEffect(() => {
    let t: any
    if (generating) {
      t = setInterval(() => setLoadingStep(p => p < loadingSteps.length - 1 ? p + 1 : p), 4500)
    } else { setLoadingStep(0) }
    return () => clearInterval(t)
  }, [generating])

  const handleGenerate = async () => {
    if (!project) return
    setGenerating(true); setError(null)
    try {
      const code = await generateWebsiteCode(project)
      await updateProject({ websiteCode: code })
    } catch (e: any) { setError(e.message || 'Generation failed. Please try again.') }
    finally { setGenerating(false) }
  }

  const handleDownload = () => {
    if (!project?.websiteCode) return
    const blob = new Blob([project.websiteCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `landing-${project.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.html`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleOpenInTab = () => {
    if (!project?.websiteCode) return
    const blob = new Blob([project.websiteCode], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  const handleCopy = () => {
    if (!project?.websiteCode) return
    navigator.clipboard.writeText(project.websiteCode)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleZapier = async () => {
    if (!project?.zapierWebhookUrl) { alert('Configure Zapier URL in Deployments first.'); return }
    setSendingZap(true); setZapStatus('idle')
    try {
      await fetch(project.zapierWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: project.name, websiteCode: project.websiteCode, timestamp: new Date().toISOString() }), mode: 'no-cors' })
      setZapStatus('success'); setTimeout(() => setZapStatus('idle'), 3000)
    } catch { setZapStatus('error'); setTimeout(() => setZapStatus('idle'), 3000) }
    finally { setSendingZap(false) }
  }

  /* ── Loading ── */
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-teal-500 animate-spin" />
    </div>
  )

  /* ── No project ── */
  if (!project) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="glass-card p-8 text-center max-w-sm">
        <AlertCircle className="w-10 h-10 mx-auto mb-4" style={{ color: '#f87171' }} />
        <p className="text-white font-semibold mb-1">No project selected</p>
        <p className="text-zinc-500 text-sm">Select or create a project from the dashboard.</p>
      </div>
    </div>
  )

  /* ── Generate prompt ── */
  if (!project.websiteCode && !generating) return (
    <div className="p-8 flex items-center justify-center min-h-[560px]">
      <div className="max-w-md w-full animate-scale-in">
        <div className="grad-border p-[1px] rounded-2xl">
          <div className="rounded-2xl p-8 text-center" style={{ background: '#0c0c1a' }}>
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center animate-float"
              style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)' }}>
              <Sparkles className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-3">Generate Landing Page</h2>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Create a production-ready, award-winning landing page custom-designed for{' '}
              <strong className="text-teal-400">{project.name}</strong> using Gemini AI + Tailwind CSS.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 mb-6 text-left">
              {['Glassmorphism design', 'CSS animations', 'Mobile responsive', 'Download & deploy'].map((f,i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" /> {f}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl text-xs flex items-start gap-2 text-left"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button onClick={handleGenerate}
              className="btn-gradient w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  /* ── Generating ── */
  if (generating) return (
    <div className="p-8 flex items-center justify-center min-h-[560px]">
      <div className="max-w-sm w-full text-center animate-fade-in-up">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 animate-spin"
            style={{ borderColor: 'transparent', borderTopColor: '#2dd4bf', borderRightColor: '#818cf8' }} />
          <div className="absolute inset-2 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(45,212,191,0.08)' }}>
            <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
          </div>
        </div>

        <h3 className="text-white text-lg font-bold mb-2">Generating Your Landing Page</h3>
        <p className="text-teal-400 text-xs font-medium mb-6 min-h-4 animate-pulse">
          {loadingSteps[loadingStep].icon} {loadingSteps[loadingStep].text}
        </p>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {loadingSteps.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: i <= loadingStep ? 20 : 6, background: i <= loadingStep ? '#2dd4bf' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%`, background: 'linear-gradient(90deg,#2dd4bf,#818cf8)' }} />
        </div>
        <p className="text-zinc-700 text-[11px] mt-3">This typically takes 15–25 seconds</p>
      </div>
    </div>
  )

  /* ── Main preview/code view ── */
  return (
    <div className="flex flex-col h-full p-6 gap-5" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="text-white text-xl font-bold font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" /> Landing Page Builder
          </h1>
          <p className="text-zinc-600 text-xs mt-0.5">
            Visual editor for <strong className="text-teal-400">{project.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab switcher */}
          <div className="flex p-1 rounded-xl gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {([['preview','Preview',Eye],['code','Source',Code]] as const).map(([val, lbl, Ico]) => (
              <button key={val} onClick={() => setTab(val as any)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={tab === val
                  ? { background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.2)' }
                  : { color: '#71717a' }}>
                <Ico className="w-3.5 h-3.5" /> {lbl}
              </button>
            ))}
          </div>

          {/* Device switcher (preview only) */}
          {tab === 'preview' && (
            <div className="flex p-1 rounded-xl gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setDevice('desktop')}
                className="p-1.5 rounded-lg transition-all"
                style={device==='desktop' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : { color: '#52525b' }}>
                <Monitor className="w-4 h-4" />
              </button>
              <button onClick={() => setDevice('mobile')}
                className="p-1.5 rounded-lg transition-all"
                style={device==='mobile' ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : { color: '#52525b' }}>
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          <button onClick={handleGenerate}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', color: '#2dd4bf' }}>
            <RefreshCw className="w-3.5 h-3.5" /> Re-generate
          </button>
          <button onClick={handleOpenInTab}
            className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl">
            <ExternalLink className="w-3.5 h-3.5" /> Open Tab
          </button>
          <button onClick={handleDownload}
            className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl">
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          {project.zapierWebhookUrl && (
            <button onClick={handleZapier} disabled={sendingZap}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
              style={zapStatus==='success'
                ? { background:'rgba(52,211,153,0.1)', borderColor:'rgba(52,211,153,0.3)', color:'#34d399' }
                : { background:'rgba(192,132,252,0.08)', borderColor:'rgba(192,132,252,0.25)', color:'#c084fc' }}>
              <Send className="w-3.5 h-3.5" />
              {sendingZap ? 'Sending…' : zapStatus==='success' ? 'Dispatched!' : 'Send to Zapier'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Preview / Code */}
      <div className="flex-1 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', minHeight: 600 }}>
        {tab === 'preview' ? (
          <div className="w-full h-full flex justify-center" style={{ background: '#fff', minHeight: 600 }}>
            <iframe
              title="Preview"
              srcDoc={getSafeHtml(project.websiteCode || '')}
              sandbox="allow-scripts allow-same-origin"
              className="border-0 bg-white transition-all duration-300"
              style={{
                width: device === 'mobile' ? 390 : '100%',
                height: '100%',
                minHeight: 600,
                boxShadow: device === 'mobile' ? '0 0 0 1px rgba(0,0,0,0.1)' : 'none',
              }}
            />
          </div>
        ) : (
          <div className="relative h-full" style={{ minHeight: 600, background: 'rgba(0,0,0,0.5)' }}>
            <button onClick={handleCopy}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs z-20 transition-all"
              style={copied
                ? { background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', color:'#34d399' }
                : { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#a1a1aa' }}>
              {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Code</>}
            </button>
            <pre className="h-full overflow-auto p-6" style={{ maxHeight: 700 }}>
              <code className="text-xs font-mono leading-relaxed" style={{ color: 'rgba(45,212,191,0.85)' }}>
                {project.websiteCode}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
