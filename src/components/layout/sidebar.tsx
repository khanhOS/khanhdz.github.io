'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Home, History, CreditCard, User, Settings, Shield,
  Menu, X, LogOut, FileCode, Users, ScrollText, Terminal,
  CreditCard as PayIcon, LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  ownerOnly?: boolean
  subItem?: boolean
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat?history=1', label: 'History', icon: History },
  { href: '/plans', label: 'Plans', icon: CreditCard },
  { href: '/account', label: 'Account', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/owner', label: 'Owner Panel', icon: Shield, ownerOnly: true },
  { href: '/owner', label: 'Dashboard', icon: LayoutDashboard, ownerOnly: true, subItem: true },
  { href: '/owner/users', label: 'Users', icon: Users, ownerOnly: true, subItem: true },
  { href: '/owner/payments', label: 'Payments', icon: PayIcon, ownerOnly: true, subItem: true },
  { href: '/owner/logs', label: 'Audit Logs', icon: ScrollText, ownerOnly: true, subItem: true },
  { href: '/owner/commands', label: 'Commands', icon: Terminal, ownerOnly: true, subItem: true },
  { href: '/owner/files', label: 'Web Files', icon: FileCode, ownerOnly: true, subItem: true },
]

interface SidebarProps {
  isOwner?: boolean
  userEmail?: string
}

export function Sidebar({ isOwner, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const homeHref = userEmail ? '/chat' : '/'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [pathname])

  const mainLinks = NAV_LINKS.filter(
    (l) => (!l.ownerOnly || isOwner) && !l.subItem
  ).map((l) => (l.href === '/' ? { ...l, href: homeHref } : l))
  const ownerSubLinks = isOwner ? NAV_LINKS.filter((l) => l.subItem) : []

  const renderLink = (link: typeof NAV_LINKS[number]) => {
    const active =
      link.href === '/'
        ? pathname === '/chat' || pathname === '/'
        : pathname === link.href ||
          (link.href !== '/' && pathname.startsWith(link.href.split('?')[0]))
    const Icon = link.icon
    return (
      <Link
        key={link.href + link.label}
        href={link.href}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium uppercase tracking-wide transition-all border-2 border-transparent',
          link.subItem && 'ml-4 text-xs py-2',
          active
            ? 'bg-primary/15 text-primary border-primary/30 khanhos-glow'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
        )}
      >
        <Icon className={cn('shrink-0', link.subItem ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        <span>{link.label}</span>
        {link.ownerOnly && !link.subItem && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono">
            OWNER
          </span>
        )}
      </Link>
    )
  }

  const NavContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-5 border-b-2 border-border">
        <Link href={homeHref} className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary khanhos-glow flex items-center justify-center text-primary-foreground font-bold text-sm">
            K
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-wide">KhanhOS</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              AI Platform
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainLinks.map(renderLink)}
        {isOwner && (
          <div className="pt-3 mt-3 border-t-2 border-border">
            <div className="px-3 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-mono">
              Owner Panel
            </div>
            {ownerSubLinks.map(renderLink)}
          </div>
        )}
      </nav>

      {userEmail && (
        <div className="p-3 border-t-2 border-border">
          <div className="px-3 py-2 rounded-md bg-secondary/50 border border-border">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Signed in as
            </div>
            <div className="text-xs font-mono truncate" title={userEmail}>
              {userEmail}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/'
            }}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      )}
    </>
  )

  return (
    <>
      <button
        aria-label="Toggle sidebar"
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-40 lg:hidden khanhos-btn h-10 w-10 p-0"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r-2 border-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
        {NavContent}
      </aside>

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-sidebar text-sidebar-foreground border-r-2 border-border transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        {NavContent}
      </aside>
    </>
  )
}
