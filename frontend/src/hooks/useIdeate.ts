import { useState, useCallback } from 'react'
import { ideate } from '../lib/api'
import type {
  IdeationMessage,
  ExtractedIdea,
  DimensionScores,
  IdeationData,
} from '../types'

interface IdeateState {
  messages: IdeationMessage[]
  extracted: ExtractedIdea
  dimensionScores: DimensionScores
  confidence: number
  ready: boolean
  loading: boolean
  error: string | null
}

const EMPTY_EXTRACTED: ExtractedIdea = {
  problem: '',
  targetCustomer: '',
  solutionWedge: '',
  alternatives: '',
  valueAndWillingness: '',
  industry: '',
  location: '',
}

const EMPTY_SCORES: DimensionScores = {
  problem: 0,
  targetCustomer: 0,
  solutionWedge: 0,
  alternatives: 0,
  valueAndWillingness: 0,
}

/**
 * Seed initial state from project.ideation if present (so page refresh
 * restores the full conversation + scores without re-hitting the API).
 */
function seedState(ideation?: IdeationData): Omit<IdeateState, 'loading' | 'error'> {
  if (!ideation) {
    return {
      messages: [],
      extracted: EMPTY_EXTRACTED,
      dimensionScores: EMPTY_SCORES,
      confidence: 0,
      ready: false,
    }
  }
  return {
    messages: ideation.messages ?? [],
    extracted: ideation.extracted ?? EMPTY_EXTRACTED,
    dimensionScores: ideation.dimensionScores ?? EMPTY_SCORES,
    confidence: ideation.confidence ?? 0,
    ready: ideation.ready ?? false,
  }
}

export function useIdeate(projectId: string, initialIdeation?: IdeationData) {
  const [state, setState] = useState<IdeateState>(() => ({
    ...seedState(initialIdeation),
    loading: false,
    error: null,
  }))

  /**
   * Re-seed state from a fresh project fetch (e.g. after a page refresh that
   * re-fetches the project before the hook has been interacted with).
   */
  const hydrate = useCallback((ideation?: IdeationData) => {
    setState((prev) => ({
      ...prev,
      ...seedState(ideation),
    }))
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!projectId || !text.trim()) return

      // Optimistically append user message
      const optimisticUserMsg: IdeationMessage = {
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      }
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, optimisticUserMsg],
        loading: true,
        error: null,
      }))

      try {
        const res = await ideate(projectId, text.trim())
        // Server is source of truth for messages list
        setState({
          messages: res.messages,
          extracted: res.extracted,
          dimensionScores: res.dimensionScores,
          confidence: res.confidence,
          ready: res.ready,
          loading: false,
          error: null,
        })
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          // Remove optimistic message on error
          messages: prev.messages.filter((m) => m !== optimisticUserMsg),
          loading: false,
          error: err?.response?.data?.detail ?? 'Something went wrong. Try again.',
        }))
      }
    },
    [projectId]
  )

  return { ...state, sendMessage, hydrate }
}
