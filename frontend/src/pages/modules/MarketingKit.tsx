import { useState, useEffect } from 'react'
import { useProject, useUpdateProject } from '../../hooks/useProject'
import { useProjectStore } from '../../store/project'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { Megaphone, Webhook, Send, Upload, Camera, Linkedin, Twitter, Facebook, Activity } from 'lucide-react'
import api from '../../lib/api'

export default function MarketingKit() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const { data: project, isLoading } = useProject(activeProjectId)
  const { mutate: updateProject } = useUpdateProject(activeProjectId!)

  const [webhookInput, setWebhookInput] = useState('')
  const [isSavingWebhook, setIsSavingWebhook] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [sendingStates, setSendingStates] = useState<Record<number, boolean>>({})
  const [sentStates, setSentStates] = useState<Record<number, boolean>>({})
  const [isSendingBulk, setIsSendingBulk] = useState(false)
  const [bulkSent, setBulkSent] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [savedWebhook, setSavedWebhook] = useState(false)

  // Initialize input when project data loads
  useEffect(() => {
    if (project?.webhookUrl && !isSavingWebhook) {
      setWebhookInput(project.webhookUrl)
    }
  }, [project?.webhookUrl])

  if (isLoading) return <div className="p-8"><SkeletonGrid count={3} /></div>

  const posts = project?.marketingKit || []

  if (posts.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="glass-card p-8 text-center max-w-md">
          <p className="text-zinc-400">Marketing kit hasn't been generated yet.</p>
        </div>
      </div>
    )
  }

  const handleSaveWebhook = () => {
    setIsSavingWebhook(true)
    setSavedWebhook(false)
    updateProject(
      { webhookUrl: webhookInput },
      {
        onSuccess: () => { setSavedWebhook(true); setTimeout(() => setSavedWebhook(false), 3000) },
        onSettled: () => setIsSavingWebhook(false)
      }
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedImage(e.target.files[0])
    }
  }

  const handleAnalyzeCompetitors = async () => {
    if (!activeProjectId) return
    setIsAnalyzing(true)
    try {
      await api.post(`/api/projects/${activeProjectId}/analytics`)
    } catch (err) {
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getFileBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const sendPost = async (index: number) => {
    if (!activeProjectId) return
    setSendingStates(s => ({ ...s, [index]: true }))
    try {
      let imageBase64 = null
      if (uploadedImage) imageBase64 = await getFileBase64(uploadedImage)
      await api.post(`/api/projects/${activeProjectId}/webhook/marketing`, { postIndex: index, imageBase64 })
      setSentStates(s => ({ ...s, [index]: true }))
      setTimeout(() => setSentStates(s => ({ ...s, [index]: false })), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSendingStates(s => ({ ...s, [index]: false }))
    }
  }

  const sendAll = async () => {
    if (!activeProjectId) return
    setIsSendingBulk(true)
    setBulkSent(false)
    try {
      let imageBase64 = null
      if (uploadedImage) imageBase64 = await getFileBase64(uploadedImage)
      await api.post(`/api/projects/${activeProjectId}/webhook/marketing`, { imageBase64 })
      setBulkSent(true)
      setTimeout(() => setBulkSent(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSendingBulk(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase()
    if (p.includes('instagram')) return <Camera className="w-5 h-5 text-white" />
    if (p.includes('linkedin')) return <Linkedin className="w-5 h-5 text-white" />
    if (p.includes('twitter')) return <Twitter className="w-5 h-5 text-white" />
    if (p.includes('facebook')) return <Facebook className="w-5 h-5 text-white" />
    return <Megaphone className="w-5 h-5 text-white" />
  }

  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase()
    if (p.includes('instagram')) return 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500'
    if (p.includes('linkedin')) return 'bg-[#0077B5]'
    if (p.includes('twitter')) return 'bg-[#1DA1F2]'
    if (p.includes('facebook')) return 'bg-[#1877F2]'
    return 'bg-zinc-600'
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div className="flex items-center gap-4">
        <h1 className="text-white text-3xl font-bold">Marketing Kit</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Config & Analytics */}
        <div className="space-y-6 lg:col-span-1">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-teal-500/20 p-2 rounded-lg text-teal-400"><Webhook className="w-5 h-5" /></div>
              <h2 className="text-white font-semibold">n8n Webhook Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs mb-1.5">n8n Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                    className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400/50"
                    placeholder="https://your-n8n.com/webhook/..."
                  />
                  <button
                    onClick={handleSaveWebhook}
                    disabled={isSavingWebhook}
                    className={`border px-4 py-2 rounded-lg text-sm transition-colors ${
                      savedWebhook
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-zinc-300'
                    }`}
                  >
                    {isSavingWebhook ? 'Saving...' : savedWebhook ? 'Saved!' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <label className="block text-zinc-400 text-xs mb-1.5">Upload Image for Posts</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-4 py-2 rounded-lg text-zinc-300 text-sm transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Choose File</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {uploadedImage && <span className="text-teal-400 text-xs truncate max-w-[120px]">{uploadedImage.name}</span>}
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  onClick={handleAnalyzeCompetitors}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Competitor Socials'}
                </button>
              </div>
            </div>
          </div>

          {project?.competitorAnalytics && project.competitorAnalytics.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                <Activity className="text-indigo-400 w-5 h-5" /> Analytics Insights
              </h3>
              <div className="space-y-3">
                {project.competitorAnalytics.map((insight: any, i: number) => (
                  <div key={i} className="bg-black/20 rounded p-3 text-sm text-zinc-300">
                    <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(insight, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Posts */}
        <div className="lg:col-span-2 space-y-4">
          {posts.map((post, idx) => (
            <div key={idx} className="glass-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getPlatformColor(post.platform)}`}>
                  {getPlatformIcon(post.platform)}
                  <span className="text-white font-medium text-sm">{post.platform}</span>
                </div>
                {project?.webhookUrl && (
                  <button
                    onClick={() => sendPost(idx)}
                    disabled={sendingStates[idx]}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border ${
                      sentStates[idx]
                        ? 'text-green-400 bg-green-500/10 border-green-500/30'
                        : 'text-zinc-400 hover:text-teal-400 bg-white/[0.05] border-white/[0.08] hover:border-teal-400/50'
                    }`}
                  >
                    <Send className="w-3 h-3" /> {sendingStates[idx] ? 'Sending...' : sentStates[idx] ? 'Sent!' : 'Send to n8n'}
                  </button>
                )}
              </div>

              <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap mb-4">
                {post.content}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {post.hashtags.map((tag, i) => (
                  <span key={i} className="bg-teal-500/10 text-teal-400 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="bg-black/20 rounded-lg p-3">
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Image Prompt</div>
                <div className="text-zinc-400 text-xs italic">{post.imagePrompt}</div>
              </div>
            </div>
          ))}

          {project?.webhookUrl && (
            <button
              onClick={sendAll}
              disabled={isSendingBulk}
              className={`w-full mt-4 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border ${
                bulkSent
                  ? 'bg-green-500/20 border-green-400/50 text-green-300'
                  : 'bg-teal-500/20 hover:bg-teal-500/30 border-teal-400/50 text-teal-300'
              }`}
            >
              <Send className="w-5 h-5" />
              {isSendingBulk ? 'Sending All Posts...' : bulkSent ? 'All Posts Sent!' : 'Send All Posts to n8n'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
