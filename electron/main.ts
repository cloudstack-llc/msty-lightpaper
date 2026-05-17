import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LightPaperDb } from './database'
import { assertInsideWorkspace, chooseWorkspace, createEntry, deleteEntry, readFile, readTree, renameEntry, saveFile } from './fs-service'
import type { AiActionInput, AppSettings, CreateEntryInput, DeleteEntryInput, RenameEntryInput, SaveFileInput } from '../src/shared/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let mainWindow: BrowserWindow | undefined
let db: LightPaperDb

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1480, height: 940, minWidth: 1000, minHeight: 700, titleBarStyle: 'hiddenInset', backgroundColor: '#0b0d10', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false } })
  if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

app.whenReady().then(() => {
  db = new LightPaperDb()
  nativeTheme.themeSource = 'dark'
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

function workspacePath(id: string) {
  const ws = db.listWorkspaces().find((w) => w.id === id)
  if (!ws) throw new Error('Workspace not found')
  return ws.path
}

ipcMain.handle('workspace:list', () => db.listWorkspaces())
ipcMain.handle('workspace:add', async () => { const ws = await chooseWorkspace(); if (ws) db.upsertWorkspace(ws); return ws })
ipcMain.handle('workspace:tree', async (_event, id: string) => readTree(workspacePath(id)))
ipcMain.handle('workspace:remove', async (_event, id: string) => { db.removeWorkspace(id); return db.listWorkspaces() })
ipcMain.handle('file:read', async (_event, workspaceId: string, filePath: string) => { const root = workspacePath(workspaceId); assertInsideWorkspace(root, filePath); return readFile(filePath) })
ipcMain.handle('file:save', async (_event, input: SaveFileInput) => { const root = workspacePath(input.workspaceId); assertInsideWorkspace(root, input.path); await saveFile(input.path, input.content); return true })
ipcMain.handle('entry:create', async (_event, input: CreateEntryInput) => { const root = workspacePath(input.workspaceId); assertInsideWorkspace(root, input.parentPath); await createEntry(input); return true })
ipcMain.handle('entry:rename', async (_event, input: RenameEntryInput) => { const root = workspacePath(input.workspaceId); assertInsideWorkspace(root, input.path); await renameEntry(input); return true })
ipcMain.handle('entry:delete', async (_event, input: DeleteEntryInput) => { const root = workspacePath(input.workspaceId); assertInsideWorkspace(root, input.path); await deleteEntry(input); return true })
ipcMain.handle('settings:get', () => db.getSettings())
ipcMain.handle('settings:set', (_event, settings: AppSettings) => { db.setSettings(settings); return settings })
ipcMain.handle('plugins:list', () => db.listPlugins())
ipcMain.handle('plugins:seed', () => {
  const plugins = [
    { id: 'lightpaper.ai-copilot', name: 'AI Copilot Core', version: '0.1.0', description: 'Summaries, tags, rewrites, outlines, critique, and transform presets. Can be replaced by provider plugins.', permissions: ['ai','commands','metadata'] as const, enabled: true, builtin: true, contributes: { commands: [{ id: 'ai.rewrite', title: 'Rewrite Selection', category: 'AI' }, { id: 'ai.summarize', title: 'Summarize Document', category: 'AI' }], aiPresets: [] } },
    { id: 'lightpaper.markdown-powerpack', name: 'Markdown Power Pack', version: '0.1.0', description: 'Footnotes, anchors, task lists, callouts, frontmatter, backlinks, and wiki-links.', permissions: ['markdown','metadata'] as const, enabled: true, builtin: true },
    { id: 'lightpaper.publisher-kit', name: 'Publisher Kit', version: '0.1.0', description: 'Future export pipeline for HTML, PDF, EPUB, and static sites.', permissions: ['filesystem','commands','markdown'] as const, enabled: false, builtin: true },
  ]
  plugins.forEach((p) => db.upsertPlugin(p as any))
  return db.listPlugins()
})
ipcMain.handle('ai:run', async (_event, input: AiActionInput) => {
  const text = input.text || input.document || ''
  const words = text.split(/\s+/).filter(Boolean)
  if (input.presetId === 'tags') return { text: '', tags: Array.from(new Set(words.filter((w) => w.length > 5).slice(0, 8).map((w) => w.toLowerCase().replace(/[^a-z0-9-]/g, '')))) }
  if (input.presetId === 'summary') return { text: words.slice(0, 80).join(' ') + (words.length > 80 ? '…' : '') }
  return { text: `> AI draft placeholder\n\n${text}\n\n<!-- Configure an AI provider plugin to replace this offline stub. -->` }
})
