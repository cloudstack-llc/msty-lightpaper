import type { ExternalPluginBundle } from '@shared/types'
import type { LightPaperPluginModule } from '@shared/plugin-api'

function compileCommonJsPlugin(bundle: ExternalPluginBundle): LightPaperPluginModule {
  const exports: Record<string, unknown> = {}
  const module = { exports }
  const execute = new Function('module', 'exports', 'console', `${bundle.mainCode ?? ''}\n;return module.exports;`)
  const result = execute(module, exports, console) as { default?: unknown; activate?: unknown; deactivate?: unknown }
  const plugin = (result.default && typeof result.default === 'object' ? result.default : result) as { activate?: unknown; deactivate?: unknown }

  if (typeof plugin.activate !== 'function') throw new Error(`External plugin ${bundle.pluginId} did not export activate()`)
  return {
    activate: plugin.activate as LightPaperPluginModule['activate'],
    deactivate: typeof plugin.deactivate === 'function' ? plugin.deactivate as LightPaperPluginModule['deactivate'] : undefined,
  }
}

export function compileExternalPluginModule(bundle: ExternalPluginBundle): LightPaperPluginModule {
  if (bundle.error) return { activate() { throw new Error(bundle.error) } }
  if (!bundle.mainCode?.trim()) return { activate() {} }
  return compileCommonJsPlugin(bundle)
}

export function compileExternalPluginModules(bundles: ExternalPluginBundle[]) {
  return Object.fromEntries(bundles.map((bundle) => [bundle.pluginId, compileExternalPluginModule(bundle)]))
}
