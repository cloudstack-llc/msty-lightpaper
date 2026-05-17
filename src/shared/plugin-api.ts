import type { AiActionInput, AiActionOutput, PluginManifest } from './types'

export type LightPaperCommandContext = {
  activeFile?: string
  selectedText?: string
  documentText?: string
  replaceSelection(text: string): Promise<void>
  insertText(text: string): Promise<void>
  showToast(message: string): void
}

export type LightPaperPluginApi = {
  manifest: PluginManifest
  commands: { register(id: string, title: string, handler: (ctx: LightPaperCommandContext) => unknown | Promise<unknown>): void }
  markdown: { addRenderer(name: string, setup: (md: unknown) => void): void }
  ai: { registerPreset(id: string, label: string, handler: (input: AiActionInput) => Promise<AiActionOutput>): void }
  metadata: { set(path: string, key: string, value: unknown): Promise<void>; get<T = unknown>(path: string, key: string): Promise<T | undefined> }
  ui: { registerPanel(id: string, title: string, render: () => HTMLElement): void }
}

export type LightPaperPluginModule = { activate(api: LightPaperPluginApi): void | Promise<void>; deactivate?(): void | Promise<void> }
