import { contextBridge, ipcRenderer } from 'electron'
import type { AiActionInput, AppSettings, CreateEntryInput, DeleteEntryInput, RenameEntryInput, SaveFileInput } from '../src/shared/types'

const api = {
  listWorkspaces: () => ipcRenderer.invoke('workspace:list'),
  addWorkspace: () => ipcRenderer.invoke('workspace:add'),
  readTree: (id: string) => ipcRenderer.invoke('workspace:tree', id),
  removeWorkspace: (id: string) => ipcRenderer.invoke('workspace:remove', id),
  readFile: (workspaceId: string, path: string) => ipcRenderer.invoke('file:read', workspaceId, path),
  saveFile: (input: SaveFileInput) => ipcRenderer.invoke('file:save', input),
  createEntry: (input: CreateEntryInput) => ipcRenderer.invoke('entry:create', input),
  renameEntry: (input: RenameEntryInput) => ipcRenderer.invoke('entry:rename', input),
  deleteEntry: (input: DeleteEntryInput) => ipcRenderer.invoke('entry:delete', input),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:set', settings),
  listPlugins: () => ipcRenderer.invoke('plugins:list'),
  listSamplePlugins: () => ipcRenderer.invoke('plugins:samples'),
  installSamplePlugin: (id: string) => ipcRenderer.invoke('plugins:installSample', id),
  uninstallPlugin: (id: string) => ipcRenderer.invoke('plugins:uninstall', id),
  seedPlugins: () => ipcRenderer.invoke('plugins:seed'),
  setPluginEnabled: (id: string, enabled: boolean) => ipcRenderer.invoke('plugins:setEnabled', id, enabled),
  runAi: (input: AiActionInput) => ipcRenderer.invoke('ai:run', input),
  vaultStatus: () => ipcRenderer.invoke('vault:status'),
  createVault: (masterPassword: string) => ipcRenderer.invoke('vault:create', masterPassword),
  unlockVault: (masterPassword: string) => ipcRenderer.invoke('vault:unlock', masterPassword),
  lockVault: () => ipcRenderer.invoke('vault:lock'),
  setProviderSecret: (apiKeyRef: string, secret: string) => ipcRenderer.invoke('vault:setProviderSecret', apiKeyRef, secret),
  deleteProviderSecret: (apiKeyRef: string) => ipcRenderer.invoke('vault:deleteProviderSecret', apiKeyRef),
  hasProviderSecret: (apiKeyRef: string) => ipcRenderer.invoke('vault:hasProviderSecret', apiKeyRef),
  listSecretRefs: () => ipcRenderer.invoke('vault:listSecretRefs'),
}

contextBridge.exposeInMainWorld('lightpaper', api)
export type LightPaperBridge = typeof api
