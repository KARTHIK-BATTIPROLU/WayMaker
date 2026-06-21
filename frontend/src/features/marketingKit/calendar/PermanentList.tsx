import { useDroppable } from '@dnd-kit/core'
import { Bookmark } from 'lucide-react'
import TopicCard from './TopicCard'
import type { PermanentTopic, Topic } from '../types'

interface PermanentListProps {
  topics: PermanentTopic[]
  onCreate: (topic: Topic) => void
  onRemove: (topic: PermanentTopic) => void
}

export default function PermanentList({ topics, onCreate, onRemove }: PermanentListProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'permanent-list' })

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl p-4 min-h-[200px] transition-colors"
      style={{
        background: isOver ? 'rgba(129,140,248,0.06)' : 'transparent',
        border: `1px dashed ${isOver ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
        <Bookmark className="w-3.5 h-3.5" /> Permanent List · drop topics here
      </div>
      {topics.length === 0 ? (
        <p className="text-zinc-600 text-sm italic">Drag a topic from today's list to save it for later.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topics.map((topic) => (
            <TopicCard key={topic._id} topic={topic} onCreate={onCreate} onRemove={() => onRemove(topic)} />
          ))}
        </div>
      )}
    </div>
  )
}
