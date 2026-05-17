export type Workspace = { id: string; name: string; path: string; createdAt: number; lastOpenedAt: number }
export type FileNode = { id: string; name: string; path: string; relativePath: string; kind: 'file' | 'folder'; children?: FileNode[] }
export type NoteMeta = { path: string; title: string; summary?: string; tags: string[]; wordCount: number; updatedAt: number }
export type EditorMode = 'write' | 'preview' | 'split'
export type ThemeId = 'obsidian' | 'paper' | 'midnight' | 'solar' | 'forest'
export type AiPreset = { id: string; label: string; prompt: string; scope: 'selection' | 'document' | 'paragraph' }
export type AiModelCapability = 'chat' | 'completion' | 'markdown' | 'json' | 'vision' | 'tools' | 'streaming' | 'embeddings' | 'local' | 'reasoning'
export type AiProviderAuthConfig = { type: 'none' | 'api-key' | 'bearer' | 'custom-header'; apiKeyRef?: string; envVar?: string; headerName?: string }
export type AiModelPrice = { inputPerMillion?: number; outputPerMillion?: number; currency: 'USD' | 'EUR' | 'GBP' }
export type AiModelConfig = {
  id: string
  providerId: string
  name: string
  family: string
  endpoint?: string
  contextWindow: number
  maxOutputTokens?: number
  defaultTemperature?: number
  capabilities: AiModelCapability[]
  pricing?: AiModelPrice
  notes?: string
}
export type AiProviderConfig = {
  id: string
  name: string
  pluginId?: string
  baseUrl: string
  auth: AiProviderAuthConfig
  docsUrl?: string
  models: AiModelConfig[]
}
export type PluginPermission = 'filesystem' | 'ai' | 'markdown' | 'ui' | 'metadata' | 'commands'
export type PluginManifest = { id: string; name: string; version: string; description: string; author?: string; main?: string; permissions: PluginPermission[]; contributes?: { commands?: PluginCommandContribution[]; markdown?: PluginMarkdownContribution[]; markdownIt?: string[]; themes?: ThemeContribution[]; aiPresets?: AiPreset[]; aiProviders?: PluginAiProviderContribution[]; panels?: PluginPanelContribution[] } }
export type PluginCommandContribution = { id: string; title: string; category?: string; when?: string }
export type PluginMarkdownContribution = { id: string; kind: 'remark' | 'rehype'; description?: string }
export type PluginAiProviderContribution = { id: string; title: string; models?: string[] }
export type PluginPanelContribution = { id: string; title: string; location: 'left' | 'right' | 'bottom' }
export type ThemeContribution = { id: string; label: string; cssFile?: string }
export type PluginRecord = PluginManifest & { enabled: boolean; installedPath?: string; builtin?: boolean; sample?: boolean }
export type AppSettings = { theme: ThemeId; editorMode: EditorMode; syncScroll: boolean; splitRatio: number; fontFamily: 'sans' | 'serif' | 'mono'; aiProvider: 'offline' | 'openai-compatible' | 'custom-plugin'; aiEndpoint?: string; aiModel?: string; selectedAiModelId?: string }
export type SearchResult = { path: string; title: string; excerpt: string; score: number }
export type CreateEntryInput = { workspaceId: string; parentPath: string; name: string; kind: 'file' | 'folder' }
export type RenameEntryInput = { workspaceId: string; path: string; nextName: string }
export type DeleteEntryInput = { workspaceId: string; path: string }
export type SaveFileInput = { workspaceId: string; path: string; content: string }
export type AiActionInput = { presetId?: string; prompt?: string; text: string; document?: string; path?: string; provider?: AiProviderConfig; model?: AiModelConfig }
export type AiActionOutput = { text: string; tags?: string[]; summary?: string }
export type VaultStatus = { exists: boolean; unlocked: boolean; secretCount: number; updatedAt?: number; version?: number; error?: string }
export type SecretRefStatus = { apiKeyRef: string; hasSecret: boolean; updatedAt?: number; deleted?: boolean }
