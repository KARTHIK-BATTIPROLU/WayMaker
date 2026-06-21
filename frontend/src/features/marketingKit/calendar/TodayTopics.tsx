import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import TopicCard from './TopicCard'
import type { Topic } from '../types'

function DraggableTopic({ topic, onCreate }: { topic: Topic; onCreate: (t: Topic) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `today:${topic._id}`,
    data: { topic },
  })

  return (
    <div ref={setNodeRef} className={isDragging ? 'opacity-40' : ''}>
      <div className="relative">
        <div {...attributes} {...listeners} className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing z-10">
          <GripVertical className="w-4 h-4" />
        </div>
        <TopicCard topic={topic} onCreate={onCreate} />
      </div>
    </div>
  )
}

interface TodayTopicsProps {
  topics: Topic[]
  onCreate: (topic: Topic) => void
}

export default function TodayTopics({ topics, onCreate }: TodayTopicsProps) {
  if (topics.length === 0) {
    return <p className="text-zinc-600 text-sm italic">No topics yet — trigger a refresh or check back after the daily 7pm IST run.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {topics.map((topic) => (
        <DraggableTopic key={topic._id} topic={topic} onCreate={onCreate} />
      ))}
    </div>
  )
}
