import { ExternalLink, Sparkles, Trash2 } from 'lucide-react'
import type { Topic } from '../types'

interface TopicCardProps {
  topic: Topic
  onCreate?: (topic: Topic) => void
  onRemove?: (topic: Topic) => void
  dragHandleProps?: Record<string, any>
}

export default function TopicCard({ topic, onCreate, onRemove, dragHandleProps }: TopicCardProps) {
  const horizonColor = topic.horizon === 'now'
    ? { bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.25)', text: '#2dd4bf' }
    : { bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)', text: '#818cf8' }

  return (
    <div className="glass-card p-4 space-y-3" {...dragHandleProps}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
          style={{ background: horizonColor.bg, border: `1px solid ${horizonColor.border}`, color: horizonColor.text }}>
          {topic.horizon}
        </span>
        {topic.category && <span className="text-zinc-600 text-[10px] truncate">{topic.category}</span>}
      </div>

      <h3 className="text-white text-sm font-semibold leading-snug">{topic.title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed line-clamp-3">{topic.description}</p>

      {topic.sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topic.sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-teal-400 bg-white/[0.03] border border-white/[0.06] rounded-full px-2 py-0.5 transition-colors">
              <ExternalLink className="w-2.5 h-2.5" /> {s.name || 'Source'}
            </a>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {onCreate && (
          <button onClick={() => onCreate(topic)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1.5 rounded-lg transition-colors">
            <Sparkles className="w-3 h-3" /> Create
          </button>
        )}
        {onRemove && (
          <button onClick={() => onRemove(topic)}
            className="flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
