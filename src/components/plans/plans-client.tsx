'use client'

import { useState } from 'react'
import {
  CreditCard, Check, Loader2, AlertTriangle, Copy,
  Landmark, ArrowRight, Clock, XCircle, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type PlanId = 'FREE' | 'PLUS' | 'MAX'

interface PlanInfo {
  id: PlanId
  name: string
  tokenLimit: number
  priceVnd: number
  priceLabel: string
  description: string
  features: string[]
  highlight?: boolean
}

interface PaymentInfo {
  id: string
  plan: string
  amount: number
  status: string
  memo: string
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
}

interface PlansClientProps {
  currentPlan: PlanId
  plans: PlanInfo[]
  payments: PaymentInfo[]
}

interface CheckoutResult {
  payment: { id: string; plan: string; amount: number; status: string; memo: string; createdAt: string }
  bank: { bankName: string; accountName: string; accountNumber: string }
  instructions: string[]
  note: string
}

export function PlansClient({ currentPlan, plans, payments: initialPayments }: PlansClientProps) {
  const [checkingOut, setCheckingOut] = useState<PlanId | null>(null)
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<PaymentInfo[]>(initialPayments)

  async function handleCheckout(plan: PlanId) {
    if (plan === 'FREE' || plan === currentPlan) return
    setError(null)
    setCheckout(null)
    setCheckingOut(plan)
    try {
      const res = await fetch('/api/plans/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Không thể tạo thanh toán')
      }
      setCheckout(data as CheckoutResult)
      setPayments((prev) => [
        {
          id: data.payment.id,
          plan: data.payment.plan,
          amount: data.payment.amount,
          status: data.payment.status,
          memo: data.payment.memo,
          createdAt: data.payment.createdAt,
          approvedAt: null,
          rejectedAt: null,
        },
        ...prev,
      ])
      toast.success('Đã tạo yêu cầu thanh toán')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Không thể tạo thanh toán')
    } finally {
      setCheckingOut(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Gói dịch vụ</h1>
            <p className="text-sm text-muted-foreground">
              Gói hiện tại: <span className="text-primary font-semibold">{currentPlan}</span>.
              Nâng cấp bất cứ lúc nào.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid gap-5 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan
            return (
              <div
                key={plan.id}
                className={cn(
                  'khanhos-card p-6 flex flex-col relative',
                  plan.highlight && 'khanhos-glow border-primary/50'
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    Phổ biến
                  </div>
                )}
                <div className="text-2xl font-bold tracking-wide">{plan.name}</div>
                <div className="text-3xl font-extrabold mt-2">
                  {plan.priceVnd === 0 ? (
                    'Miễn phí'
                  ) : (
                    <>
                      {new Intl.NumberFormat('vi-VN').format(plan.priceVnd)}
                      <span className="text-base text-muted-foreground ml-1">đ</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  disabled={isCurrent || checkingOut === plan.id}
                  onClick={() => handleCheckout(plan.id)}
                  className={cn(
                    'khanhos-btn mt-6 w-full h-11',
                    plan.highlight && !isCurrent && 'khanhos-btn-primary',
                    isCurrent && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {isCurrent ? (
                    'Đang sử dụng'
                  ) : checkingOut === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : plan.id === 'FREE' ? (
                    'Miễn phí'
                  ) : (
                    <>
                      Mua {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Checkout instructions */}
        {checkout && (
          <section className="khanhos-card p-5 khanhos-glow">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="h-4 w-4 text-primary" />
              <h2 className="font-semibold tracking-wide">Thông tin chuyển khoản</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 text-sm">
                <CopyRow label="Ngân hàng" value={checkout.bank.bankName} />
                <CopyRow label="Chủ tài khoản" value={checkout.bank.accountName} />
                <CopyRow label="Số tài khoản" value={checkout.bank.accountNumber} />
                <CopyRow
                  label="Số tiền"
                  value={`${new Intl.NumberFormat('vi-VN').format(checkout.payment.amount)}đ`}
                />
                <CopyRow label="Nội dung CK" value={checkout.payment.memo} highlight />
              </div>
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold uppercase tracking-wide text-xs text-muted-foreground">
                  Hướng dẫn
                </h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-foreground/90">
                  {checkout.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ol>
                <p className="mt-2 text-xs text-muted-foreground italic">{checkout.note}</p>
              </div>
            </div>
          </section>
        )}

        {/* Payment history */}
        <section className="khanhos-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="font-semibold tracking-wide">Lịch sử thanh toán</h2>
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Chưa có giao dịch nào.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border border-border bg-secondary/30"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <PaymentStatusIcon status={p.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{p.plan}</span>
                        <span className="text-sm font-mono">
                          {new Intl.NumberFormat('vi-VN').format(p.amount)}đ
                        </span>
                        <PaymentStatusBadge status={p.status} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                        Memo: {p.memo}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(p.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function CopyRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Đã sao chép')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Không thể sao chép')
    }
  }
  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/40 border border-border">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={cn('font-mono truncate', highlight && 'text-primary font-semibold')}>
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 p-1.5 rounded border border-border hover:border-primary/40 hover:text-primary"
        aria-label="Sao chép"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function PaymentStatusIcon({ status }: { status: string }) {
  if (status === 'APPROVED') return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
  if (status === 'REJECTED') return <XCircle className="h-4 w-4 text-destructive shrink-0" />
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Chờ duyệt', cls: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30' },
    APPROVED: { label: 'Đã duyệt', cls: 'bg-primary/15 text-primary border-primary/30' },
    REJECTED: { label: 'Từ chối', cls: 'bg-destructive/15 text-destructive border-destructive/30' },
  }
  const v = map[status] || { label: status, cls: 'bg-muted text-muted-foreground border-border' }
  return (
    <span className={cn('text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono', v.cls)}>
      {v.label}
    </span>
  )
}
