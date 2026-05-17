import { contextBridge, ipcRenderer } from 'electron'
import type { AiActionInput, AppSettings, CreateEntryInput, DeleteEntryInput, RenameEntryInput, SaveFileInput } from '../src/shared/types'

const api = {
  listWorkspaces: () => ipcRenderer.invoke('workspace:list'),
  addWorkspace: () => ipcRenderer.invoke('workspace:add'),
  readTree: (id: string) => ipcRenderer.invoke('workspace:tree', id),
  readFile: (workspaceId: string, path: string) => ipcRenderer.invoke('file:read', workspaceId, path),
  saveFile: (input: SaveFileInput) => ipcRenderer.invoke('file:save', input),
  createEntry: (input: CreateEntryInput) => ipcRenderer.invoke('entry:create', input),
  renameEntry: (input: RenameEntryInput) => ipcRenderer.invoke('entry:rename', input),
  deleteEntry: (input: DeleteEntryInput) => ipcRenderer.invoke('entry:delete', input),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:set', settings),
  listPlugins: () => ipcRenderer.invoke('plugins:list'),
  seedPlugins: () => ipcRenderer.invoke('plugins:seed'),
  runAi: (input: AiActionInput) => ipcRenderer.invoke('ai:run', input),
}

contextBridge.exposeInMainWorld('lightpaper', api)
export type LightPaperBridge = typeof api
