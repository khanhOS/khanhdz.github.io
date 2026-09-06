'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Square, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ComposerProps {
  onSend: (text: string) => void
  onStop?: () => void
  onClear?: () => void
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
  enterToSend?: boolean
}

export function Composer({
  onSend, onStop, onClear, isStreaming, disabled,
  placeholder = 'Nhập tin nhắn cho KhanhOS AI...',
  enterToSend = true,
}: ComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [text])

  useEffect(() => {
    if (typeof window === 'undefined' || !('visualViewport' in window)) return
    const vv = window.visualViewport!
    const onResize = () => {
      if (containerRef.current) {
        const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
        containerRef.current.style.paddingBottom = `${keyboardHeight}px`
      }
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    onResize()
    return () => {
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', onResize)
    }
  }, [])

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && enterToSend) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      ref={containerRef}
      className="sticky bottom-0 left-0 right-0 border-t-2 border-border bg-background/95 backdrop-blur p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl flex items-end gap-2">
        {onClear && (
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={onClear}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className={cn(
              'w-full resize-none rounded-md border-2 border-border bg-card px-3 py-2.5 text-sm',
              'focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all',
              'placeholder:text-muted-foreground/70',
              'min-h-[44px] max-h-[200px]'
            )}
            aria-label="Message input"
          />
        </div>
        {isStreaming && onStop ? (
          <Button
            variant="destructive"
            className="h-10 shrink-0"
            onClick={onStop}
            aria-label="Stop generating"
          >
            <Square className="h-4 w-4 fill-current" />
            <span className="hidden sm:inline">Stop</span>
          </Button>
        ) : (
          <Button
            className="h-10 shrink-0"
            onClick={submit}
            disabled={!text.trim() || disabled}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Gửi</span>
          </Button>
        )}
      </div>
      <p className="text-[10px] text-center text-muted-foreground mt-2 uppercase tracking-wider">
        KhanhOS AI có thể mắc lỗi. Kiểm tra thông tin quan trọng.
      </p>
    </div>
  )
}
