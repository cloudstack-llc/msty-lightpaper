import { create } from 'zustand'
import type { AppSettings, FileNode, PluginRecord, Workspace } from '@shared/types'

type State = {
  workspaces: Workspace[]
  activeWorkspace?: Workspace
  tree: FileNode[]
  activeFile?: string
  content: string
  savedContent: string
  settings?: AppSettings
  plugins: PluginRecord[]
  loading: boolean
  setActiveFile(path?: string): void
  setContent(content: string): void
  hydrate(): Promise<void>
  addWorkspace(): Promise<void>
  loadTree(workspace?: Workspace): Promise<void>
  openFile(path: string): Promise<void>
  save(): Promise<void>
  createEntry(parentPath: string, kind: 'file' | 'folder'): Promise<void>
  deleteEntry(path: string): Promise<void>
  updateSettings(next: Partial<AppSettings>): Promise<void>
  seedPlugins(): Promise<void>
}

export const useAppStore = create<State>((set, get) => ({
  workspaces: [], tree: [], content: '', savedContent: '', plugins: [], loading: false,
  setActiveFile: (path) => set({ activeFile: path }),
  setContent: (content) => set({ content }),
  hydrate: async () => {
    set({ loading: true })
    const [workspaces, settings, plugins] = await Promise.all([window.lightpaper.listWorkspaces(), window.lightpaper.getSettings(), window.lightpaper.seedPlugins()])
    const activeWorkspace = workspaces[0]
    set({ workspaces, settings, plugins, activeWorkspace, loading: false })
    if (activeWorkspace) await get().loadTree(activeWorkspace)
  },
  addWorkspace: async () => {
    const ws = await window.lightpaper.addWorkspace()
    if (!ws) return
    const workspaces = await window.lightpaper.listWorkspaces()
    set({ workspaces, activeWorkspace: ws })
    await get().loadTree(ws)
  },
  loadTree: async (workspace = get().activeWorkspace) => {
    if (!workspace) return set({ tree: [] })
    const tree = await window.lightpaper.readTree(workspace.id)
    set({ tree })
  },
  openFile: async (path) => {
    const workspace = get().activeWorkspace
    if (!workspace) return
    const content = await window.lightpaper.readFile(workspace.id, path)
    set({ activeFile: path, content, savedContent: content })
  },
  save: async () => {
    const { activeWorkspace, activeFile, content } = get()
    if (!activeWorkspace || !activeFile) return
    await window.lightpaper.saveFile({ workspaceId: activeWorkspace.id, path: activeFile, content })
    set({ savedContent: content })
    await get().loadTree()
  },
  createEntry: async (parentPath, kind) => {
    const { activeWorkspace } = get()
    if (!activeWorkspace) return
    const base = kind === 'folder' ? 'New Folder' : 'Untitled.md'
    const name = window.prompt(`Name for new ${kind}`, base)
    if (!name) return
    await window.lightpaper.createEntry({ workspaceId: activeWorkspace.id, parentPath, name, kind })
    await get().loadTree()
  },
  deleteEntry: async (path) => {
    const { activeWorkspace, activeFile } = get()
    if (!activeWorkspace) return
    if (!window.confirm('Delete this item from disk?')) return
    await window.lightpaper.deleteEntry({ workspaceId: activeWorkspace.id, path })
    if (activeFile === path) set({ activeFile: undefined, content: '', savedContent: '' })
    await get().loadTree()
  },
  updateSettings: async (next) => {
    const current = get().settings
    if (!current) return
    const settings = { ...current, ...next }
    await window.lightpaper.setSettings(settings)
    set({ settings })
  },
  seedPlugins: async () => set({ plugins: await window.lightpaper.seedPlugins() }),
}))
