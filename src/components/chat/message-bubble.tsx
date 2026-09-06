'use client'

import ReactMarkdown from 'react-markdown'
import { useState } from 'react'
import { Check, Copy, User, Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CodeBlock } from './code-block'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  pending?: boolean
}

interface MessageBubbleProps {
  message: ChatMessage
  onRegenerate?: () => void
  isLastAssistant?: boolean
  canRegenerate?: boolean
}

export function MessageBubble({
  message, onRegenerate, isLastAssistant, canRegenerate,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className={cn(
      'flex gap-3 px-3 sm:px-6 py-4 animate-fade-in',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      <div className={cn(
        'h-8 w-8 shrink-0 flex items-center justify-center rounded-md border-2',
        isUser ? 'bg-secondary border-border' : 'bg-primary/20 border-primary/40'
      )}>
        {isUser ? <User className="h-4 w-4 text-foreground/70" /> : <Sparkles className="h-4 w-4 text-primary" />}
      </div>

      <div className={cn('flex-1 min-w-0 max-w-[85%]', isUser ? 'items-end text-right' : 'items-start')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
            {isUser ? 'You' : 'KhanhOS AI'}
          </span>
        </div>

        <div className={cn(
          'inline-block rounded-md border-2 px-3 py-2 text-left',
          isUser ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
        )}>
          {message.pending && !message.content ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
            </span>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }: any) {
                    const isInline = !className?.includes('language-')
                    const match = /language-(\w+)/.exec(className || '')
                    const codeText = String(children).replace(/\n$/, '')
                    if (isInline) {
                      return <code className={className} {...props}>{children}</code>
                    }
                    return <CodeBlock language={match?.[1] || 'code'} code={codeText} />
                  },
                  pre({ children }: any) {
                    return <>{children}</>
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.pending && (
                <span className="inline-block h-3 w-1.5 ml-0.5 bg-primary animate-pulse align-middle" />
              )}
            </div>
          )}
        </div>

        {!message.pending && message.content && (
          <div className="flex items-center gap-1 mt-1.5">
            <button
              onClick={handleCopy}
              className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-secondary transition-colors"
            >
              {copied ? (
                <><Check className="h-3 w-3 text-primary" /> Copied</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </button>
            {!isUser && isLastAssistant && canRegenerate && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-secondary transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
