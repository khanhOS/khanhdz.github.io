'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users, Search, Loader2, AlertTriangle, Check, X,
  Crown, ShieldCheck, UserX, UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface UserRow {
  id: string
  email: string
  phone: string
  role: string
  plan: string
  tokenLimit: number
  tokenUsed: number
  banned: boolean
  approved: boolean
  approvedAt: string | null
  createdAt: string
}

interface Filters {
  q: string
  plan: string
  status: string
  approval: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  pages: number
}

interface UsersClientProps {
  initialUsers: UserRow[]
  initialFilters: Filters
  pagination: Pagination
  canApprove: boolean
}

export function UsersClient({
  initialUsers,
  initialFilters,
  pagination,
  canApprove,
}: UsersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserRow[]>(initialUsers)

  function applyFilters(next: Partial<Filters>) {
    const merged = { ...filters, ...next }
    const sp = new URLSearchParams(searchParams.toString())
    if (merged.q) sp.set('q', merged.q); else sp.delete('q')
    if (merged.plan) sp.set('plan', merged.plan); else sp.delete('plan')
    if (merged.status) sp.set('status', merged.status); else sp.delete('status')
    if (merged.approval) sp.set('approval', merged.approval); else sp.delete('approval')
    sp.set('page', '1')
    router.push(`/owner/users?${sp.toString()}`)
  }

  async function approveUser(id: string) {
    setActionLoading(id)
    setError(null)
    try {
      const res = await fetch(`/api/owner/users/${id}/approve`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Lỗi khi duyệt user')
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, approved: true, approvedAt: new Date().toISOString() } : u))
      )
      toast.success('Đã duyệt user')
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi duyệt user')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Quản lý Users</h1>
            <p className="text-sm text-muted-foreground">
              {pagination.total} user · page {pagination.page}/{pagination.pages || 1}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md border-2 border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {/* Filters */}
        <section className="khanhos-card p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tìm kiếm email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.q}
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyFilters({}) }}
                  placeholder="email..."
                  className="pl-9"
                />
              </div>
            </div>
            <FilterSelect
              label="Gói"
              value={filters.plan}
              onChange={(v) => applyFilters({ plan: v })}
              options={[
                { value: '', label: 'Tất cả gói' },
                { value: 'FREE', label: 'FREE' },
                { value: 'PLUS', label: 'PLUS' },
                { value: 'MAX', label: 'MAX' },
              ]}
            />
            <FilterSelect
              label="Trạng thái"
              value={filters.status}
              onChange={(v) => applyFilters({ status: v })}
              options={[
                { value: '', label: 'Tất cả' },
                { value: 'active', label: 'Hoạt động' },
                { value: 'banned', label: 'Banned' },
              ]}
            />
            <FilterSelect
              label="Phê duyệt"
              value={filters.approval}
              onChange={(v) => applyFilters({ approval: v })}
              options={[
                { value: '', label: 'Tất cả' },
                { value: 'pending', label: 'Chưa duyệt' },
                { value: 'approved', label: 'Đã duyệt' },
              ]}
            />
          </div>
          <Button
            onClick={() => applyFilters({})}
            className="khanhos-btn khanhos-btn-primary text-xs h-9"
          >
            <Search className="h-4 w-4" />
            Áp dụng
          </Button>
        </section>

        {/* Table */}
        <section className="khanhos-card overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-secondary/80 backdrop-blur">
                <tr className="border-b-2 border-border">
                  <Th>Email</Th>
                  <Th>Vai trò</Th>
                  <Th>Gói</Th>
                  <Th>Token</Th>
                  <Th>Trạng thái</Th>
                  <Th>Phê duyệt</Th>
                  <Th>Ngày tạo</Th>
                  {canApprove && <Th className="text-right">Hành động</Th>}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={canApprove ? 8 : 7} className="p-8 text-center text-muted-foreground">
                      Không tìm thấy user phù hợp.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-secondary/30">
                      <Td className="font-mono">{u.email}</Td>
                      <Td>
                        <RoleBadge role={u.role} />
                      </Td>
                      <Td>
                        <PlanBadge plan={u.plan} />
                      </Td>
                      <Td className="font-mono">
                        {u.tokenUsed.toLocaleString('vi-VN')} / {u.tokenLimit.toLocaleString('vi-VN')}
                      </Td>
                      <Td>
                        {u.banned ? (
                          <span className="text-destructive font-semibold">Banned</span>
                        ) : (
                          <span className="text-primary">Hoạt động</span>
                        )}
                      </Td>
                      <Td>
                        {u.approved ? (
                          <span className="text-primary flex items-center gap-1">
                            <Check className="h-3 w-3" /> Đã duyệt
                          </span>
                        ) : (
                          <span className="text-yellow-500">Chờ duyệt</span>
                        )}
                      </Td>
                      <Td className="text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </Td>
                      {canApprove && (
                        <Td className="text-right">
                          {!u.approved && !u.banned && (
                            <Button
                              size="sm"
                              disabled={actionLoading === u.id}
                              onClick={() => approveUser(u.id)}
                              className="khanhos-btn khanhos-btn-primary h-7 text-[10px]"
                            >
                              {actionLoading === u.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3" /> Duyệt
                                </>
                              )}
                            </Button>
                          )}
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
                  href={`/owner/users?${buildQuery({ ...filters, page: pagination.page - 1 })}`}
                  className="khanhos-btn text-xs h-8"
                >
                  ← Trước
                </Link>
              )}
              {pagination.page < pagination.pages && (
                <Link
                  href={`/owner/users?${buildQuery({ ...filters, page: pagination.page + 1 })}`}
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

function buildQuery(f: Filters & { page: number }): string {
  const sp = new URLSearchParams()
  if (f.q) sp.set('q', f.q)
  if (f.plan) sp.set('plan', f.plan)
  if (f.status) sp.set('status', f.status)
  if (f.approval) sp.set('approval', f.approval)
  sp.set('page', String(f.page))
  return sp.toString()
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-md border border-border bg-input text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { cls: string; icon: React.ComponentType<{ className?: string }> }> = {
    OWNER: { cls: 'bg-primary/15 text-primary border-primary/30', icon: Crown },
    ADMIN: { cls: 'bg-blue-500/15 text-blue-500 border-blue-500/30', icon: ShieldCheck },
    USER: { cls: 'bg-muted text-muted-foreground border-border', icon: Users },
  }
  const v = map[role] || map.USER
  const Icon = v.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border font-mono', v.cls)}>
      <Icon className="h-3 w-3" />
      {role}
    </span>
  )
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
