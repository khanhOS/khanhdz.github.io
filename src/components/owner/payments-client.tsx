'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CreditCard, Loader2, AlertTriangle, Check, X,
  Clock, CheckCircle2, XCircle, Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PaymentRow {
  id: string
  userId: string
  userEmail: string
  plan: string
  amount: number
  status: string
  memo: string
  txnRef: string | null
  approvedAt: string | null
  rejectedAt: string | null
  createdAt: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  pages: number
}

interface PaymentsClientProps {
  initialPayments: PaymentRow[]
  pagination: Pagination
  canApprove: boolean
  currentStatus: string
}

export function PaymentsClient({
  initialPayments,
  pagination,
  canApprove,
  currentStatus,
}: PaymentsClientProps) {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentRow[]>(initialPayments)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function approvePayment(id: string) {
    setActionLoading(id)
    setError(null)
    try {
      const res = await fetch(`/api/owner/payments/${id}/approve`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Lỗi khi duyệt payment')
      setPayments((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: 'APPROVED', approvedAt: new Date().toISOString() } : p
        )
      )
      toast.success('Đã duyệt payment')
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi duyệt payment')
    } finally {
      setActionLoading(null)
    }
  }

  async function rejectPayment(id: string) {
    if (!confirm('Từ chối payment này? Hành động không thể hoàn tác.')) return
    setActionLoading(id)
    setError(null)
    try {
      const res = await fetch(`/api/owner/payments/${id}/reject`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Lỗi khi từ chối payment')
      setPayments((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: 'REJECTED', rejectedAt: new Date().toISOString() } : p
        )
      )
      toast.success('Đã từ chối payment')
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi từ chối payment')
    } finally {
      setActionLoading(null)
    }
  }

  function filterStatus(status: string) {
    const sp = new URLSearchParams()
    if (status) sp.set('status', status)
    sp.set('page', '1')
    router.push(`/owner/payments?${sp.toString()}`)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Payments</h1>
            <p className="text-sm text-muted-foreground">
              {pagination.total} giao dịch · page {pagination.page}/{pagination.pages || 1}
              {!canApprove && <span className="ml-2 text-yellow-500">(chỉ xem — cần OWNER để duyệt)</span>}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Status filter */}
        <section className="khanhos-card p-3 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {[
            { v: '', label: 'Tất cả' },
            { v: 'PENDING', label: 'Chờ duyệt' },
            { v: 'APPROVED', label: 'Đã duyệt' },
            { v: 'REJECTED', label: 'Từ chối' },
          ].map((opt) => (
            <button
              key={opt.v || 'all'}
              onClick={() => filterStatus(opt.v)}
              className={cn(
                'text-xs uppercase tracking-wide px-3 py-1.5 rounded-md border transition-all',
                currentStatus === opt.v
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-border hover:border-primary/30'
              )}
            >
              {opt.label}
            </button>
          ))}
        </section>

        {/* Table */}
        <section className="khanhos-card overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-secondary/80 backdrop-blur">
                <tr className="border-b-2 border-border">
                  <Th>User</Th>
                  <Th>Gói</Th>
                  <Th>Số tiền</Th>
                  <Th>Memo</Th>
                  <Th>Trạng thái</Th>
                  <Th>Ngày tạo</Th>
                  {canApprove && <Th className="text-right">Hành động</Th>}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={canApprove ? 7 : 6} className="p-8 text-center text-muted-foreground">
                      Chưa có payment nào.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-secondary/30">
                      <Td className="font-mono">{p.userEmail || p.userId.slice(0, 8)}</Td>
                      <Td>
                        <PlanBadge plan={p.plan} />
                      </Td>
                      <Td className="font-mono font-semibold">
                        {new Intl.NumberFormat('vi-VN').format(p.amount)}đ
                      </Td>
                      <Td className="font-mono text-muted-foreground">{p.memo}</Td>
                      <Td>
                        <PaymentStatusBadge status={p.status} />
                      </Td>
                      <Td className="text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString('vi-VN')}
                      </Td>
                      {canApprove && (
                        <Td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={actionLoading === p.id}
                                  onClick={() => approvePayment(p.id)}
                                  className="khanhos-btn khanhos-btn-primary h-7 text-[10px]"
                                >
                                  {actionLoading === p.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3" /> Duyệt
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading === p.id}
                                  onClick={() => rejectPayment(p.id)}
                                  className="khanhos-btn h-7 text-[10px] border-destructive/40 text-destructive"
                                >
                                  <X className="h-3 w-3" /> Từ chối
                                </Button>
                              </>
                            )}
                          </div>
                        </Td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Trang {pagination.page} / {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              {pagination.page > 1 && (
                <Link
                  href={`/owner/payments?status=${currentStatus}&page=${pagination.page - 1}`}
                  className="khanhos-btn text-xs h-8"
                >
                  ← Trước
                </Link>
              )}
              {pagination.page < pagination.pages && (
                <Link
                  href={`/owner/payments?status=${currentStatus}&page=${pagination.page + 1}`}
                  className="khanhos-btn text-xs h-8"
                >
                  Sau →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-3 py-2 text-left text-[10px] uppercase tracking-widest text-muted-foreground font-mono', className)}>
      {children}
    </th>
  )
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-3 py-2 align-middle', className)}>{children}</td>
}

function PlanBadge({ plan }: { plan: string }) {
  const cls =
    plan === 'MAX' ? 'bg-primary/15 text-primary border-primary/30'
    : plan === 'PLUS' ? 'bg-blue-500/15 text-blue-500 border-blue-500/30'
    : 'bg-muted text-muted-foreground border-border'
  return (
    <span className={cn('inline-block text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono', cls)}>
      {plan}
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
    PENDING: { label: 'Chờ duyệt', cls: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30', icon: Clock },
    APPROVED: { label: 'Đã duyệt', cls: 'bg-primary/15 text-primary border-primary/30', icon: CheckCircle2 },
    REJECTED: { label: 'Từ chối', cls: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  }
  const v = map[status] || { label: status, cls: 'bg-muted text-muted-foreground border-border', icon: Clock }
  const Icon = v.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono', v.cls)}>
      <Icon className="h-3 w-3" />
      {v.label}
    </span>
  )
}
