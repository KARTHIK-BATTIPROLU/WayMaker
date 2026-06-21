import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Camera, Linkedin, Twitter, Facebook, Megaphone, Send, CheckCircle } from 'lucide-react'
import { useSessionPoll } from '../useSessionPoll'
import { deployOne, deployAll } from '../api'

const STATUS_LABEL: Record<string, string> = {
  starting: 'Starting…',
  generating_kit: 'Writing posts for each platform…',
  generating_images: 'Generating images…',
}

function getPlatformIcon(platform: string) {
  const p = platform.toLowerCase()
  if (p.includes('instagram')) return <Camera className="w-5 h-5 text-white" />
  if (p.includes('linkedin')) return <Linkedin className="w-5 h-5 text-white" />
  if (p.includes('twitter')) return <Twitter className="w-5 h-5 text-white" />
  if (p.includes('facebook')) return <Facebook className="w-5 h-5 text-white" />
  return <Megaphone className="w-5 h-5 text-white" />
}

function getPlatformColor(platform: string) {
  const p = platform.toLowerCase()
  if (p.includes('instagram')) return 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500'
  if (p.includes('linkedin')) return 'bg-[#0077B5]'
  if (p.includes('twitter')) return 'bg-[#1DA1F2]'
  if (p.includes('facebook')) return 'bg-[#1877F2]'
  return 'bg-zinc-600'
}

export default function PlatformPreview() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, loading, setSession } = useSessionPoll(sessionId)
  const [deployingAll, setDeployingAll] = useState(false)
  const [deployingOne, setDeployingOne] = useState<string | null>(null)

  if (loading || !session) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <span className="w-8 h-8 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
      </div>
    )
  }

  if (session.status === 'error') {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="glass-card p-8">
          <p className="text-red-400 text-sm">Generation failed: {session.error}</p>
        </div>
      </div>
    )
  }

  if (session.status !== 'platform_preview') {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="w-8 h-8 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
        <p className="text-zinc-500 text-sm">{STATUS_LABEL[session.status] ?? session.status}</p>
      </div>
    )
  }

  const kit = session.marketing_kit ?? []
  const deployResults = session.deploy_results ?? {}

  const handleDeployOne = async (platform: string) => {
    if (!sessionId) return
    setDeployingOne(platform)
    try {
      const res = await deployOne(sessionId, platform)
      setSession({ ...session, deploy_results: { ...deployResults, [platform]: res.response } })
    } finally {
      setDeployingOne(null)
    }
  }

  const handleDeployAll = async () => {
    if (!sessionId) return
    setDeployingAll(true)
    try {
      const res = await deployAll(sessionId)
      setSession({ ...session, deploy_results: res.results })
    } finally {
      setDeployingAll(false)
    }
  }

  const statusLabel = (platform: string) => {
    const key = Object.keys(deployResults).find((k) => k.toLowerCase() === platform.toLowerCase())
    const result = key ? deployResults[key] : undefined
    if (!result) return null
    if (result.status === 'deployed') return { text: 'Deployed!', cls: 'text-green-400 bg-green-500/10 border-green-500/30' }
    if (result.status === 'skipped') return { text: 'Skipped (dummy)', cls: 'text-zinc-400 bg-white/[0.05] border-white/[0.08]' }
    return { text: 'Failed', cls: 'text-red-400 bg-red-500/10 border-red-500/30' }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Multi-Platform Kit</h1>
        <button
          onClick={handleDeployAll}
          disabled={deployingAll}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> {deployingAll ? 'Deploying All…' : 'Deploy All via n8n'}
        </button>
      </div>

      <div className="space-y-4">
        {kit.map((item, idx) => {
          const status = statusLabel(item.platform)
          return (
            <div key={idx} className="glass-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getPlatformColor(item.platform)}`}>
                  {getPlatformIcon(item.platform)}
                  <span className="text-white font-medium text-sm">{item.platform}</span>
                </div>
                <button
                  onClick={() => handleDeployOne(item.platform)}
                  disabled={deployingOne === item.platform}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border ${
                    status?.cls ?? 'text-zinc-400 hover:text-teal-400 bg-white/[0.05] border-white/[0.08] hover:border-teal-400/50'
                  }`}
                >
                  {status?.text === 'Deployed!' ? <CheckCircle className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                  {deployingOne === item.platform ? 'Deploying…' : status?.text ?? 'Deploy'}
                </button>
              </div>

              {item.image_url && (
                <img src={item.image_url} alt="" className="rounded-lg w-full max-h-64 object-cover mb-4" />
              )}

              <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap mb-4">{item.content}</div>

              <div className="flex flex-wrap gap-2">
                {item.hashtags.map((tag, i) => (
                  <span key={i} className="bg-teal-500/10 text-teal-400 text-xs px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
