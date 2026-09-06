'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  language?: string
  code: string
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <div className="my-3 rounded-md overflow-hidden border-2 border-border bg-[#0d1017]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/60 border-b-2 border-border">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <><Check className="h-3 w-3 text-primary" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3" /> Copy</>
          )}
        </button>
      </div>
      <pre className={cn('overflow-x-auto p-3 text-xs leading-relaxed')}>
        <code className="font-mono text-foreground/90">{code}</code>
      </pre>
    </div>
  )
}
