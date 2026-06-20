import { useState, useEffect } from 'react'
import { useProject, useUpdateProject } from '../../hooks'
import { useProjectStore } from '../../store/project'
import { Plug, Webhook, Zap, CheckCircle2, Info, BookOpen } from 'lucide-react'

export default function Deployments() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const { data: project, isLoading } = useProject(activeProjectId)
  const { mutate: updateProject, isPending: isSaving } = useUpdateProject(activeProjectId!)

  const [webhookUrl, setWebhookUrl] = useState('')
  const [zapierUrl, setZapierUrl] = useState('')
  const [saved, setSaved] = useState(false)

  // Initialize from project data or fallback to localStorage cache for new projects
  useEffect(() => {
    if (project) {
      const dbWebhook = project.webhookUrl
      const dbZapier = project.zapierWebhookUrl
      
      const cachedWebhook = localStorage.getItem('waymaker_default_n8n_webhook_url') || ''
      const cachedZapier = localStorage.getItem('waymaker_default_zapier_webhook_url') || ''
      
      setWebhookUrl(dbWebhook || cachedWebhook)
      setZapierUrl(dbZapier || cachedZapier)
    }
  }, [project])

  const handleSave = () => {
    updateProject(
      { webhookUrl, zapierWebhookUrl: zapierUrl },
      {
        onSuccess: () => {
          if (webhookUrl) localStorage.setItem('waymaker_default_n8n_webhook_url', webhookUrl)
          if (zapierUrl) localStorage.setItem('waymaker_default_zapier_webhook_url', zapierUrl)
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        }
      }
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="glass-card p-8 text-center max-w-md">
          <Info className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">No active project selected</p>
          <p className="text-zinc-400 text-sm">Please select or create a project first from the dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-5">
        <div className="bg-violet-500/10 p-3 rounded-2xl text-violet-400 border border-violet-500/20">
          <Plug className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-white text-2xl font-bold font-display">Integrations & Deployments</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Configure external automation webhooks and trigger workflows for <strong className="text-teal-300">{project.name}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Configuration Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* n8n Form Card */}
          <div className="glass-card p-6 border-l-4 border-teal-500 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/5 rounded-full blur-xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-teal-500/15 p-2.5 rounded-xl text-teal-400 border border-teal-500/20">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white text-base font-semibold">n8n Automation Webhook</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Integrate social marketing posts into your workflows.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-teal-400/50 transition-colors"
                placeholder="https://your-n8n-instance.com/webhook/..."
              />
              <p className="text-zinc-500 text-[10px] italic">
                Tip: Leave empty to clear, or set a webhook URL to cache and apply it automatically.
              </p>
            </div>
          </div>

          {/* Zapier Form Card */}
          <div className="glass-card p-6 border-l-4 border-orange-500 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/5 rounded-full blur-xl"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-500/15 p-2.5 rounded-xl text-orange-400 border border-orange-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white text-base font-semibold">Zapier Webhook (Catch Hook)</h2>
                <p className="text-zinc-400 text-xs mt-0.5">Deploy generated HTML code instantly to hostings or drives.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={zapierUrl}
                onChange={(e) => setZapierUrl(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-orange-400/50 transition-colors"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
              <p className="text-zinc-500 text-[10px] italic">
                Requirement: Use a Zapier Webhook trigger of type "Catch Hook".
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-end">
            {saved && (
              <div className="flex items-center gap-2 text-green-400 mr-5 animate-in fade-in slide-in-from-right-4">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-sm font-semibold">Configuration saved successfully!</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-violet-500 hover:bg-violet-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-violet-500/10 active:scale-[0.98] disabled:opacity-75 flex items-center justify-center min-w-[180px]"
            >
              {isSaving ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Right Side - Guides & Technical Info */}
        <div className="space-y-6">
          <div className="glass-card p-5 border border-white/[0.04] bg-white/[0.01]">
            <h3 className="text-white text-sm font-bold flex items-center gap-2 mb-4">
              <BookOpen className="text-teal-400 w-4 h-4" /> Integration Specs
            </h3>

            {/* n8n info */}
            <div className="space-y-4 text-xs">
              <div className="pb-4 border-b border-white/[0.06]">
                <h4 className="text-teal-300 font-semibold mb-1 flex items-center gap-1">
                  <Webhook className="w-3.5 h-3.5" /> n8n Schema
                </h4>
                <p className="text-zinc-400 mb-2 leading-relaxed">
                  Triggers from the <strong>Marketing Kit</strong>. Dispatches the copywriting text, platform tags, and images as base64.
                </p>
                <div className="bg-black/40 p-2.5 rounded font-mono text-[10px] text-teal-400 overflow-x-auto">
                  {`{
  "postIndex": number,
  "imageBase64": "data:image/..." 
}`}
                </div>
              </div>

              {/* Zapier info */}
              <div>
                <h4 className="text-orange-300 font-semibold mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Zapier Schema
                </h4>
                <p className="text-zinc-400 mb-2 leading-relaxed">
                  Triggers from the <strong>Landing Page Builder</strong>. Dispatches the full index HTML file to deploy.
                </p>
                <div className="bg-black/40 p-2.5 rounded font-mono text-[10px] text-orange-400 overflow-x-auto">
                  {`{
  "projectName": string,
  "websiteCode": "<html>...",
  "timestamp": "ISO-8601"
}`}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border border-white/[0.04] bg-white/[0.01]">
            <h4 className="text-white text-xs font-bold mb-2 flex items-center gap-1.5">
              <Info className="text-violet-400 w-4 h-4" /> Autocomplete Caching
            </h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              To speed up your workflow, we cache your latest Webhook and Zapier URLs locally. 
              Creating any new project will automatically pre-fill these configurations to get you building instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
