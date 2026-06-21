import { useState } from 'react'
import { ExternalLink, Plus, X, Rss } from 'lucide-react'
import type { FollowedSource } from '../types'
import { addSource, deleteSource } from '../api'

interface SourcesPanelProps {
  sources: FollowedSource[]
  onChange: (sources: FollowedSource[]) => void
}

export default function SourcesPanel({ sources, onChange }: SourcesPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<FollowedSource['type']>('rss')
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim() || saving) return
    setSaving(true)
    try {
      const created = await addSource({ name: name.trim(), url: url.trim(), type })
      onChange([...sources, created])
      setName(''); setUrl(''); setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    await deleteSource(id)
    onChange(sources.filter((s) => s._id !== id))
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <Rss className="w-4 h-4 text-indigo-400" /> Pulling topics from
        </h2>
        <button onClick={() => setShowForm((s) => !s)} className="text-zinc-500 hover:text-white">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        {sources.length === 0 && <p className="text-zinc-600 text-xs italic">No sources yet — add an RSS feed or site to follow.</p>}
        {sources.map((s) => (
          <div key={s._id} className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
            <a href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-teal-400 truncate min-w-0">
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{s.name}</span>
              <span className="text-zinc-600 shrink-0">· {s.type}</span>
            </a>
            <button onClick={() => handleRemove(s._id)} className="text-zinc-600 hover:text-red-400 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-2 pt-2 border-t border-white/[0.06]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Source name"
            className="input-base w-full text-xs py-2"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/feed.xml"
            className="input-base w-full text-xs py-2"
          />
          <select value={type} onChange={(e) => setType(e.target.value as FollowedSource['type'])}
            className="input-base w-full text-xs py-2">
            <option value="rss">RSS</option>
            <option value="website">Website</option>
            <option value="twitter">Twitter</option>
            <option value="youtube">YouTube</option>
            <option value="blog">Blog</option>
          </select>
          <button type="submit" disabled={saving} className="btn-gradient w-full py-2 rounded-lg text-xs font-semibold">
            {saving ? 'Adding…' : 'Add Source'}
          </button>
        </form>
      )}
    </div>
  )
}
