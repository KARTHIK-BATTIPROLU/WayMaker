import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Sparkles, Send, ChevronDown } from 'lucide-react'
import { useChat } from '../../hooks'
import { useProjectStore } from '../../store/project'
import Markdown from 'react-markdown'

const suggestions = [
  'What are my biggest market opportunities?',
  'How can I improve my landing page copy?',
  'Which funding should I apply for first?',
]

export default function FloatingChatbot() {
  const activeProjectId = useProjectStore(s => s.activeProjectId)
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { history, sendMessage } = useChat(activeProjectId)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history.data, sendMessage.isPending])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200)
  }, [isOpen])

  if (!activeProjectId) return null

  const msgCount = history.data?.length ?? 0

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return
    sendMessage.mutate(input.trim()); setInput('')
  }

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full transition-all"
            style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#2dd4bf,#818cf8)', boxShadow: '0 4px 24px rgba(45,212,191,0.35)' }}>
            <MessageSquare className="w-5 h-5 text-white" />
            {msgCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: '#c084fc' }}>
                {msgCount > 9 ? '9+' : msgCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
            style={{ width: 380, height: 520, background: 'rgba(8,8,16,0.97)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(24px)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>

            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,rgba(45,212,191,0.2),rgba(129,140,248,0.2))', border: '1px solid rgba(45,212,191,0.2)' }}>
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Waymaker AI</div>
                  <div className="text-[10px]" style={{ color: '#3f3f52' }}>Your AI business advisor</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: '#52525b' }}
                onMouseOver={e => (e.currentTarget.style.color = '#fff')}
                onMouseOut={e => (e.currentTarget.style.color = '#52525b')}>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgCount === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-float"
                    style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)' }}>
                    <Sparkles className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Ask me anything</p>
                    <p className="text-zinc-600 text-xs max-w-[200px] leading-relaxed">Refine your idea, improve copy, explore strategy</p>
                  </div>
                  <div className="w-full space-y-1.5">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => { setInput(s); inputRef.current?.focus() }}
                        className="w-full text-left text-xs px-3 py-2 rounded-xl transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#71717a' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(45,212,191,0.06)'; e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.15)' }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {history.data?.map((msg: any) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="px-3.5 py-2.5 max-w-[88%] rounded-2xl text-sm"
                    style={msg.role === 'user'
                      ? { background: 'rgba(45,212,191,0.15)', border: '1px solid rgba(45,212,191,0.2)', borderTopRightRadius: 4, color: '#e4e4e7' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderTopLeftRadius: 4, color: '#d4d4d8' }}>
                    {msg.role === 'user'
                      ? msg.content
                      : <div className="prose-dark chat-prose text-sm leading-relaxed"><Markdown>{msg.content}</Markdown></div>
                    }
                  </div>
                  <div className="text-[10px] mt-1 px-1" style={{ color: '#3f3f52' }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}

              {sendMessage.isPending && (
                <div className="flex items-start">
                  <div className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderTopLeftRadius: 4 }}>
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#52525b' }}
                        animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: d }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 flex items-center gap-2 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
              <input ref={inputRef} type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Ask about your business…"
                className="flex-1 text-sm text-white outline-none rounded-xl px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
              <button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending}
                className="rounded-xl p-2.5 transition-all shrink-0 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#2dd4bf,#818cf8)', boxShadow: '0 0 12px rgba(45,212,191,0.2)' }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
