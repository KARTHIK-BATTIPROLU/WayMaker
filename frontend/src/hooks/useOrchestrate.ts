import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'

interface OrchestrateState {
  isRunning: boolean
  currentStep: string
  stepMessage: string
  progress: number
  webResultCount: number
  completedSteps: string[]
}

const PROGRESS_MAP: Record<string, number> = {
  starting: 5,
  web_search: 15,
  market_research: 32,
  competitors: 50,
  customer_validation: 68,
  website: 82,
  funding: 95,
  complete: 100,
}

const MESSAGE_MAP: Record<string, string> = {
  starting: 'Initializing AI orchestration...',
  web_search: 'Researching market with live web data...',
  market_research: 'Analyzing TAM, SAM & SOM...',
  competitors: 'Mapping the competitive landscape...',
  customer_validation: 'Finding real communities to validate with...',
  website: 'Designing your landing page...',
  funding: 'Matching funding opportunities...',
  complete: 'Complete! Your business foundation is ready.',
}

export function useOrchestrate(projectId: string) {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)

  const [state, setState] = useState<OrchestrateState>({
    isRunning: false,
    currentStep: '',
    stepMessage: '',
    progress: 0,
    webResultCount: 0,
    completedSteps: [],
  })

  const start = useCallback(async () => {
    if (!projectId) return

    // Reset state before starting
    setState({
      isRunning: true,
      currentStep: 'starting',
      stepMessage: MESSAGE_MAP.starting,
      progress: 5,
      webResultCount: 0,
      completedSteps: [],
    })

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const response = await fetch(
        `${apiBase}/api/projects/${projectId}/orchestrate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errText}`)
      }

      const reader = response.body!.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              const step = event.step as string

              if (step === 'complete') {
                setState((s) => ({
                  ...s,
                  isRunning: false,
                  currentStep: 'complete',
                  stepMessage: MESSAGE_MAP.complete,
                  progress: 100,
                  completedSteps: [...s.completedSteps, 'complete'],
                }))
                // Refresh project data from backend
                queryClient.invalidateQueries({ queryKey: ['project', projectId] })
                queryClient.invalidateQueries({ queryKey: ['projects'] })
              } else if (step === 'error') {
                setState((s) => ({
                  ...s,
                  isRunning: false,
                  stepMessage: `Error: ${event.message}`,
                }))
              } else {
                setState((s) => ({
                  ...s,
                  currentStep: step,
                  stepMessage: event.message || MESSAGE_MAP[step] || `Processing ${step}...`,
                  progress: PROGRESS_MAP[step] || s.progress,
                  webResultCount: step === 'web_search' ? (event.resultCount || 0) : s.webResultCount,
                  completedSteps: s.completedSteps.includes(step)
                    ? s.completedSteps
                    : [...s.completedSteps, step],
                }))
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }
      }
    } catch (error: any) {
      console.error('[useOrchestrate] Error:', error)
      setState((s) => ({
        ...s,
        isRunning: false,
        stepMessage: `Failed: ${error?.message || 'Unknown error. Check API keys in backend/.env'}`,
      }))
    }
  }, [projectId, accessToken, queryClient])

  return { ...state, start }
}
