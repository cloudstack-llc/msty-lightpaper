import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AiPanel } from './AiPanel'
import { useAppStore } from '@/store/app-store'

describe('AiPanel model selection', () => {
  it('lets users select a loaded provider model', async () => {
    window.lightpaper = {
      setSettings: vi.fn().mockImplementation(async (settings) => settings),
    } as unknown as Window['lightpaper']
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
        aiProvider: 'offline',
        aiModel: 'local-or-plugin',
      },
      pluginAiPresets: [],
      pluginAiProviders: [{
        id: 'test.provider',
        name: 'Test Provider',
        pluginId: 'test.plugin',
        pluginName: 'Provider Plugin',
        baseUrl: 'https://models.example.test',
        auth: { type: 'bearer', apiKeyRef: 'secret://providers/test/api-key' },
        models: [
          { id: 'fast-model', providerId: 'test.provider', name: 'Fast Model', family: 'test', contextWindow: 64000, capabilities: ['chat', 'markdown'] },
          { id: 'deep-model', providerId: 'test.provider', name: 'Deep Model', family: 'test', contextWindow: 128000, capabilities: ['chat', 'markdown', 'reasoning'] },
        ],
      }],
    })

    render(<AiPanel open onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'deep-model' } })

    await waitFor(() => expect(useAppStore.getState().settings?.selectedAiModelId).toBe('deep-model'))
    expect(useAppStore.getState().settings?.aiProvider).toBe('custom-plugin')
  })
})
