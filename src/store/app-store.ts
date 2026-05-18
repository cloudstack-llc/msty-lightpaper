import { create } from 'zustand'
import { ensureBundledPluginsActivated, getPluginAiModel, getPluginAiPreset, getPluginCommand, listPluginAiPresets, listPluginAiProviders, listPluginCommands, listPluginPanels, listPluginThemes, runPluginAiPreset, type RegisteredAiPreset, type RegisteredAiProvider, type RegisteredCommand, type RegisteredPanel, type RegisteredTheme } from '@/lib/plugin-runtime'
import type { AiActionInput, AiActionOutput, AppSettings, FileNode, PluginRecord, Workspace } from '@shared/types'

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
  samplePlugins: PluginRecord[]
  pluginCommands: RegisteredCommand[]
  pluginAiPresets: RegisteredAiPreset[]
  pluginAiProviders: RegisteredAiProvider[]
  pluginPanels: RegisteredPanel[]
  pluginThemes: RegisteredTheme[]
  loading: boolean
  lastError?: string
  lastAction?: string
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
  executePluginCommand(commandId: string): Promise<void>
  runAiAction(input: AiActionInput): Promise<AiActionOutput>
  setPluginEnabled(id: string, enabled: boolean): Promise<void>
  installSamplePlugin(id: string): Promise<void>
  uninstallPlugin(id: string): Promise<void>
}

function isInside(root: string, target: string) {
  return target === root || target.startsWith(`${root}/`)
}

function findWorkspaceForPath(workspaces: Workspace[], targetPath: string) {
  return [...workspaces]
    .sort((a, b) => b.path.length - a.path.length)
    .find((workspace) => isInside(workspace.path, targetPath))
}

function replaceTree(trees: WorkspaceTree[], workspace: Workspace, patch: Partial<WorkspaceTree>) {
  const existing = trees.find((item) => item.workspace.id === workspace.id)
  if (existing) return trees.map((item) => item.workspace.id === workspace.id ? { ...item, ...patch, workspace } : item)
  return [...trees, { workspace, tree: [], ...patch }]
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown error')
}

function basename(filePath: string) {
  return filePath.split('/').pop() ?? filePath
}

function relativePath(root: string, target: string) {
  return target === root ? '' : target.slice(root.length + 1)
}

function nodeFromPath(workspace: Workspace, filePath: string, kind: 'file' | 'folder'): FileNode {
  return {
    id: filePath,
    name: basename(filePath),
    path: filePath,
    relativePath: relativePath(workspace.path, filePath),
    kind,
    children: kind === 'folder' ? [] : undefined,
  }
}

function sortNodes(nodes: FileNode[]) {
  return [...nodes].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'folder' ? -1 : 1))
}

function addNodeToTree(nodes: FileNode[], parentPath: string, node: FileNode): FileNode[] {
  return sortNodes(nodes.map((item) => {
    if (item.path === parentPath && item.kind === 'folder') {
      return { ...item, children: sortNodes([...(item.children ?? []), node]) }
    }
    if (item.kind === 'folder' && item.children) {
      return { ...item, children: addNodeToTree(item.children, parentPath, node) }
    }
    return item
  }))
}

function addNodeToWorkspaceTree(tree: FileNode[], workspace: Workspace, parentPath: string, node: FileNode) {
  if (parentPath === workspace.path) return sortNodes([...tree, node])
  return addNodeToTree(tree, parentPath, node)
}

function removeNodeFromTree(nodes: FileNode[], targetPath: string): FileNode[] {
  return nodes
    .filter((item) => item.path !== targetPath)
    .map((item) => item.kind === 'folder' && item.children ? { ...item, children: removeNodeFromTree(item.children, targetPath) } : item)
}

function mutateWorkspaceTree(trees: WorkspaceTree[], workspace: Workspace, mutator: (tree: FileNode[]) => FileNode[]) {
  return trees.map((item) => item.workspace.id === workspace.id ? { ...item, tree: mutator(item.tree), loading: false, error: undefined } : item)
}

export const useAppStore = create<State>((set, get) => ({
  workspaces: [],
  workspaceTrees: [],
  content: '',
  savedContent: '',
  plugins: [],
  samplePlugins: [],
  pluginCommands: [],
  pluginAiPresets: [],
  pluginAiProviders: [],
  pluginPanels: [],
  pluginThemes: [],
  loading: false,
  setActiveFile: (path) => set({ activeFile: path }),
  setContent: (content) => set({ content }),
  hydrate: async () => {
    set({ loading: true, lastError: undefined })
    const [workspaces, settings, plugins, samplePlugins] = await Promise.all([
      window.lightpaper.listWorkspaces(),
      window.lightpaper.getSettings(),
      window.lightpaper.seedPlugins(),
      window.lightpaper.listSamplePlugins(),
    ]) as [Workspace[], AppSettings, PluginRecord[], PluginRecord[]]
    await ensureBundledPluginsActivated(plugins)
    set({
      workspaces,
      settings,
      plugins,
      samplePlugins,
      pluginCommands: listPluginCommands(),
      pluginAiPresets: listPluginAiPresets(),
      pluginAiProviders: listPluginAiProviders(),
      pluginPanels: listPluginPanels(),
      pluginThemes: listPluginThemes(),
      activeWorkspace: workspaces[0],
      workspaceTrees: workspaces.map((workspace) => ({ workspace, tree: [], loading: true })),
      loading: false,
    })
    await get().loadAllTrees()
  },
  addWorkspace: async () => {
    try {
      const ws = await window.lightpaper.addWorkspace() as Workspace | undefined
      if (!ws) return
      const workspaces = await window.lightpaper.listWorkspaces() as Workspace[]
      set({
        workspaces,
        activeWorkspace: ws,
        workspaceTrees: workspaces.map((workspace) => get().workspaceTrees.find((item) => item.workspace.id === workspace.id) ?? { workspace, tree: [], loading: true }),
        lastAction: `Mounted ${ws.name}`,
        lastError: undefined,
      })
      await get().loadTree(ws)
    } catch (error) {
      set({ lastError: `Mount failed: ${errorMessage(error)}` })
    }
  },
  removeWorkspace: async (id) => {
    const workspace = get().workspaces.find((item) => item.id === id)
    if (!workspace) return
    if (!window.confirm(`Remove ${workspace.name} from LightPaper? Files stay on disk.`)) return
    try {
      const workspaces = await window.lightpaper.removeWorkspace(id) as Workspace[]
      const activeFile = get().activeFile
      const activeFileWasInsideRemovedWorkspace = activeFile ? isInside(workspace.path, activeFile) : false
      set({
        workspaces,
        workspaceTrees: get().workspaceTrees.filter((item) => item.workspace.id !== id),
        activeWorkspace: activeFileWasInsideRemovedWorkspace ? workspaces[0] : get().activeWorkspace?.id === id ? workspaces[0] : get().activeWorkspace,
        lastAction: `Unmounted ${workspace.name}`,
        lastError: undefined,
        ...(activeFileWasInsideRemovedWorkspace ? { activeFile: undefined, content: '', savedContent: '' } : {}),
      })
    } catch (error) {
      set({ lastError: `Unmount failed: ${errorMessage(error)}` })
    }
  },
  loadTree: async (workspace) => {
    set({ workspaceTrees: replaceTree(get().workspaceTrees, workspace, { loading: true, error: undefined }) })
    try {
      const tree = await window.lightpaper.readTree(workspace.id) as FileNode[]
      set({ workspaceTrees: replaceTree(get().workspaceTrees, workspace, { tree, loading: false, error: undefined }) })
    } catch (error) {
      set({
        workspaceTrees: replaceTree(get().workspaceTrees, workspace, { loading: false, error: errorMessage(error) }),
        lastError: `Unable to load ${workspace.name}: ${errorMessage(error)}`,
      })
    }
  },
  loadAllTrees: async () => {
    await Promise.all(get().workspaces.map((workspace) => get().loadTree(workspace)))
  },
  openFile: async (path) => {
    const workspace = findWorkspaceForPath(get().workspaces, path)
    if (!workspace) return set({ lastError: `No mounted folder owns ${path}` })
    try {
      const content = await window.lightpaper.readFile(workspace.id, path) as string
      set({ activeWorkspace: workspace, activeFile: path, content, savedContent: content, lastAction: `Opened ${basename(path)}`, lastError: undefined })
    } catch (error) {
      set({ lastError: `Open failed: ${errorMessage(error)}` })
    }
  },
  save: async () => {
    const { workspaces, activeFile, content } = get()
    if (!activeFile) return
    const workspace = findWorkspaceForPath(workspaces, activeFile)
    if (!workspace) return set({ lastError: `No mounted folder owns ${activeFile}` })
    try {
      await window.lightpaper.saveFile({ workspaceId: workspace.id, path: activeFile, content })
      set({ activeWorkspace: workspace, savedContent: content, lastAction: `Saved ${basename(activeFile)}`, lastError: undefined })
    } catch (error) {
      set({ lastError: `Save failed: ${errorMessage(error)}` })
    }
  },
  createEntry: async (parentPath, kind) => {
    const workspace = findWorkspaceForPath(get().workspaces, parentPath)
    if (!workspace) return set({ lastError: `No mounted folder owns ${parentPath}` })
    const name = kind === 'folder' ? 'New Folder' : 'Untitled.md'
    set({ lastAction: `Creating ${kind}…`, lastError: undefined })
    try {
      const createdPath = await window.lightpaper.createEntry({ workspaceId: workspace.id, parentPath, name, kind }) as string
      const newNode = nodeFromPath(workspace, createdPath, kind)
      set({
        activeWorkspace: workspace,
        lastAction: `Created ${basename(createdPath)}`,
        lastError: undefined,
        workspaceTrees: mutateWorkspaceTree(get().workspaceTrees, workspace, (tree) => addNodeToWorkspaceTree(tree, workspace, parentPath, newNode)),
      })
      if (kind === 'file') await get().openFile(createdPath)
    } catch (error) {
      set({ lastError: `Create ${kind} failed: ${errorMessage(error)}` })
    }
  },
  deleteEntry: async (path) => {
    const workspace = findWorkspaceForPath(get().workspaces, path)
    if (!workspace) return set({ lastError: `No mounted folder owns ${path}` })
    if (!window.confirm('Delete this item from disk?')) return
    try {
      await window.lightpaper.deleteEntry({ workspaceId: workspace.id, path })
      const { activeFile } = get()
      const clearActiveFile = activeFile ? isInside(path, activeFile) : false
      set({
        activeWorkspace: workspace,
        lastAction: `Deleted ${basename(path)}`,
        lastError: undefined,
        workspaceTrees: mutateWorkspaceTree(get().workspaceTrees, workspace, (tree) => removeNodeFromTree(tree, path)),
        ...(clearActiveFile ? { activeFile: undefined, content: '', savedContent: '' } : {}),
      })
    } catch (error) {
      set({ lastError: `Delete failed: ${errorMessage(error)}` })
    }
  },
  updateSettings: async (next) => {
    const current = get().settings
    if (!current) return
    const settings = { ...current, ...next }
    await window.lightpaper.setSettings(settings)
    set({ settings })
  },
  seedPlugins: async () => {
    const [plugins, samplePlugins] = await Promise.all([window.lightpaper.seedPlugins(), window.lightpaper.listSamplePlugins()]) as [PluginRecord[], PluginRecord[]]
    await ensureBundledPluginsActivated(plugins)
    set({ plugins, samplePlugins, pluginCommands: listPluginCommands(), pluginAiPresets: listPluginAiPresets(), pluginAiProviders: listPluginAiProviders(), pluginPanels: listPluginPanels(), pluginThemes: listPluginThemes() })
  },
  setPluginEnabled: async (id, enabled) => {
    const plugins = await window.lightpaper.setPluginEnabled(id, enabled) as PluginRecord[]
    await ensureBundledPluginsActivated(plugins)
    set({ plugins, pluginCommands: listPluginCommands(), pluginAiPresets: listPluginAiPresets(), pluginAiProviders: listPluginAiProviders(), pluginPanels: listPluginPanels(), pluginThemes: listPluginThemes(), lastAction: `${enabled ? 'Enabled' : 'Disabled'} ${plugins.find((plugin) => plugin.id === id)?.name ?? id}`, lastError: undefined })
  },
  installSamplePlugin: async (id) => {
    const plugins = await window.lightpaper.installSamplePlugin(id) as PluginRecord[]
    await ensureBundledPluginsActivated(plugins)
    set({ plugins, pluginCommands: listPluginCommands(), pluginAiPresets: listPluginAiPresets(), pluginAiProviders: listPluginAiProviders(), pluginPanels: listPluginPanels(), pluginThemes: listPluginThemes(), lastAction: `Installed ${plugins.find((plugin) => plugin.id === id)?.name ?? id}`, lastError: undefined })
  },
  uninstallPlugin: async (id) => {
    const target = get().plugins.find((plugin) => plugin.id === id)
    const plugins = await window.lightpaper.uninstallPlugin(id) as PluginRecord[]
    await ensureBundledPluginsActivated(plugins)
    set({ plugins, pluginCommands: listPluginCommands(), pluginAiPresets: listPluginAiPresets(), pluginAiProviders: listPluginAiProviders(), pluginPanels: listPluginPanels(), pluginThemes: listPluginThemes(), lastAction: `Uninstalled ${target?.name ?? id}`, lastError: undefined })
  },
  executePluginCommand: async (commandId) => {
    const command = getPluginCommand(commandId)
    if (!command) return set({ lastError: `Plugin command not found: ${commandId}` })
    const snapshot = get()
    const plugin = snapshot.plugins.find((candidate) => candidate.id === command.pluginId)
    const canUseSettings = plugin?.permissions.includes('settings') ?? false
    const requireSettingsPermission = () => {
      if (!canUseSettings) throw new Error(`${command.pluginId} requested settings without declaring the permission`)
    }
    try {
      await command.handler({
        activeFile: snapshot.activeFile,
        selectedText: '',
        documentText: snapshot.content,
        replaceSelection: async (text) => set({ content: text }),
        insertText: async (text) => set({ content: `${get().content}${text}` }),
        showToast: (message) => set({ lastAction: message, lastError: undefined }),
        getSettings: () => {
          requireSettingsPermission()
          const settings = get().settings
          if (!settings) throw new Error('Settings are not loaded')
          return settings
        },
        updateSettings: async (next) => {
          requireSettingsPermission()
          await get().updateSettings(next)
        },
      })
      set({ lastAction: `Ran ${command.title}`, lastError: undefined })
    } catch (error) {
      set({ lastError: `Command failed: ${errorMessage(error)}` })
    }
  },
  runAiAction: async (input) => {
    const fallbackModelId = get().pluginAiProviders.flatMap((provider) => provider.models)[0]?.id
    const selectedModelId = get().settings?.selectedAiModelId || fallbackModelId
    const selected = selectedModelId ? getPluginAiModel(selectedModelId) : undefined
    const enrichedInput: AiActionInput = selected ? { ...input, provider: selected.provider, model: selected.model } : input
    if (input.presetId && getPluginAiPreset(input.presetId)) return runPluginAiPreset(input.presetId, enrichedInput)
    return window.lightpaper.runAi(enrichedInput) as Promise<AiActionOutput>
  },
}))
