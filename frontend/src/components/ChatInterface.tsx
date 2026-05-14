import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { SourceCitation } from './SourceCitation'
import { api } from '../services/api'
import type { ChatMessage } from '../types'

interface Props {
  selectedDocumentIds: string[]
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function EmptyState({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8">
      {/* Glowing orb */}
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-purple-gradient shadow-lifted flex items-center justify-center">
          <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-purple-gradient opacity-20 blur-md -z-10" />
      </div>

      <div className="text-center max-w-xs">
        <h3 className="text-sm font-semibold text-warm-700 mb-1">Ask anything about your documents</h3>
        <p className="text-xs text-warm-400 leading-relaxed">
          {selectedCount > 0
            ? `Searching ${selectedCount} selected document${selectedCount > 1 ? 's' : ''}.`
            : 'Upload a document and start asking questions.'}
        </p>
      </div>

      {/* Suggested prompts */}
      <div className="flex flex-wrap gap-2 justify-center mt-1">
        {['What is the loan amount?', 'Who is the borrower?', 'What are the terms?'].map((p) => (
          <span key={p} className="rounded-full border border-purple-200 bg-purple-50
            px-3 py-1 text-[11px] font-medium text-purple-600">
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}

export function ChatInterface({ selectedDocumentIds }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
    const query = input.trim()
    if (!query || loading) return

    setInput('')
    setError(null)

    setMessages((prev) => [...prev, {
      id: generateId(), role: 'user', content: query, timestamp: new Date(),
    }])
    setLoading(true)

    try {
      const response = await api.query({
        query,
        document_ids: selectedDocumentIds.length ? selectedDocumentIds : undefined,
        conversation_id: conversationId,
      })
      setConversationId(response.conversation_id)
      setMessages((prev) => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        model_used: response.model_used,
        timestamp: new Date(),
      }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, conversationId, selectedDocumentIds])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex flex-col h-full bg-warm-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <EmptyState selectedCount={selectedDocumentIds.length} />
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* Avatar — assistant only */}
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-purple-gradient
                flex items-center justify-center shadow-soft mt-0.5">
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}

            <div className={`flex flex-col max-w-[72%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Bubble */}
              <div className={`
                rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft
                ${msg.role === 'user'
                  ? 'bg-purple-700 text-white rounded-tr-sm'
                  : 'bg-white border border-warm-200 text-warm-800 rounded-tl-sm'}
              `}>
                {msg.role === 'user' ? (
                  <p className="font-semibold text-white">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Sources */}
              {msg.role === 'assistant' && msg.sources && (
                <div className="w-full mt-1.5">
                  <SourceCitation sources={msg.sources} />
                </div>
              )}

              {/* Model tag */}
              {msg.role === 'assistant' && msg.model_used && (
                <span className="mt-1.5 text-[10px] text-warm-300 font-medium">
                  {msg.model_used.replace('models/', '')}
                </span>
              )}
            </div>

            {/* Avatar — user only */}
            {msg.role === 'user' && (
              <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-warm-700
                flex items-center justify-center mt-0.5">
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-purple-gradient
              flex items-center justify-center shadow-soft">
              <svg className="h-3.5 w-3.5 text-white animate-pulse" viewBox="0 0 24 24" fill="none">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="bg-white border border-warm-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft">
              <div className="flex gap-1.5 items-center h-4">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-auto max-w-md rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600 flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-warm-200 bg-white px-5 py-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents…"
              className="w-full resize-none rounded-xl border border-warm-300 bg-warm-50
                px-4 py-2.5 pr-4 text-sm text-warm-900 placeholder-warm-500
                focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                focus:bg-white transition-all duration-200"
              style={{ maxHeight: '8rem', overflowY: 'auto' }}
            />
          </div>
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 h-10 w-10 rounded-xl bg-purple-gradient
              flex items-center justify-center shadow-soft
              hover:shadow-medium hover:scale-105
              disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
              transition-all duration-200"
          >
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-warm-400 max-w-4xl mx-auto">
          Enter to send · Shift+Enter for new line · Answers grounded in your documents only
        </p>
      </div>
    </div>
  )
}
