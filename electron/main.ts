import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LightPaperDb } from './database'
import { samplePlugins } from './bundled-plugins'
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
ipcMain.handle('entry:create', async (_event, input: CreateEntryInput) => { const root = workspacePath(input.workspaceId); assertInsideWorkspace(root, input.parentPath); return createEntry(input) })
ipcMain.handle('entry:rename', async (_event, input: RenameEntryInput) => { const root = workspacePath(input.workspaceId); assertInsideWorkspace(root, input.path); await renameEntry(input); return true })
ipcMain.handle('entry:delete', async (_event, input: DeleteEntryInput) => { const root = workspacePath(input.workspaceId); assertInsideWorkspace(root, input.path); await deleteEntry(input); return true })
ipcMain.handle('settings:get', () => db.getSettings())
ipcMain.handle('settings:set', (_event, settings: AppSettings) => { db.setSettings(settings); return settings })
ipcMain.handle('plugins:list', () => db.listPlugins())
ipcMain.handle('plugins:samples', () => samplePlugins)
ipcMain.handle('plugins:installSample', (_event, id: string) => {
  const sample = samplePlugins.find((plugin) => plugin.id === id)
  if (!sample) throw new Error('Sample plugin not found')
  db.upsertPlugin({ ...sample, enabled: false, sample: false })
  return db.listPlugins()
})
ipcMain.handle('plugins:uninstall', (_event, id: string) => { db.removePlugins([id]); return db.listPlugins() })
ipcMain.handle('plugins:setEnabled', (_event, id: string, enabled: boolean) => { db.setPluginEnabled(id, enabled); return db.listPlugins() })
ipcMain.handle('plugins:seed', () => {
  const sampleIds = samplePlugins.map((plugin) => plugin.id)
  const oldSampleRows = db.listPlugins().filter((plugin) => sampleIds.includes(plugin.id) && (plugin.sample === true || plugin.builtin === true)).map((plugin) => plugin.id)
  if (oldSampleRows.length) db.removePlugins(oldSampleRows)
  return db.listPlugins()
})
ipcMain.handle('ai:run', async (_event, input: AiActionInput) => {
  const text = input.text || input.document || ''
  const words = text.split(/\s+/).filter(Boolean)
  if (input.presetId === 'tags') return { text: '', tags: Array.from(new Set(words.filter((w) => w.length > 5).slice(0, 8).map((w) => w.toLowerCase().replace(/[^a-z0-9-]/g, '')))) }
  if (input.presetId === 'summary') return { text: words.slice(0, 80).join(' ') + (words.length > 80 ? '…' : '') }
  const model = input.model ? `\n\n<!-- Selected model: ${input.provider?.name ?? input.model.providerId} / ${input.model.name} -->` : ''
  return { text: `> AI draft placeholder\n\n${text}\n\n<!-- Configure an AI provider plugin to replace this offline stub. -->${model}` }
})
