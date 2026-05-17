import { create } from 'zustand'
import type { AppSettings, FileNode, PluginRecord, Workspace } from '@shared/types'

type WorkspaceTree = { workspace: Workspace; tree: FileNode[]; loading?: boolean; error?: string }

type State = {
  workspaces: Workspace[]
  workspaceTrees: WorkspaceTree[]
  activeWorkspace?: Workspace
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
  removeWorkspace(id: string): Promise<void>
  loadTree(workspace: Workspace): Promise<void>
  loadAllTrees(): Promise<void>
  openFile(path: string): Promise<void>
  save(): Promise<void>
  createEntry(parentPath: string, kind: 'file' | 'folder'): Promise<void>
  deleteEntry(path: string): Promise<void>
  updateSettings(next: Partial<AppSettings>): Promise<void>
  seedPlugins(): Promise<void>
}

function isInside(root: string, target: string) {
  return target === root || target.startsWith(`${root}/`)
}

function findWorkspaceForPath(workspaces: Workspace[], targetPath: string) {
  return [...workspaces].sort((a, b) => b.path.length - a.path.length).find((workspace) => isInside(workspace.path, targetPath))
}

function replaceTree(trees: WorkspaceTree[], workspace: Workspace, patch: Partial<WorkspaceTree>) {
  const existing = trees.find((item) => item.workspace.id === workspace.id)
  if (existing) return trees.map((item) => item.workspace.id === workspace.id ? { ...item, ...patch, workspace } : item)
  return [...trees, { workspace, tree: [], ...patch }]
}

export const useAppStore = create<State>((set, get) => ({
  workspaces: [], workspaceTrees: [], content: '', savedContent: '', plugins: [], loading: false,
  setActiveFile: (path) => set({ activeFile: path }),
  setContent: (content) => set({ content }),
  hydrate: async () => {
    set({ loading: true })
    const [workspaces, settings, plugins] = await Promise.all([window.lightpaper.listWorkspaces(), window.lightpaper.getSettings(), window.lightpaper.seedPlugins()]) as [Workspace[], AppSettings, PluginRecord[]]
    set({ workspaces, settings, plugins, activeWorkspace: workspaces[0], workspaceTrees: workspaces.map((workspace) => ({ workspace, tree: [], loading: true })), loading: false })
    await get().loadAllTrees()
  },
  addWorkspace: async () => {
    const ws = await window.lightpaper.addWorkspace()
    if (!ws) return
    const workspaces = await window.lightpaper.listWorkspaces() as Workspace[]
    set({ workspaces, activeWorkspace: ws, workspaceTrees: workspaces.map((workspace) => get().workspaceTrees.find((item) => item.workspace.id === workspace.id) ?? { workspace, tree: [], loading: true }) })
    await get().loadTree(ws)
  },
  removeWorkspace: async (id) => {
    const workspace = get().workspaces.find((item) => item.id === id)
    if (!workspace) return
    if (!window.confirm(`Remove ${workspace.name} from LightPaper? Files stay on disk.`)) return
    const workspaces = await window.lightpaper.removeWorkspace(id) as Workspace[]
    const activeFile = get().activeFile
    const activeFileWasInsideRemovedWorkspace = activeFile ? isInside(workspace.path, activeFile) : false
    set({
      workspaces,
      workspaceTrees: get().workspaceTrees.filter((item) => item.workspace.id !== id),
      activeWorkspace: activeFileWasInsideRemovedWorkspace ? workspaces[0] : get().activeWorkspace?.id === id ? workspaces[0] : get().activeWorkspace,
      ...(activeFileWasInsideRemovedWorkspace ? { activeFile: undefined, content: '', savedContent: '' } : {}),
    })
  },
  loadTree: async (workspace) => {
    set({ workspaceTrees: replaceTree(get().workspaceTrees, workspace, { loading: true, error: undefined }) })
    try {
      const tree = await window.lightpaper.readTree(workspace.id)
      set({ workspaceTrees: replaceTree(get().workspaceTrees, workspace, { tree, loading: false, error: undefined }) })
    } catch (error) {
      set({ workspaceTrees: replaceTree(get().workspaceTrees, workspace, { loading: false, error: error instanceof Error ? error.message : 'Unable to load folder' }) })
    }
  },
  loadAllTrees: async () => {
    await Promise.all(get().workspaces.map((workspace) => get().loadTree(workspace)))
  },
  openFile: async (path) => {
    const workspace = findWorkspaceForPath(get().workspaces, path)
    if (!workspace) return
    const content = await window.lightpaper.readFile(workspace.id, path)
    set({ activeWorkspace: workspace, activeFile: path, content, savedContent: content })
  },
  save: async () => {
    const { workspaces, activeFile, content } = get()
    if (!activeFile) return
    const workspace = findWorkspaceForPath(workspaces, activeFile)
    if (!workspace) return
    await window.lightpaper.saveFile({ workspaceId: workspace.id, path: activeFile, content })
    set({ activeWorkspace: workspace, savedContent: content })
    await get().loadTree(workspace)
  },
  createEntry: async (parentPath, kind) => {
    const workspace = findWorkspaceForPath(get().workspaces, parentPath)
    if (!workspace) return
    const base = kind === 'folder' ? 'New Folder' : 'Untitled.md'
    const name = window.prompt(`Name for new ${kind}`, base)
    if (!name) return
    await window.lightpaper.createEntry({ workspaceId: workspace.id, parentPath, name, kind })
    set({ activeWorkspace: workspace })
    await get().loadTree(workspace)
  },
  deleteEntry: async (path) => {
    const workspace = findWorkspaceForPath(get().workspaces, path)
    if (!workspace) return
    if (!window.confirm('Delete this item from disk?')) return
    await window.lightpaper.deleteEntry({ workspaceId: workspace.id, path })
    const { activeFile } = get()
    if (activeFile && isInside(path, activeFile)) set({ activeFile: undefined, content: '', savedContent: '' })
    set({ activeWorkspace: workspace })
    await get().loadTree(workspace)
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
