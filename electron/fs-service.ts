import fs from 'node:fs/promises'
import path from 'node:path'
import { dialog } from 'electron'
import { nanoid } from 'nanoid'
import type { CreateEntryInput, DeleteEntryInput, FileNode, RenameEntryInput, Workspace } from '../src/shared/types'

const mdExtensions = new Set(['.md', '.markdown', '.mdx', '.txt'])
const ignored = new Set(['.git', 'node_modules', '.DS_Store'])

export async function chooseWorkspace(): Promise<Workspace | undefined> {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
  if (result.canceled || !result.filePaths[0]) return undefined
  const folder = result.filePaths[0]
  const now = Date.now()
  return { id: nanoid(), name: path.basename(folder), path: folder, createdAt: now, lastOpenedAt: now }
}

export async function readTree(root: string): Promise<FileNode[]> {
  async function walk(abs: string, rel = ''): Promise<FileNode[]> {
    const entries = await fs.readdir(abs, { withFileTypes: true })
    const nodes = await Promise.all(entries.filter((e) => !ignored.has(e.name)).map(async (entry) => {
      const entryAbs = path.join(abs, entry.name)
      const entryRel = path.join(rel, entry.name)
      if (entry.isDirectory()) return { id: entryAbs, name: entry.name, path: entryAbs, relativePath: entryRel, kind: 'folder' as const, children: await walk(entryAbs, entryRel) }
      if (!entry.isFile() || !mdExtensions.has(path.extname(entry.name).toLowerCase())) return undefined
      return { id: entryAbs, name: entry.name, path: entryAbs, relativePath: entryRel, kind: 'file' as const }
    }))
    return (nodes.filter(Boolean) as FileNode[]).sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'folder' ? -1 : 1))
  }
  return walk(root)
}

export async function readFile(filePath: string) { return fs.readFile(filePath, 'utf8') }
export async function saveFile(filePath: string, content: string) { await fs.writeFile(filePath, content, 'utf8') }
async function uniquePath(target: string) {
  const parsed = path.parse(target)
  let candidate = target
  let index = 2
  while (true) {
    try {
      await fs.access(candidate)
      candidate = path.join(parsed.dir, `${parsed.name} ${index}${parsed.ext}`)
      index += 1
    } catch {
      return candidate
    }
  }
}

export async function createEntry(input: CreateEntryInput) {
  const requested = path.join(input.parentPath, input.name)
  const target = await uniquePath(input.kind === 'file' && !requested.match(/\.(md|markdown|mdx|txt)$/i) ? `${requested}.md` : requested)
  if (input.kind === 'folder') await fs.mkdir(target, { recursive: false })
  else await fs.writeFile(target, '', { flag: 'wx' })
  return target
}
export async function renameEntry(input: RenameEntryInput) { await fs.rename(input.path, path.join(path.dirname(input.path), input.nextName)) }
export async function deleteEntry(input: DeleteEntryInput) { await fs.rm(input.path, { recursive: true, force: false }) }
export function assertInsideWorkspace(workspacePath: string, target: string) { const rel = path.relative(workspacePath, target); if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Target is outside workspace') }
