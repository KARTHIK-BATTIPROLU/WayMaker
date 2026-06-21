import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Linkedin, RefreshCw, Image as ImageIcon, Send, CheckCircle, Edit3 } from 'lucide-react'
import { useSessionPoll } from '../useSessionPoll'
import { approveSession, regeneratePost, regenerateImages, editPostText, deployOne } from '../api'
import { useAuthStore } from '../../../store/auth'

const STATUS_LABEL: Record<string, string> = {
  starting: 'Starting…',
  generating_post: 'Writing the post…',
  generating_images: 'Generating images…',
}

export default function PreviewPanel() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session, loading, refetch, setSession } = useSessionPoll(sessionId)
  const user = useAuthStore((s) => s.user)
  const [editing, setEditing] = useState(false)
  const [draftText, setDraftText] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<string | null>(null)

  useEffect(() => {
    if (session?.post_text && !editing) setDraftText(session.post_text)
  }, [session?.post_text, editing])

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

  if (session.status !== 'preview') {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="w-8 h-8 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
        <p className="text-zinc-500 text-sm">{STATUS_LABEL[session.status] ?? session.status}</p>
      </div>
    )
  }

  const handleSaveEdit = async () => {
    if (!sessionId) return
    await editPostText(sessionId, draftText)
    setSession({ ...session, post_text: draftText })
    setEditing(false)
  }

  const handleRegeneratePost = async () => {
    if (!sessionId) return
    await regeneratePost(sessionId)
    refetch()
  }

  const handleRegenerateImages = async () => {
    if (!sessionId) return
    await regenerateImages(sessionId)
    refetch()
  }

  const handleApprove = async () => {
    if (!sessionId) return
    const updated = await approveSession(sessionId)
    setSession(updated)
  }

  const handleDeploy = async () => {
    if (!sessionId) return
    setDeploying(true)
    setDeployStatus(null)
    try {
      const res = await deployOne(sessionId, 'linkedin')
      setDeployStatus(res.status)
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in-up">
      <h1 className="text-white text-2xl font-bold mb-6">LinkedIn Post Preview</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm">Caption</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-teal-400">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <textarea
                  rows={10}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="input-base resize-none w-full text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="btn-gradient px-4 py-2 rounded-lg text-xs font-semibold">Save</button>
                  <button onClick={() => { setEditing(false); setDraftText(session.post_text ?? '') }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 border border-white/[0.08]">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{session.post_text}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {(session.hashtags ?? []).map((tag, i) => (
                <span key={i} className="bg-teal-500/10 text-teal-400 text-xs px-2 py-1 rounded">{tag}</span>
              ))}
            </div>

            <button onClick={handleRegeneratePost} className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" /> Regenerate post
            </button>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Images</h2>
              <button onClick={handleRegenerateImages} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white">
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
            {(session.image_urls ?? []).length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {session.image_urls!.map((url, i) => (
                  <img key={i} src={url} alt="" className="rounded-lg w-full aspect-square object-cover" />
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-xs italic">No images yet (image generation may be in dummy mode).</p>
            )}
          </div>
        </div>

        {/* Live card mock */}
        <div className="space-y-4">
          <div className="glass-card p-6">
            <h2 className="text-white font-semibold text-sm mb-4">Live Preview</h2>
            <div className="rounded-xl bg-white text-black p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#0077B5] flex items-center justify-center text-white font-bold text-sm">
                  {(user?.email?.[0] ?? 'W').toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm">{user?.email ?? 'Waymaker User'}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <Linkedin className="w-3 h-3" /> Now
                  </div>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap mb-3">{session.post_text}</p>
              {(session.image_urls ?? []).length > 0 && (
                <img src={session.image_urls![0]} alt="" className="rounded-lg w-full object-cover mb-2" />
              )}
              <div className="flex flex-wrap gap-1">
                {(session.hashtags ?? []).map((tag, i) => (
                  <span key={i} className="text-[#0077B5] text-xs">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-3">
            {!session.approved ? (
              <button onClick={handleApprove} className="w-full flex items-center justify-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            ) : (
              <div className="flex items-center gap-2 text-teal-400 text-sm"><CheckCircle className="w-4 h-4" /> Approved</div>
            )}

            <button
              onClick={handleDeploy}
              disabled={deploying}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                deployStatus === 'deployed'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-[#0077B5]/10 border-[#0077B5]/40 text-[#4db8e8] hover:bg-[#0077B5]/20'
              }`}
            >
              <Send className="w-4 h-4" />
              {deploying ? 'Deploying…' : deployStatus === 'deployed' ? 'Deployed!' : deployStatus === 'skipped' ? 'Skipped (n8n in dummy mode)' : 'Deploy to LinkedIn via n8n'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
