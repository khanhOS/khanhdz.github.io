import { requireOwner } from '@/lib/auth'
import { withErrors, httpError } from '@/lib/api-response'
import fs from 'node:fs'
import path from 'node:path'

const SRC_ROOT = '/home/z/my-project'
const EXCLUDE_DIRS = ['node_modules', '.next', '.git', '.vercel', '.zscripts', 'db', 'skills', 'mini-services', '.bun', 'tests', 'examples', '.cache', '.turbo', 'upload', 'download']
const EXCLUDE_FILES = ['.env', '.env.local', '.env.production', 'dev.log', 'server.log', 'worklog.md', 'push-to-github.sh', 'bun.lock', 'package-lock.json', 'dev.db', 'custom.db']

export const GET = withErrors(async (request: Request) => {
  await requireOwner()

  const url = new URL(request.url)
  const relPath = url.searchParams.get('path')
  if (!relPath) throw httpError(400, 'Missing path param')

  const full = path.resolve(SRC_ROOT, relPath)
  if (!full.startsWith(SRC_ROOT)) throw httpError(403, 'Path không hợp lệ')

  const parts = relPath.split(/[\\/]/).filter(Boolean)
  for (const p of parts) {
    if (EXCLUDE_DIRS.includes(p)) throw httpError(403, 'Thư mục này không được phép tải')
  }
  const fileName = parts[parts.length - 1] || ''
  if (EXCLUDE_FILES.includes(fileName)) throw httpError(403, 'File này không được phép tải')
  if (fileName.endsWith('.log') || fileName.endsWith('.db') || fileName.endsWith('.db-journal')) {
    throw httpError(403, 'File này không được phép tải')
  }

  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    throw httpError(404, 'File không tồn tại')
  }

  const buf = fs.readFileSync(full)
  const ext = path.extname(fileName).slice(1).toLowerCase()
  const mimeMap: Record<string, string> = {
    ts: 'text/typescript', tsx: 'text/typescript',
    js: 'text/javascript', jsx: 'text/javascript',
    json: 'application/json', md: 'text/markdown',
    css: 'text/css', html: 'text/html',
    prisma: 'text/plain', sh: 'text/x-shellscript',
    mjs: 'text/javascript', txt: 'text/plain', svg: 'image/svg+xml',
  }
  const mime = mimeMap[ext] || 'application/octet-stream'

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': `${mime}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-cache',
    },
  })
})
