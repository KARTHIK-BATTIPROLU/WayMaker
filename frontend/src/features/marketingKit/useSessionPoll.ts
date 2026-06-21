import { useEffect, useState, useCallback } from 'react'
import { getSessionState } from './api'
import type { Session } from './types'

const TERMINAL: Session['status'][] = ['preview', 'platform_preview', 'error']
const POLL_MS = 1500

export function useSessionPoll(sessionId: string | undefined) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!sessionId) return
    const data = await getSessionState(sessionId)
    setSession(data)
    return data
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      try {
        const data = await getSessionState(sessionId)
        if (cancelled) return
        setSession(data)
        setLoading(false)
        if (!TERMINAL.includes(data.status)) {
          timer = setTimeout(poll, POLL_MS)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    poll()

    return () => { cancelled = true; clearTimeout(timer) }
  }, [sessionId])

  return { session, loading, refetch, setSession }
}
