import { describe, expect, it, vi } from 'vitest'
import type { PluginRecord } from '@shared/types'
import type { LightPaperPluginModule } from '@shared/plugin-api'
import { PluginHost, type PluginMetadataStore } from './plugin-host'
import { validatePluginManifest } from './plugin-manifest'

function plugin(overrides: Partial<PluginRecord> = {}): PluginRecord {
  return {
    id: 'test.plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'Test plugin',
    permissions: ['commands'],
    contributes: { commands: [{ id: 'test.run', title: 'Run Test', category: 'Test' }] },
    enabled: true,
    ...overrides,
  }
}

describe('PluginHost', () => {
  it('activates enabled plugins and executes registered commands', async () => {
    const handler = vi.fn()
    const module: LightPaperPluginModule = {
      activate(api) {
        api.commands.register('test.run', 'Run Test', handler)
      },
    }
    const host = new PluginHost({ modules: { 'test.plugin': module } })

    await host.activatePlugins([plugin()])
    await host.executeCommand('test.run', {
      documentText: '# Hello',
      replaceSelection: vi.fn(),
      insertText: vi.fn(),
      showToast: vi.fn(),
    })

    expect(host.listCommands()).toMatchObject([{ id: 'test.run', pluginId: 'test.plugin', category: 'Test' }])
    expect(handler).toHaveBeenCalledOnce()
  })

  it('cleans up contributions before reactivating plugins', async () => {
    const module: LightPaperPluginModule = {
      activate(api) {
        api.commands.register('test.run', 'Run Test', vi.fn())
      },
    }
    const host = new PluginHost({ modules: { 'test.plugin': module } })

    await host.activatePlugins([plugin()])
    await host.activatePlugins([plugin()])

    expect(host.listCommands()).toHaveLength(1)
  })

  it('enforces declared permissions at activation time', async () => {
    const module: LightPaperPluginModule = {
      activate(api) {
        api.commands.register('test.run', 'Run Test', vi.fn())
      },
    }
    const host = new PluginHost({ modules: { 'test.plugin': module } })

    await host.activatePlugins([plugin({ permissions: [], contributes: undefined })])

    expect(host.listCommands()).toHaveLength(0)
    expect(host.errors[0]?.message).toContain('without declaring the permission')
  })

  it('rejects duplicate command ids across active plugins', async () => {
    const first = plugin({ id: 'test.one', name: 'One' })
    const second = plugin({ id: 'test.two', name: 'Two' })
    const module: LightPaperPluginModule = {
      activate(api) {
        api.commands.register('test.run', 'Run Test', vi.fn())
      },
    }
    const host = new PluginHost({ modules: { 'test.one': module, 'test.two': module } })

    await host.activatePlugins([first, second])

    expect(host.listCommands()).toHaveLength(1)
    expect(host.errors[0]?.message).toContain('Duplicate command id')
  })

  it('namespaces plugin metadata by plugin id', async () => {
    const store: PluginMetadataStore = {
      values: new Map<string, unknown>(),
      async get<T = unknown>(pluginId: string, path: string, key: string) {
        return this.values.get(`${pluginId}:${path}:${key}`) as T | undefined
      },
      async set(pluginId: string, path: string, key: string, value: unknown) {
        this.values.set(`${pluginId}:${path}:${key}`, value)
      },
      async delete(pluginId: string, path: string, key: string) {
        this.values.delete(`${pluginId}:${path}:${key}`)
      },
    } as PluginMetadataStore & { values: Map<string, unknown> }
    const module: LightPaperPluginModule = {
      activate(api) {
        api.commands.register('test.run', 'Run Test', async (ctx) => {
          await api.metadata.set(ctx.activeFile || 'missing.md', 'score', 42)
        })
      },
    }
    const host = new PluginHost({ modules: { 'test.plugin': module }, metadataStore: store })

    await host.activatePlugins([plugin({ permissions: ['commands', 'metadata'] })])
    await host.executeCommand('test.run', { activeFile: '/notes/a.md', replaceSelection: vi.fn(), insertText: vi.fn(), showToast: vi.fn() })

    await expect(store.get('test.plugin', '/notes/a.md', 'score')).resolves.toBe(42)
    await expect(store.get('other.plugin', '/notes/a.md', 'score')).resolves.toBeUndefined()
  })

  it('registers remark and rehype extensions as first-class contributions', async () => {
    const remarkPlugin = () => () => undefined
    const rehypePlugin = () => () => undefined
    const module: LightPaperPluginModule = {
      activate(api) {
        api.markdown.registerRemarkPlugin('remark-one', remarkPlugin)
        api.markdown.registerRehypePlugin('rehype-one', rehypePlugin)
      },
    }
    const host = new PluginHost({ modules: { 'test.plugin': module } })

    await host.activatePlugins([plugin({ permissions: ['markdown'], contributes: { markdown: [{ id: 'remark-one', kind: 'remark' }, { id: 'rehype-one', kind: 'rehype' }] } })])

    expect(host.listMarkdownExtensions('remark')).toHaveLength(1)
    expect(host.listMarkdownExtensions('rehype')).toHaveLength(1)
  })

  it('registers AI provider model catalogs as selectable runtime data', async () => {
    const module: LightPaperPluginModule = {
      activate(api) {
        api.ai.registerProvider({
          id: 'test.provider',
          name: 'Test Provider',
          baseUrl: 'https://models.example.test/v1',
          auth: { type: 'bearer', apiKeyRef: 'secret://providers/test/api-key' },
          models: [{
            id: 'test-model',
            providerId: 'test.provider',
            name: 'Test Model',
            family: 'test',
            contextWindow: 128000,
            capabilities: ['chat', 'markdown'],
            pricing: { inputPerMillion: 1, outputPerMillion: 2, currency: 'USD' },
          }],
        })
      },
    }
    const host = new PluginHost({ modules: { 'test.plugin': module } })

    await host.activatePlugins([plugin({ permissions: ['ai'], contributes: { aiProviders: [{ id: 'test.provider', title: 'Test Provider', models: ['test-model'] }] } })])

    expect(host.listAiProviders()).toHaveLength(1)
    expect(host.getAiModel('test-model')?.provider.name).toBe('Test Provider')
  })

  it('exposes manifest theme contributions for enabled plugins', async () => {
    const module: LightPaperPluginModule = { activate() {} }
    const host = new PluginHost({ modules: { 'test.plugin': module } })

    await host.activatePlugins([plugin({
      permissions: [],
      contributes: { themes: [{ id: 'test-theme', label: 'Test Theme', modes: ['dark'], inspiration: 'Test source', cssFile: 'theme.css' }] },
    })])

    expect(host.listThemes()).toEqual([{ id: 'test-theme', label: 'Test Theme', modes: ['dark'], inspiration: 'Test source', cssFile: 'theme.css', pluginId: 'test.plugin', pluginName: 'Test Plugin' }])
  })
})

describe('validatePluginManifest', () => {
  it('returns actionable manifest issues', () => {
    const result = validatePluginManifest(plugin({
      id: '',
      permissions: ['commands'],
      contributes: { commands: [{ id: 'same', title: 'One' }, { id: 'same', title: 'Two' }], themes: [{ id: 'theme', label: 'Theme', cssFile: '../theme.css' }] },
    }))

    expect(result.ok).toBe(false)
    expect(result.issues.map((issue) => issue.path)).toContain('id')
    expect(result.issues.map((issue) => issue.path)).toContain('contributes.themes.0.cssFile')
    expect(result.issues.map((issue) => issue.message).join('\n')).toContain('Duplicate contribution id')
  })
})
