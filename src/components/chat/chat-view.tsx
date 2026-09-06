'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, MessageSquare, AlertTriangle } from 'lucide-react'
import { MessageBubble, type ChatMessage } from './message-bubble'
import { Composer } from './composer'
import { ConversationSidebar } from './conversation-sidebar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Conversation {
  id: string
  title: string
  messageCount: number
  updatedAt: string
}

interface InitialMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

interface ChatViewProps {
  initialConversationId?: string
  initialMessages?: InitialMessage[]
  initialConversations?: Conversation[]
  initialUsed?: number
  initialLimit?: number
  initialPlan?: 'FREE' | 'PLUS' | 'MAX'
}

export function ChatView({
  initialConversationId,
  initialMessages = [],
  initialConversations = [],
  initialUsed = 0,
  initialLimit = 20000,
  initialPlan = 'FREE',
}: ChatViewProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [activeId, setActiveId] = useState<string | undefined>(initialConversationId)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }))
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [used, setUsed] = useState(initialUsed)
  const [limit, setLimit] = useState(initialLimit)
  const [plan] = useState(initialPlan)

  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef(true)

  // Auto-scroll on new messages if user is at bottom
  useEffect(() => {
    if (autoScrollRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    autoScrollRef.current = atBottom
  }

  // Load full conversation when activeId changes (ChatGPT-style history)
  const selectConversation = useCallback(
    async (id: string) => {
      if (isStreaming) return
      setActiveId(id)
      setSidebarOpen(false)
      // Fetch full conversation with all messages
      try {
        const res = await fetch(`/api/conversations/${id}`)
        if (res.ok) {
          const data = await res.json()
          const conv = data.conversation
          if (conv && Array.isArray(conv.messages)) {
            setMessages(conv.messages.map((m: InitialMessage) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
            })))
          }
        }
      } catch (err) {
        console.error(err)
      }
      router.push(`/chat/${id}`)
    },
    [isStreaming, router]
  )

  const newChat = useCallback(() => {
    if (isStreaming) return
    setActiveId(undefined)
    setMessages([])
    setError(null)
    setSidebarOpen(false)
    router.push('/chat')
  }, [isStreaming, router])

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
        setConversations((cs) => cs.filter((c) => c.id !== id))
        if (activeId === id) {
          setActiveId(undefined)
          setMessages([])
          router.push('/chat')
        }
      } catch (err) {
        console.error(err)
      }
    },
    [activeId, router]
  )

  const refreshConversationList = useCallback(async () => {
    try {
      const r = await fetch('/api/conversations')
      const d = await r.json()
      if (Array.isArray(d.conversations)) {
        setConversations(d.conversations)
      }
    } catch {}
  }, [])

  const sendMessage = useCallback(
    async (text: string, regenerate = false) => {
      setError(null)
      const userMsg: ChatMessage = { id: `tmp-${Date.now()}`, role: 'user', content: text }
      const assistantMsg: ChatMessage = { id: `tmp-a-${Date.now()}`, role: 'assistant', content: '', pending: true }
      const history = regenerate
        ? messages.filter((m, i) => !(i === messages.length - 1 && m.role === 'assistant'))
        : [...messages, userMsg]
      const next = regenerate ? [...history, assistantMsg] : [...history, assistantMsg]
      setMessages(next)
      setIsStreaming(true)
      autoScrollRef.current = true

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: activeId, message: text, regenerate }),
          signal: controller.signal,
        })
        if (res.status === 402) {
          setError('Bạn đã hết quota của gói hiện tại.')
          setIsStreaming(false)
          setMessages(messages)
          return
        }
        if (res.status === 429) {
          setError('Bạn đang gửi tin quá nhanh. Đợi 60 giây rồi thử lại.')
          setIsStreaming(false)
          setMessages(messages)
          return
        }
        if (res.status === 503) {
          setError('Hệ thống đang bảo trì. Vui lòng thử lại sau.')
          setIsStreaming(false)
          setMessages(messages)
          return
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Lỗi không xác định')
          setIsStreaming(false)
          setMessages(messages)
          return
        }
        if (!res.body) {
          setError('Không nhận được dữ liệu từ server.')
          setIsStreaming(false)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let gotFirst = false
        let newConvId: string | undefined = activeId

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split('\n\n')
          buffer = events.pop() || ''
          for (const evt of events) {
            const lines = evt.split('\n')
            let event = 'message'
            let data = ''
            for (const line of lines) {
              if (line.startsWith('event:')) event = line.slice(6).trim()
              else if (line.startsWith('data:')) data += line.slice(5).trim()
            }
            if (!data) continue
            try {
              const payload = JSON.parse(data)
              if (event === 'start' && payload.conversationId) {
                newConvId = payload.conversationId
                if (!activeId) {
                  setActiveId(newConvId)
                  router.replace(`/chat/${newConvId}`)
                }
              } else if (event === 'delta' && typeof payload.content === 'string') {
                gotFirst = true
                setMessages((cur) => {
                  const cp = [...cur]
                  const last = cp[cp.length - 1]
                  if (last && last.role === 'assistant') {
                    cp[cp.length - 1] = {
                      ...last,
                      content: last.content + payload.content,
                      pending: false,
                    }
                  }
                  return cp
                })
              } else if (event === 'done') {
                if (payload.usage) {
                  setUsed(payload.usage.totalUsed ?? used)
                  setLimit(payload.usage.limit ?? limit)
                }
                setMessages((cur) => {
                  const cp = [...cur]
                  const last = cp[cp.length - 1]
                  if (last && last.role === 'assistant') {
                    cp[cp.length - 1] = { ...last, pending: false }
                  }
                  return cp
                })
                refreshConversationList()
              } else if (event === 'error') {
                setError(payload.message || 'Lỗi khi gọi AI')
                // Remove the pending assistant bubble on error
                setMessages((cur) => {
                  const cp = [...cur]
                  const last = cp[cp.length - 1]
                  if (last && last.role === 'assistant' && last.pending) {
                    cp.pop()
                  }
                  return cp
                })
              }
            } catch { /* ignore malformed */ }
          }
        }
        if (!gotFirst && !error) {
          setMessages((cur) => {
            const cp = [...cur]
            const last = cp[cp.length - 1]
            if (last && last.role === 'assistant') {
              cp[cp.length - 1] = {
                ...last,
                pending: false,
                content: '(Phản hồi trống. Vui lòng thử lại.)',
              }
            }
            return cp
          })
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          setMessages((cur) => {
            const cp = [...cur]
            const last = cp[cp.length - 1]
            if (last && last.role === 'assistant') {
              cp[cp.length - 1] = { ...last, pending: false }
            }
            return cp
          })
        } else {
          console.error(err)
          setError('Lỗi kết nối tới server. Vui lòng thử lại.')
          setMessages(messages)
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [activeId, messages, error, used, limit, router, refreshConversationList]
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearAll = useCallback(() => {
    if (!activeId) {
      setMessages([])
      return
    }
    if (!confirm('Xoá toàn bộ cuộc trò chuyện này? Hành động không thể hoàn tác.')) return
    deleteConversation(activeId)
  }, [activeId, deleteConversation])

  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={newChat}
        onDelete={deleteConversation}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-3 py-2 border-b-2 border-border bg-background/80 backdrop-blur sticky top-0 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-4 w-4 text-primary shrink-0" />
            <h1 className="text-sm font-semibold truncate">
              {messages.length === 0
                ? 'KhanhOS AI Chat'
                : `Chat · ${conversations.find((c) => c.id === activeId)?.title || 'New Chat'}`}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="font-mono px-1.5 py-0.5 rounded bg-secondary border border-border">
                {plan}
              </span>
              <span className="font-mono">
                {used.toLocaleString('vi-VN')} / {limit.toLocaleString('vi-VN')}
              </span>
            </div>
            <Link
              href="/plans"
              className="text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-border hover:border-primary/50 text-primary"
            >
              Nâng cấp
            </Link>
          </div>
        </header>

        {/* Quota bar (compact) */}
        <div className="px-3 py-1.5 border-b-2 border-border bg-secondary/30">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono shrink-0">
              Quota
            </span>
            <Progress value={percent} className="flex-1 h-1.5" />
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {percent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Messages — lưu chat như ChatGPT, hiển thị đầy đủ tin nhắn */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {messages.length === 0 ? (
            <EmptyState onExample={(t) => sendMessage(t)} />
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isLastAssistant={
                    i === messages.length - 1 && m.role === 'assistant' && !isStreaming
                  }
                  canRegenerate={!isStreaming}
                  onRegenerate={() => {
                    const lastUser = [...messages].reverse().find((x) => x.role === 'user')
                    if (lastUser) sendMessage(lastUser.content, true)
                  }}
                />
              ))}
              <div ref={bottomRef} className="h-2" />
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-3 sm:mx-6 mb-2 p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2 animate-fade-in">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p>{error}</p>
              {error.includes('hết quota') && (
                <Link
                  href="/plans"
                  className="inline-block mt-2 px-3 py-1 rounded bg-primary text-primary-foreground text-xs uppercase tracking-wider hover:opacity-90"
                >
                  Nâng cấp gói
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Composer */}
        <Composer
          onSend={(t) => sendMessage(t)}
          onStop={stop}
          onClear={clearAll}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  )
}

function EmptyState({ onExample }: { onExample: (t: string) => void }) {
  const examples = [
    'Giải thích cho tôi quantum computing bằng tiếng Việt đơn giản.',
    'Viết một hàm TypeScript sắp xếp mảng object theo thuộc tính.',
    'Cho tôi 3 ý tưởng nội dung về AI cho developer.',
    'Đặt 5 câu hỏi phỏng vấn vị trí Frontend Junior.',
  ]
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      <div className="h-16 w-16 bg-primary/15 border-2 border-primary/30 rounded-md flex items-center justify-center khanhos-glow mb-4">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">KhanhOS AI</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Bắt đầu cuộc trò chuyện mới. Hỏi bất cứ điều gì — KhanhOS AI sẽ giúp bạn.
        Cuộc trò chuyện được lưu tự động (như ChatGPT) — bấm vào History để xem lại.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onExample(ex)}
            className="text-left text-xs p-3 rounded-md border-2 border-border bg-card hover:border-primary/40 hover:bg-secondary transition-all"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
