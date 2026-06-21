import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { RefreshCw, Sparkles, X } from 'lucide-react'
import SourcesPanel from './SourcesPanel'
import TodayTopics from './TodayTopics'
import PermanentList from './PermanentList'
import {
  getTodayTopics, getPermanentTopics, getSources,
  addPermanentTopic, deletePermanentTopic, refreshCalendarNow, generateFromTopic,
} from '../api'
import type { Topic, PermanentTopic, FollowedSource } from '../types'

const PLATFORM_OPTIONS = ['LinkedIn', 'Twitter', 'Instagram', 'Facebook']

export default function CalendarView() {
  const navigate = useNavigate()
  const [todayTopics, setTodayTopics] = useState<Topic[]>([])
  const [permanent, setPermanent] = useState<PermanentTopic[]>([])
  const [sources, setSources] = useState<FollowedSource[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null)
  const [createTopic, setCreateTopic] = useState<Topic | null>(null)

  useEffect(() => {
    Promise.all([getTodayTopics(), getPermanentTopics(), getSources()])
      .then(([today, perm, src]) => {
        setTodayTopics(today)
        setPermanent(perm)
        setSources(src)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshCalendarNow()
      const today = await getTodayTopics()
      setTodayTopics(today)
    } catch (err) {
      console.error('[CalendarView] refresh failed', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleAddToPermanent = async (topic: Topic) => {
    try {
      const created = await addPermanentTopic(topic._id)
      setPermanent((cur) => [created, ...cur])
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setDuplicateNotice(`"${topic.title}" is already in your Permanent list.`)
        setTimeout(() => setDuplicateNotice(null), 4000)
      } else {
        console.error('[CalendarView] add permanent failed', err)
      }
    }
  }

  const handleRemoveFromPermanent = async (topic: PermanentTopic) => {
    await deletePermanentTopic(topic._id)
    setPermanent((cur) => cur.filter((t) => t._id !== topic._id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || over.id !== 'permanent-list') return
    const topic = active.data.current?.topic as Topic | undefined
    if (topic) handleAddToPermanent(topic)
  }

  const handleCreate = (mode: 'linkedin' | 'platform', targetPlatforms?: string[]) => {
    if (!createTopic) return
    const topicId = createTopic._id
    setCreateTopic(null)
    generateFromTopic(topicId, mode, targetPlatforms).then(({ session_id }) => {
      navigate(mode === 'linkedin'
        ? `/dashboard/marketing-kit/preview/${session_id}`
        : `/dashboard/marketing-kit/platform/${session_id}`)
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <span className="w-8 h-8 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
      </div>
    )
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-white text-2xl font-bold">Content Calendar</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>

        {duplicateNotice && (
          <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm px-4 py-2.5 rounded-lg">
            {duplicateNotice}
            <button onClick={() => setDuplicateNotice(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <SourcesPanel sources={sources} onChange={setSources} />

        <div>
          <h2 className="text-white font-semibold text-sm mb-4">Today's Topics ({todayTopics.length})</h2>
          <TodayTopics topics={todayTopics} onCreate={setCreateTopic} />
        </div>

        <div>
          <h2 className="text-white font-semibold text-sm mb-4">Permanent List ({permanent.length})</h2>
          <PermanentList topics={permanent} onCreate={setCreateTopic} onRemove={handleRemoveFromPermanent} />
        </div>
      </div>

      {createTopic && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setCreateTopic(null)}>
          <div className="glass-card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-1">{createTopic.title}</h3>
            <p className="text-zinc-500 text-xs mb-5">Choose how to turn this into content</p>
            <div className="space-y-2">
              <button onClick={() => handleCreate('linkedin')}
                className="w-full flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                <Sparkles className="w-4 h-4" /> LinkedIn Post
              </button>
              <button onClick={() => handleCreate('platform', PLATFORM_OPTIONS)}
                className="w-full flex items-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                <Sparkles className="w-4 h-4" /> Multi-Platform Kit
              </button>
            </div>
            <button onClick={() => setCreateTopic(null)} className="w-full mt-3 text-zinc-500 text-xs hover:text-white">Cancel</button>
          </div>
        </div>
      )}
    </DndContext>
  )
}
