import { app, BrowserWindow, dialog, ipcMain, nativeTheme } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LightPaperDb } from './database'
import { SecretVault } from './secret-vault'
import { runAiActionOffline } from './ai-service'
import { samplePlugins } from './bundled-plugins'
import { assertInsideWorkspace, chooseWorkspace, createEntry, deleteEntry, readFile, readTree, renameEntry, saveFile } from './fs-service'
import { readExternalPluginBundle, readLocalPluginPackage } from './local-plugin-loader'
import { planSamplePluginRegistryRefresh } from './plugin-registry'
import type { AiActionInput, AppSettings, CreateEntryInput, DeleteEntryInput, RenameEntryInput, SaveFileInput } from '../src/shared/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let mainWindow: BrowserWindow | undefined
let db: LightPaperDb
let vault: SecretVault

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1480, height: 940, minWidth: 1000, minHeight: 700, titleBarStyle: 'hiddenInset', backgroundColor: '#0b0d10', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false } })
  if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

app.whenReady().then(() => {
  db = new LightPaperDb()
  vault = new SecretVault(path.join(app.getPath('userData'), 'lightpaper-vault.json'))
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
ipcMain.handle('plugins:externalBundles', () => db.listPlugins().filter((plugin) => plugin.enabled && plugin.external).map(readExternalPluginBundle))
ipcMain.handle('plugins:installSample', (_event, id: string) => {
  const sample = samplePlugins.find((plugin) => plugin.id === id)
  if (!sample) throw new Error('Sample plugin not found')
  db.upsertPlugin({ ...sample, enabled: false, sample: false })
  return db.listPlugins()
})
ipcMain.handle('plugins:installLocal', async (_event, requestedPath?: string) => {
  let pluginRoot = requestedPath
  if (!pluginRoot) {
    const result = await dialog.showOpenDialog(mainWindow!, { properties: ['openDirectory'], title: 'Install LightPaper plugin folder' })
    if (result.canceled || !result.filePaths[0]) return db.listPlugins()
    pluginRoot = result.filePaths[0]
  }
  db.upsertPlugin(readLocalPluginPackage(pluginRoot))
  return db.listPlugins()
})
ipcMain.handle('plugins:uninstall', (_event, id: string) => { db.removePlugins([id]); return db.listPlugins() })
ipcMain.handle('plugins:setEnabled', (_event, id: string, enabled: boolean) => { db.setPluginEnabled(id, enabled); return db.listPlugins() })
ipcMain.handle('plugins:seed', () => {
  const installed = db.listPlugins()
  const plan = planSamplePluginRegistryRefresh(installed, samplePlugins)
  if (plan.removeIds.length) db.removePlugins(plan.removeIds)
  for (const plugin of plan.refreshPlugins) db.upsertPlugin(plugin)
  return db.listPlugins()
})
ipcMain.handle('vault:status', () => vault.status())
ipcMain.handle('vault:create', (_event, masterPassword: string) => vault.createVault(masterPassword))
ipcMain.handle('vault:unlock', (_event, masterPassword: string) => vault.unlock(masterPassword))
ipcMain.handle('vault:lock', () => { vault.lock(); return vault.status() })
ipcMain.handle('vault:setProviderSecret', (_event, apiKeyRef: string, secret: string) => vault.setProviderSecret(apiKeyRef, secret))
ipcMain.handle('vault:deleteProviderSecret', (_event, apiKeyRef: string) => vault.deleteProviderSecret(apiKeyRef))
ipcMain.handle('vault:hasProviderSecret', (_event, apiKeyRef: string) => vault.hasProviderSecret(apiKeyRef))
ipcMain.handle('vault:listSecretRefs', () => vault.listSecretRefs())
ipcMain.handle('ai:run', async (_event, input: AiActionInput) => runAiActionOffline(input, vault))
