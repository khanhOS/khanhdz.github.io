import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
  highlight?: boolean
}

export function StatCard({ label, value, hint, icon: Icon, className, highlight }: StatCardProps) {
  return (
    <div className={cn('khanhos-card p-4', highlight && 'khanhos-glow border-primary/30', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
            {label}
          </div>
          <div className={cn('mt-1 text-2xl font-extrabold tracking-tight', highlight && 'text-primary')}>
            {value}
          </div>
          {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
        </div>
        {Icon && (
          <div className="h-9 w-9 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}
