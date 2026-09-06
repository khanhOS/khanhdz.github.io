'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquarePlus, Search, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ConversationItem {
  id: string
  title: string
  messageCount: number
  updatedAt: string
}

interface ConversationSidebarProps {
  conversations: ConversationItem[]
  activeId?: string
  onSelect?: (id: string) => void
  onNew?: () => void
  onDelete?: (id: string) => void
  onClose?: () => void
  open?: boolean
}

export function ConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete, onClose, open,
}: ConversationSidebarProps) {
  const [query, setQuery] = useState('')
  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'flex flex-col bg-sidebar/95 backdrop-blur border-r-2 border-border w-72 sm:w-80 shrink-0 transition-transform duration-300',
          'fixed lg:relative top-0 bottom-0 z-40 lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'
        )}
      >
        <div className="p-3 border-b-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
              Conversations
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-auto text-muted-foreground hover:text-foreground lg:hidden"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button className="w-full" variant="outline" onClick={onNew}>
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="p-2 border-b-2 border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-input/50 rounded border border-border focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground p-4">
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'group flex items-center rounded-md border-2 border-transparent px-2 py-2 cursor-pointer transition-colors',
                  activeId === c.id ? 'bg-primary/15 border-primary/30' : 'hover:bg-secondary'
                )}
                onClick={() => onSelect?.(c.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{c.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {c.messageCount} msg · {new Date(c.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Xoá "${c.title}"?`)) onDelete(c.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t-2 border-border">
          <Link
            href="/plans"
            className="block text-center text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            Quản lý gói →
          </Link>
        </div>
      </div>
    </>
  )
}
