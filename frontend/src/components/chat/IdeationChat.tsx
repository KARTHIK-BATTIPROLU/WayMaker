import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react'
import Markdown from 'react-markdown'
import ConfidenceMeter from '../ui/ConfidenceMeter'
import type { IdeationMessage, DimensionScores, ExtractedIdea } from '../../types'

interface Props {
  messages: IdeationMessage[]
  dimensionScores: DimensionScores
  extracted: ExtractedIdea
  confidence: number
  ready: boolean
  loading: boolean
  error: string | null
  onSend: (text: string) => void
  onContinue: () => void
}

/** Returns the label of the dimension with the lowest score */
function lowestDimension(scores: DimensionScores): string {
  const map: Record<keyof DimensionScores, string> = {
    problem: 'Problem',
    targetCustomer: 'Target Customer',
    solutionWedge: 'Solution Wedge',
    alternatives: 'Alternatives',
    valueAndWillingness: 'Value & Willingness',
  }
  const lowest = (Object.keys(scores) as Array<keyof DimensionScores>).reduce((a, b) =>
    scores[a] <= scores[b] ? a : b
  )
  return map[lowest]
}

export default function IdeationChat({
  messages,
  dimensionScores,
  confidence,
  ready,
  loading,
  error,
  onSend,
  onContinue,
}: Props) {
  const [input, setInput] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    onSend(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleContinueClick = () => {
    if (!ready) {
      setShowConfirm(true)
    } else {
      onContinue()
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* ── Confidence meter (pinned top) ──────────────────────────────── */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <ConfidenceMeter confidence={confidence} dimensionScores={dimensionScores} />
      </div>

      {/* ── Message thread ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
              style={{
                background: 'rgba(45,212,191,0.08)',
                border: '1px solid rgba(45,212,191,0.15)',
              }}
            >
              <Sparkles className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm mb-1">
                Tell me about your idea
              </p>
              <p className="text-zinc-600 text-xs max-w-xs leading-relaxed">
                A sentence or a paragraph — I'll ask the right questions to sharpen it.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className="px-4 py-3 max-w-[88%] rounded-2xl text-sm leading-relaxed"
                style={
                  msg.role === 'user'
                    ? {
                        background: 'rgba(45,212,191,0.13)',
                        border: '1px solid rgba(45,212,191,0.2)',
                        borderTopRightRadius: 4,
                        color: '#e4e4e7',
                      }
                    : {
                        background: 'rgba(255,255,255,0.045)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTopLeftRadius: 4,
                        color: '#d4d4d8',
                      }
                }
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="prose-dark chat-prose text-sm leading-relaxed">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}
              </div>
              <div className="text-[10px] mt-1 px-1" style={{ color: '#3f3f52' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start"
          >
            <div
              className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
              style={{
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderTopLeftRadius: 4,
              }}
            >
              {[0, 0.15, 0.3].map((d, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#52525b' }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7, delay: d }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Continue gate ─────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-4 pb-3 pt-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {showConfirm ? (
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}
          >
            <p className="text-amber-300/80 text-xs leading-relaxed">
              Your idea is still vague on <strong className="text-amber-300">{lowestDimension(dimensionScores)}</strong>. Analysis may be generic. Continue anyway?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowConfirm(false); onContinue() }}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
              >
                Yes, continue
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
              >
                Keep refining
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleContinueClick}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              ready ? 'btn-gradient' : 'opacity-50'
            }`}
            style={
              ready
                ? {}
                : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#71717a',
                    cursor: 'pointer',
                  }
            }
          >
            <ArrowRight className="w-4 h-4" />
            Continue to Analysis
            {!ready && (
              <span className="text-[10px] font-normal opacity-70">
                ({confidence}/100)
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 px-3 pb-3 pt-2 flex items-end gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer… (Enter to send, Shift+Enter for newline)"
          disabled={loading}
          className="flex-1 text-sm text-white outline-none rounded-xl px-4 py-2.5 resize-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: '#fff',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="rounded-xl p-2.5 shrink-0 transition-all disabled:opacity-30"
          style={{
            background: 'linear-gradient(135deg,#2dd4bf,#818cf8)',
            boxShadow: '0 0 12px rgba(45,212,191,0.2)',
          }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
