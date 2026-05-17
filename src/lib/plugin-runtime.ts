import type { AiActionInput, AiActionOutput, PluginRecord } from '@shared/types'
import type { LightPaperCommandContext, LightPaperPluginApi, LightPaperPluginModule } from '@shared/plugin-api'
import * as aiRewriteToolkit from '../../plugins/samples/ai-rewrite-toolkit/index'
import * as backlinksWikilinks from '../../plugins/samples/backlinks-wikilinks/index'
import * as dailyNotes from '../../plugins/samples/daily-notes/index'
import * as exportPack from '../../plugins/samples/export-pack/index'
import * as frontmatterManager from '../../plugins/samples/frontmatter-manager/index'
import * as linkChecker from '../../plugins/samples/link-checker/index'
import * as markdownLinter from '../../plugins/samples/markdown-linter/index'
import * as publishingSeoChecklist from '../../plugins/samples/publishing-seo-checklist/index'
import * as snippetTemplateLibrary from '../../plugins/samples/snippet-template-library/index'
import * as tableFormatter from '../../plugins/samples/table-formatter/index'

type RegisteredCommand = { id: string; title: string; pluginId: string; pluginName: string; category?: string; handler: (ctx: LightPaperCommandContext) => unknown | Promise<unknown> }
type RegisteredAiPreset = { id: string; label: string; pluginId: string; handler: (input: AiActionInput) => Promise<AiActionOutput> }

type RuntimeState = {
  activated: boolean
  commands: RegisteredCommand[]
  aiPresets: RegisteredAiPreset[]
  metadata: Map<string, Map<string, unknown>>
}

const modules: Record<string, LightPaperPluginModule> = {
  'lightpaper.ai-rewrite-toolkit': aiRewriteToolkit,
  'lightpaper.backlinks-wikilinks': backlinksWikilinks,
  'lightpaper.daily-notes': dailyNotes,
  'lightpaper.export-pack': exportPack,
  'lightpaper.frontmatter-manager': frontmatterManager,
  'lightpaper.link-checker': linkChecker,
  'lightpaper.markdown-linter': markdownLinter,
  'lightpaper.publishing-seo-checklist': publishingSeoChecklist,
  'lightpaper.snippet-template-library': snippetTemplateLibrary,
  'lightpaper.table-formatter': tableFormatter,
}

const state: RuntimeState = { activated: false, commands: [], aiPresets: [], metadata: new Map() }

function commandCategory(plugin: PluginRecord, commandId: string) {
  return plugin.contributes?.commands?.find((command) => command.id === commandId)?.category
}

function createApi(plugin: PluginRecord): LightPaperPluginApi {
  return {
    manifest: plugin,
    commands: {
      register(id, title, handler) {
        state.commands = state.commands.filter((command) => !(command.id === id && command.pluginId === plugin.id))
        state.commands.push({ id, title, handler, pluginId: plugin.id, pluginName: plugin.name, category: commandCategory(plugin, id) })
      },
    },
    markdown: { addRenderer() {} },
    ai: {
      registerPreset(id, label, handler) {
        state.aiPresets = state.aiPresets.filter((preset) => !(preset.id === id && preset.pluginId === plugin.id))
        state.aiPresets.push({ id, label, handler, pluginId: plugin.id })
      },
    },
    metadata: {
      async set(path, key, value) {
        const doc = state.metadata.get(path) ?? new Map<string, unknown>()
        doc.set(key, value)
        state.metadata.set(path, doc)
      },
      async get<T = unknown>(path: string, key: string) {
        return state.metadata.get(path)?.get(key) as T | undefined
      },
    },
    ui: { registerPanel() {} },
  }
}

export async function activateBundledPlugins(plugins: PluginRecord[]) {
  state.commands = []
  state.aiPresets = []
  const enabledPlugins = plugins.filter((plugin) => plugin.enabled !== false)
  for (const plugin of enabledPlugins) {
    const module = modules[plugin.id]
    if (!module) continue
    await module.activate(createApi(plugin))
  }
  state.activated = true
}

export async function ensureBundledPluginsActivated(plugins: PluginRecord[]) {
  await activateBundledPlugins(plugins)
}

export function listPluginCommands() {
  return [...state.commands].sort((a, b) => `${a.category ?? ''}${a.title}`.localeCompare(`${b.category ?? ''}${b.title}`))
}

export function getPluginCommand(id: string) {
  return state.commands.find((command) => command.id === id)
}

export type { RegisteredCommand }
