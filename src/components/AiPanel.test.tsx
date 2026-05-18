import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AiPanel } from './AiPanel'
import { useAppStore } from '@/store/app-store'
import type { AiProviderConfig } from '@shared/types'

const provider: AiProviderConfig = {
  id: 'test.provider',
  name: 'Test Provider',
  pluginId: 'test.plugin',
  baseUrl: 'https://models.example.test',
  auth: { type: 'bearer', apiKeyRef: 'secret://providers/test/api-key' },
  models: [
    { id: 'fast-model', providerId: 'test.provider', name: 'Fast Model', family: 'test', contextWindow: 64000, capabilities: ['chat', 'markdown'] },
    { id: 'deep-model', providerId: 'test.provider', name: 'Deep Model', family: 'test', contextWindow: 128000, capabilities: ['chat', 'markdown', 'reasoning'] },
  ],
}

function setPanelState() {
  useAppStore.setState({
    content: '# Draft',
    savedContent: '# Draft',
    activeFile: '/notes/draft.md',
    settings: {
      theme: 'obsidian',
      editorMode: 'split',
      syncScroll: true,
      splitRatio: 50,
      fontFamily: 'mono',
      layoutMode: 'standard',
      themeSettings: {},
      aiProvider: 'offline',
      aiModel: 'local-or-plugin',
    },
    pluginAiPresets: [],
    pluginAiProviders: [{ ...provider, pluginId: 'test.plugin', pluginName: 'Provider Plugin' }],
  })
}

describe('AiPanel model selection', () => {
  it('lets users select a loaded provider model', async () => {
    window.lightpaper = {
      setSettings: vi.fn().mockImplementation(async (settings) => settings),
      vaultStatus: vi.fn().mockResolvedValue({ exists: false, unlocked: false, secretCount: 0 }),
      createVault: vi.fn().mockResolvedValue({ exists: true, unlocked: true, secretCount: 0 }),
      unlockVault: vi.fn().mockResolvedValue({ exists: true, unlocked: true, secretCount: 0 }),
      lockVault: vi.fn().mockResolvedValue({ exists: true, unlocked: false, secretCount: 0 }),
      setProviderSecret: vi.fn(),
      deleteProviderSecret: vi.fn(),
      hasProviderSecret: vi.fn().mockResolvedValue(false),
      listSecretRefs: vi.fn().mockResolvedValue([]),
    } as unknown as Window['lightpaper']
    setPanelState()
     render(<AiPanel open onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'deep-model' } })

    await waitFor(() => expect(useAppStore.getState().settings?.selectedAiModelId).toBe('deep-model'))
    expect(useAppStore.getState().settings?.aiProvider).toBe('custom-plugin')
  })

  it('shows provider secret status without rendering raw API keys', async () => {
    const plaintext = 'sk-test-should-not-render'
    window.lightpaper = {
      setSettings: vi.fn().mockImplementation(async (settings) => settings),
      vaultStatus: vi.fn().mockResolvedValue({ exists: true, unlocked: false, secretCount: 1 }),
      createVault: vi.fn(),
      unlockVault: vi.fn(),
      lockVault: vi.fn(),
      setProviderSecret: vi.fn(),
      deleteProviderSecret: vi.fn(),
      hasProviderSecret: vi.fn().mockResolvedValue(true),
      listSecretRefs: vi.fn().mockResolvedValue(['secret://providers/test/api-key']),
    } as unknown as Window['lightpaper']
    setPanelState()

    render(<AiPanel open onClose={vi.fn()} />)

    expect(await screen.findByText('configured')).toBeInTheDocument()
    expect(screen.queryByText(plaintext)).not.toBeInTheDocument()
  })
})
