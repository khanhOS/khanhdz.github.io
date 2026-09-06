import { requireOwner } from '@/lib/auth'
import { withErrors, httpError } from '@/lib/api-response'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SRC_ROOT = '/home/z/my-project'
const OUT_DIR = '/tmp/khanhos-zips'

export const GET = withErrors(async () => {
  await requireOwner()

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  const outFile = path.join(OUT_DIR, `khanhos-ai-${Date.now()}.zip`)
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile)

  const excludes = [
    'node_modules/*', '.next/*', '.git/*', '.vercel/*', '.zscripts/*',
    'db/*', 'skills/*', 'mini-services/*', '.bun/*', 'tests/*', 'examples/*',
    '.cache/*', '.turbo/*', 'upload/*', 'download/*',
    '.env', '.env.local', '.env.production', '.env.development',
    '*.log', '*.db', '*.db-journal',
    'worklog.md', 'push-to-github.sh', 'bun.lock', 'package-lock.json',
    'scripts/zip-project.cjs', 'scripts/check-users.cjs', 'scripts/clear-owner.cjs',
  ].map((e) => `--exclude="${e}"`).join(' ')

  try {
    execSync(`cd "${SRC_ROOT}" && zip -r -q "${outFile}" . ${excludes}`, {
      stdio: 'pipe',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 60_000,
    })
  } catch (err: any) {
    console.error('[owner/files/zip] zip failed:', err.message)
    throw httpError(500, 'Không thể tạo ZIP file')
  }

  if (!fs.existsSync(outFile)) throw httpError(500, 'ZIP file không được tạo')

  const stat = fs.statSync(outFile)
  const fileBuffer = fs.readFileSync(outFile)

  try {
    const files = fs.readdirSync(OUT_DIR).map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(OUT_DIR, f)).mtimeMs,
    }))
    files.sort((a, b) => b.mtime - a.mtime)
    files.slice(3).forEach((f) => {
      try { fs.unlinkSync(path.join(OUT_DIR, f.name)) } catch {}
    })
  } catch {}

  const filename = `khanhos-ai-${new Date().toISOString().slice(0, 10)}.zip`

  return new Response(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(stat.size),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
})
