import type { AiActionInput, AiActionOutput, AiProviderConfig, PluginPermission, PluginRecord } from '@shared/types'
import type {
  LightPaperAiProviderRegistration,
  LightPaperAiPresetRegistration,
  LightPaperCommandContext,
  LightPaperCommandRegistration,
  LightPaperDisposable,
  LightPaperMarkdownExtension,
  LightPaperMarkdownProcessor,
  LightPaperPanelRegistration,
  LightPaperPluginApi,
  LightPaperPluginModule,
} from '@shared/plugin-api'
import { describePlugin, validatePluginManifest } from './plugin-manifest'

export type PluginActivationError = {
  pluginId: string
  message: string
}

export type PluginMetadataStore = {
  get<T = unknown>(pluginId: string, path: string, key: string): Promise<T | undefined>
  set(pluginId: string, path: string, key: string, value: unknown): Promise<void>
  delete(pluginId: string, path: string, key: string): Promise<void>
}

export type PluginHostOptions = {
  modules: Record<string, LightPaperPluginModule>
  metadataStore?: PluginMetadataStore
  onError?(error: PluginActivationError): void
}

class MemoryPluginMetadataStore implements PluginMetadataStore {
  private values = new Map<string, unknown>()

  async get<T = unknown>(pluginId: string, path: string, key: string) {
    return this.values.get(this.key(pluginId, path, key)) as T | undefined
  }

  async set(pluginId: string, path: string, key: string, value: unknown) {
    this.values.set(this.key(pluginId, path, key), value)
  }

  async delete(pluginId: string, path: string, key: string) {
    this.values.delete(this.key(pluginId, path, key))
  }

  private key(pluginId: string, path: string, key: string) {
    return `${pluginId}\u0000${path}\u0000${key}`
  }
}

function commandCategory(plugin: PluginRecord, commandId: string) {
  return plugin.contributes?.commands?.find((command) => command.id === commandId)?.category
}

function commandWhen(plugin: PluginRecord, commandId: string) {
  return plugin.contributes?.commands?.find((command) => command.id === commandId)?.when
}

function panelLocation(plugin: PluginRecord, panelId: string): LightPaperPanelRegistration['location'] {
  return plugin.contributes?.panels?.find((panel) => panel.id === panelId)?.location ?? 'right'
}

function noopDisposable(): LightPaperDisposable {
  return { dispose() {} }
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown plugin error')
}

export class PluginHost {
  private modules: Record<string, LightPaperPluginModule>
  private metadataStore: PluginMetadataStore
  private onError?: (error: PluginActivationError) => void
  private activePluginIds = new Set<string>()
  private records = new Map<string, PluginRecord>()
  private commands: LightPaperCommandRegistration[] = []
  private aiPresets: LightPaperAiPresetRegistration[] = []
  private aiProviders: LightPaperAiProviderRegistration[] = []
  private markdownExtensions: LightPaperMarkdownExtension[] = []
  private panels: LightPaperPanelRegistration[] = []
  private activationErrors: PluginActivationError[] = []

  constructor(options: PluginHostOptions) {
    this.modules = options.modules
    this.metadataStore = options.metadataStore ?? new MemoryPluginMetadataStore()
    this.onError = options.onError
  }

  get errors() {
    return [...this.activationErrors]
  }

  get activeIds() {
    return [...this.activePluginIds]
  }

  async activatePlugins(plugins: PluginRecord[]) {
    await this.deactivateAll()
    this.records = new Map(plugins.map((plugin) => [plugin.id, plugin]))
    this.activationErrors = []

    for (const plugin of plugins.filter((candidate) => candidate.enabled !== false)) {
      await this.activatePlugin(plugin)
    }
  }

  async deactivateAll() {
    const modulesToDeactivate = [...this.activePluginIds]
      .map((pluginId) => this.modules[pluginId])
      .filter((plugin): plugin is LightPaperPluginModule => Boolean(plugin?.deactivate))

    this.activePluginIds.clear()
    this.commands = []
    this.aiPresets = []
    this.aiProviders = []
    this.markdownExtensions = []
    this.panels = []

    for (const module of modulesToDeactivate) {
      await module.deactivate?.()
    }
  }

  listCommands() {
    return [...this.commands].sort((a, b) => `${a.category ?? ''}${a.title}`.localeCompare(`${b.category ?? ''}${b.title}`))
  }

  getCommand(id: string) {
    return this.commands.find((command) => command.id === id)
  }

  async executeCommand(id: string, context: LightPaperCommandContext) {
    const command = this.getCommand(id)
    if (!command) throw new Error(`Plugin command not found: ${id}`)
    return command.handler(context)
  }

  listAiPresets() {
    return [...this.aiPresets].sort((a, b) => a.label.localeCompare(b.label))
  }

  getAiPreset(id: string) {
    return this.aiPresets.find((preset) => preset.id === id)
  }

  listAiProviders() {
    return [...this.aiProviders].sort((a, b) => a.name.localeCompare(b.name))
  }

  listAiModels() {
    return this.listAiProviders().flatMap((provider) => provider.models.map((model) => ({ ...model, providerId: provider.id })))
  }

  getAiProvider(id: string) {
    return this.aiProviders.find((provider) => provider.id === id)
  }

  getAiModel(modelId: string) {
    for (const provider of this.aiProviders) {
      const model = provider.models.find((candidate) => candidate.id === modelId)
      if (model) return { provider, model: { ...model, providerId: provider.id } }
    }
    return undefined
  }

  async runAiPreset(id: string, input: AiActionInput): Promise<AiActionOutput> {
    const preset = this.getAiPreset(id)
    if (!preset) throw new Error(`Plugin AI preset not found: ${id}`)
    return preset.handler(input)
  }

  listMarkdownExtensions(kind?: LightPaperMarkdownExtension['kind']) {
    return this.markdownExtensions.filter((extension) => !kind || extension.kind === kind)
  }

  listPanels(location?: LightPaperPanelRegistration['location']) {
    return this.panels.filter((panel) => !location || panel.location === location)
  }

  private async activatePlugin(plugin: PluginRecord) {
    const validation = validatePluginManifest(plugin)
    if (!validation.ok) {
      return this.reportError({
        pluginId: plugin.id,
        message: `Invalid manifest for ${describePlugin(plugin)}: ${validation.issues.map((issue) => `${issue.path} ${issue.message}`).join('; ')}`,
      })
    }

    const module = this.modules[plugin.id]
    if (!module) {
      return this.reportError({ pluginId: plugin.id, message: `No bundled module registered for ${describePlugin(plugin)}` })
    }

    try {
      await module.activate(this.createApi(plugin))
      this.activePluginIds.add(plugin.id)
    } catch (error) {
      this.removePluginContributions(plugin.id)
      this.reportError({ pluginId: plugin.id, message: toErrorMessage(error) })
    }
  }

  private createApi(plugin: PluginRecord): LightPaperPluginApi {
    return {
      manifest: plugin,
      commands: {
        register: (id, title, handler) => this.withPermission(plugin, 'commands', () => {
          this.ensureUnique(this.commands, id, 'command')
          const registration: LightPaperCommandRegistration = {
            id,
            title,
            handler,
            pluginId: plugin.id,
            pluginName: plugin.name,
            category: commandCategory(plugin, id),
            when: commandWhen(plugin, id),
          }
          this.commands.push(registration)
          return this.disposable(() => {
            this.commands = this.commands.filter((command) => command !== registration)
          })
        }),
      },
      markdown: {
        registerRemarkPlugin: (id, extension, ...options) => this.registerMarkdownExtension(plugin, 'remark', id, extension, options),
        registerRehypePlugin: (id, extension, ...options) => this.registerMarkdownExtension(plugin, 'rehype', id, extension, options),
      },
      ai: {
        registerPreset: (id, label, handler) => this.withPermission(plugin, 'ai', () => {
          this.ensureUnique(this.aiPresets, id, 'AI preset')
          const registration: LightPaperAiPresetRegistration = { id, label, handler, pluginId: plugin.id, pluginName: plugin.name }
          this.aiPresets.push(registration)
          return this.disposable(() => {
            this.aiPresets = this.aiPresets.filter((preset) => preset !== registration)
          })
        }),
        registerProvider: (provider) => this.withPermission(plugin, 'ai', () => {
          this.ensureUnique(this.aiProviders, provider.id, 'AI provider')
          const normalized = this.normalizeAiProvider(plugin, provider)
          this.aiProviders.push(normalized)
          return this.disposable(() => {
            this.aiProviders = this.aiProviders.filter((item) => item !== normalized)
          })
        }),
      },
      metadata: {
        get: <T = unknown>(path: string, key: string) => this.withPermission(plugin, 'metadata', () => this.metadataStore.get<T>(plugin.id, path, key)),
        set: (path, key, value) => this.withPermission(plugin, 'metadata', () => this.metadataStore.set(plugin.id, path, key, value)),
        delete: (path, key) => this.withPermission(plugin, 'metadata', () => this.metadataStore.delete(plugin.id, path, key)),
      },
      ui: {
        registerPanel: (id, title, render) => this.withPermission(plugin, 'ui', () => {
          this.ensureUnique(this.panels, id, 'panel')
          const registration: LightPaperPanelRegistration = { id, title, render, pluginId: plugin.id, pluginName: plugin.name, location: panelLocation(plugin, id) }
          this.panels.push(registration)
          return this.disposable(() => {
            this.panels = this.panels.filter((panel) => panel !== registration)
          })
        }),
      },
    }
  }

  private registerMarkdownExtension(plugin: PluginRecord, kind: LightPaperMarkdownExtension['kind'], id: string, extension: unknown, options: unknown[]) {
    return this.withPermission(plugin, 'markdown', () => {
      this.ensureUnique(this.markdownExtensions, id, 'Markdown extension')
      const registration: LightPaperMarkdownExtension = {
        id,
        kind,
        pluginId: plugin.id,
        pluginName: plugin.name,
        apply(processor: LightPaperMarkdownProcessor) {
          processor.use(extension, ...options)
        },
      }
      this.markdownExtensions.push(registration)
      return this.disposable(() => {
        this.markdownExtensions = this.markdownExtensions.filter((item) => item !== registration)
      })
    })
  }

  private withPermission<T>(plugin: PluginRecord, permission: PluginPermission, action: () => T): T {
    if (!plugin.permissions.includes(permission)) {
      throw new Error(`${plugin.id} requested ${permission} without declaring the permission`)
    }
    return action()
  }

  private ensureUnique(items: Array<{ id: string; pluginId: string }>, id: string, label: string) {
    const existing = items.find((item) => item.id === id)
    if (existing) throw new Error(`Duplicate ${label} id "${id}" already registered by ${existing.pluginId}`)
  }

  private disposable(dispose: () => void): LightPaperDisposable {
    return { dispose }
  }

  private removePluginContributions(pluginId: string) {
    this.commands = this.commands.filter((command) => command.pluginId !== pluginId)
    this.aiPresets = this.aiPresets.filter((preset) => preset.pluginId !== pluginId)
    this.aiProviders = this.aiProviders.filter((provider) => provider.pluginId !== pluginId)
    this.markdownExtensions = this.markdownExtensions.filter((extension) => extension.pluginId !== pluginId)
    this.panels = this.panels.filter((panel) => panel.pluginId !== pluginId)
    this.activePluginIds.delete(pluginId)
  }

  private reportError(error: PluginActivationError) {
    this.activationErrors.push(error)
    this.onError?.(error)
    return noopDisposable()
  }

  private normalizeAiProvider(plugin: PluginRecord, provider: AiProviderConfig): LightPaperAiProviderRegistration {
    return {
      ...provider,
      pluginId: plugin.id,
      pluginName: plugin.name,
      models: provider.models.map((model) => ({ ...model, providerId: provider.id })),
    }
  }
}
