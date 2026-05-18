import type { AiActionInput, AiActionOutput, AiProviderConfig, AppSettings, PluginManifest, ThemeContribution } from './types'

export type LightPaperDisposable = { dispose(): void }
export type LightPaperDisposableLike = LightPaperDisposable | (() => void)

export type LightPaperCommandContext = {
  activeFile?: string
  selectedText?: string
  documentText?: string
  replaceSelection(text: string): Promise<void>
  insertText(text: string): Promise<void>
  showToast(message: string): void
  getSettings?(): AppSettings
  updateSettings?(next: Partial<AppSettings>): Promise<void>
}

export type LightPaperCommandHandler = (ctx: LightPaperCommandContext) => unknown | Promise<unknown>

export type LightPaperCommandRegistration = {
  id: string
  title: string
  pluginId: string
  pluginName: string
  category?: string
  when?: string
  handler: LightPaperCommandHandler
}

export type LightPaperAiPresetRegistration = {
  id: string
  label: string
  pluginId: string
  pluginName: string
  handler: (input: AiActionInput) => Promise<AiActionOutput>
}

export type LightPaperAiProviderRegistration = AiProviderConfig & {
  pluginId: string
  pluginName: string
}

export type LightPaperMarkdownExtensionKind = 'remark' | 'rehype'

export type LightPaperMarkdownProcessor = {
  use(plugin: unknown, ...options: unknown[]): LightPaperMarkdownProcessor
}

export type LightPaperMarkdownExtension = {
  id: string
  pluginId: string
  pluginName: string
  kind: LightPaperMarkdownExtensionKind
  apply(processor: LightPaperMarkdownProcessor): void
}

export type LightPaperPanelRegistration = {
  id: string
  title: string
  pluginId: string
  pluginName: string
  location: 'left' | 'right' | 'bottom'
  render: () => HTMLElement
}

export type LightPaperThemeRegistration = ThemeContribution & {
  pluginId: string
  pluginName: string
}

export type LightPaperPluginApi = {
  manifest: PluginManifest
  commands: {
    register(id: string, title: string, handler: LightPaperCommandHandler): LightPaperDisposable
  }
  markdown: {
    registerRemarkPlugin(id: string, plugin: unknown, ...options: unknown[]): LightPaperDisposable
    registerRehypePlugin(id: string, plugin: unknown, ...options: unknown[]): LightPaperDisposable
  }
  ai: {
    registerPreset(id: string, label: string, handler: (input: AiActionInput) => Promise<AiActionOutput>): LightPaperDisposable
    registerProvider(provider: AiProviderConfig): LightPaperDisposable
  }
  metadata: {
    set(path: string, key: string, value: unknown): Promise<void>
    get<T = unknown>(path: string, key: string): Promise<T | undefined>
    delete(path: string, key: string): Promise<void>
  }
  ui: {
    registerPanel(id: string, title: string, render: () => HTMLElement): LightPaperDisposable
  }
}

export type LightPaperPluginModule = { activate(api: LightPaperPluginApi): void | Promise<void>; deactivate?(): void | Promise<void> }
