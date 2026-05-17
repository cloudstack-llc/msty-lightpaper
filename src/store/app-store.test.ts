import { beforeEach, describe, expect, it, vi } from 'vitest'
import { samplePlugins } from '../../electron/bundled-plugins'
import { useAppStore } from './app-store'

const settings = {
  theme: 'obsidian',
  editorMode: 'split',
  syncScroll: true,
  splitRatio: 50,
  fontFamily: 'mono',
  aiProvider: 'offline',
  aiModel: 'local-or-plugin',
} as const

function bridge(overrides: Partial<Window['lightpaper']> = {}) {
  return {
    listWorkspaces: vi.fn().mockResolvedValue([]),
    addWorkspace: vi.fn(),
    readTree: vi.fn().mockResolvedValue([]),
    removeWorkspace: vi.fn().mockResolvedValue([]),
    readFile: vi.fn(),
    saveFile: vi.fn().mockResolvedValue(true),
    createEntry: vi.fn(),
    renameEntry: vi.fn(),
    deleteEntry: vi.fn(),
    getSettings: vi.fn().mockResolvedValue(settings),
    setSettings: vi.fn().mockResolvedValue(settings),
    listPlugins: vi.fn().mockResolvedValue([]),
    listSamplePlugins: vi.fn().mockResolvedValue(samplePlugins),
    installSamplePlugin: vi.fn(),
    uninstallPlugin: vi.fn(),
    seedPlugins: vi.fn().mockResolvedValue([]),
    setPluginEnabled: vi.fn(),
    runAi: vi.fn().mockResolvedValue({ text: 'fallback' }),
    ...overrides,
  } as Window['lightpaper']
}

beforeEach(() => {
  window.lightpaper = bridge()
  useAppStore.setState({
    workspaces: [],
    workspaceTrees: [],
    activeWorkspace: undefined,
    activeFile: undefined,
    content: '',
    savedContent: '',
    settings: undefined,
    plugins: [],
    samplePlugins: [],
    pluginCommands: [],
    pluginAiPresets: [],
    pluginAiProviders: [],
    loading: false,
    lastError: undefined,
    lastAction: undefined,
  })
})

describe('useAppStore plugin integration', () => {
  it('hydrates enabled plugins into command and AI registries', async () => {
    const daily = samplePlugins.find((plugin) => plugin.id === 'lightpaper.daily-notes')!
    const ai = samplePlugins.find((plugin) => plugin.id === 'lightpaper.ai-rewrite-toolkit')!
    window.lightpaper = bridge({ seedPlugins: vi.fn().mockResolvedValue([{ ...daily, enabled: true }, { ...ai, enabled: true }]) })

    await useAppStore.getState().hydrate()

    expect(useAppStore.getState().pluginCommands.map((command) => command.id)).toContain('daily.insertTodayTemplate')
    expect(useAppStore.getState().pluginAiPresets.map((preset) => preset.id)).toEqual(expect.arrayContaining(['clarify', 'concise', 'titles']))
  })

  it('executes plugin commands against the active document', async () => {
    const daily = samplePlugins.find((plugin) => plugin.id === 'lightpaper.daily-notes')!
    window.lightpaper = bridge({ seedPlugins: vi.fn().mockResolvedValue([{ ...daily, enabled: true }]) })

    await useAppStore.getState().hydrate()
    useAppStore.setState({ activeFile: '/notes/today.md', content: '', savedContent: '' })
    await useAppStore.getState().executePluginCommand('daily.insertTodayTemplate')

    expect(useAppStore.getState().content).toContain('## Plan')
    expect(useAppStore.getState().lastAction).toBe('Ran Insert Today Template')
  })

  it('routes plugin AI presets before falling back to the Electron bridge', async () => {
    const ai = samplePlugins.find((plugin) => plugin.id === 'lightpaper.ai-rewrite-toolkit')!
    const runAi = vi.fn().mockResolvedValue({ text: 'bridge fallback' })
    window.lightpaper = bridge({ seedPlugins: vi.fn().mockResolvedValue([{ ...ai, enabled: true }]), runAi })

    await useAppStore.getState().hydrate()
    const pluginOutput = await useAppStore.getState().runAiAction({ presetId: 'clarify', text: 'We utilize this in order to ship.' })
    const bridgeOutput = await useAppStore.getState().runAiAction({ presetId: 'summary', text: 'Fallback text.' })

    expect(pluginOutput.text).toBe('We use this to ship.')
    expect(bridgeOutput.text).toBe('bridge fallback')
    expect(runAi).toHaveBeenCalledOnce()
  })

  it('passes the selected model provider config into AI actions', async () => {
    const provider = samplePlugins.find((plugin) => plugin.id === 'lightpaper.model-provider-catalog')!
    const runAi = vi.fn().mockResolvedValue({ text: 'bridge fallback' })
    window.lightpaper = bridge({ seedPlugins: vi.fn().mockResolvedValue([{ ...provider, enabled: true }]), runAi })

    await useAppStore.getState().hydrate()
    await useAppStore.getState().updateSettings({ selectedAiModelId: 'llama-local' })
    await useAppStore.getState().runAiAction({ presetId: 'summary', text: 'Fallback text.' })

    expect(runAi.mock.calls[0]?.[0].model.name).toBe('Llama local')
    expect(runAi.mock.calls[0]?.[0].provider.name).toBe('Ollama Local')
  })
})
