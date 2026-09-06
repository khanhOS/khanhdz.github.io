import { requireOwner } from '@/lib/auth'
import { ok, withErrors } from '@/lib/api-response'
import fs from 'node:fs'
import path from 'node:path'

const SRC_ROOT = '/home/z/my-project'
const EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', '.vercel', '.zscripts',
  'db', 'skills', 'mini-services', '.bun', 'tests', 'examples',
  '.cache', '.turbo', 'upload', 'download',
])
const EXCLUDE_FILES = new Set([
  '.env', '.env.local', '.env.production', 'dev.log', 'server.log',
  'worklog.md', 'push-to-github.sh', 'bun.lock', 'package-lock.json',
  'dev.db', 'custom.db', 'dev.db-journal', 'custom.db-journal',
  'zip-project.cjs', 'check-users.cjs', 'clear-owner.cjs',
])

function walk(dir: string, base: string = dir): Array<{ path: string; size: number; type: 'file' | 'dir' }> {
  const out: Array<{ path: string; size: number; type: 'file' | 'dir' }> = []
  let entries: fs.Dirent[] = []
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    if (EXCLUDE_DIRS.has(e.name)) continue
    if (EXCLUDE_FILES.has(e.name)) continue
    if (e.name.endsWith('.log') || e.name.endsWith('.db') || e.name.endsWith('.db-journal')) continue
    const full = path.join(dir, e.name)
    const rel = path.relative(base, full)
    if (e.isDirectory()) {
      out.push({ path: rel, size: 0, type: 'dir' })
      out.push(...walk(full, base))
    } else if (e.isFile()) {
      try {
        const stat = fs.statSync(full)
        out.push({ path: rel, size: stat.size, type: 'file' })
      } catch {}
    }
  }
  return out
}

export const GET = withErrors(async () => {
  await requireOwner()
  const files = walk(SRC_ROOT).filter((f) => f.type === 'file')

  const categorized = {
    config: files.filter((f) =>
      [
        'package.json', 'tsconfig.json', 'next.config.ts', 'tailwind.config.ts',
        'postcss.config.mjs', 'components.json', 'eslint.config.mjs',
        'vercel.json', 'middleware.ts', '.env.example', '.gitignore',
        'LICENSE', 'README.md', 'Caddyfile',
      ].some((p) => f.path === p)
    ),
    prisma: files.filter((f) => f.path.startsWith('prisma/')),
    src: files.filter((f) => f.path.startsWith('src/')).map((f) => ({
      ...f,
      category: categorizeSrc(f.path),
    })),
    public: files.filter((f) => f.path.startsWith('public/')),
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return ok({
    files: categorized,
    stats: {
      totalFiles: files.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
    },
    zipUrl: '/api/owner/files/zip',
  })
})

function categorizeSrc(p: string): string {
  if (p.startsWith('src/app/api/')) return 'API Routes'
  if (p.startsWith('src/app/owner/')) return 'Owner Pages'
  if (p.startsWith('src/app/chat')) return 'Chat Pages'
  if (p.startsWith('src/app/') && p.includes('page.tsx')) return 'App Pages'
  if (p.startsWith('src/app/') && p.includes('layout.tsx')) return 'Layout'
  if (p.startsWith('src/components/')) return 'Components'
  if (p.startsWith('src/lib/')) return 'Lib (server-only)'
  if (p.startsWith('src/hooks/')) return 'Hooks'
  return 'Other'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
