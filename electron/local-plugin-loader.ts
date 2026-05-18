import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { ExternalPluginBundle, PluginRecord, PluginThemeCssAsset } from '../src/shared/types'
import { validatePluginManifest } from '../src/lib/plugin-manifest'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || 'Unknown plugin error')
}

function isInside(root: string, target: string) {
  const relative = path.relative(root, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function resolveInside(root: string, relativePath: string) {
  const target = path.resolve(root, relativePath)
  if (!isInside(root, target)) throw new Error(`Plugin file escapes package directory: ${relativePath}`)
  return target
}

function pluginCssAssetKey(pluginId: string, cssFile: string) {
  return `${pluginId}:${cssFile}`
}

export function readLocalPluginPackage(rootPath: string): PluginRecord {
  const root = path.resolve(rootPath)
  const manifestPath = path.join(root, 'plugin.json')
  if (!existsSync(manifestPath)) throw new Error(`Missing plugin.json in ${root}`)

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PluginRecord
  const validation = validatePluginManifest(manifest)
  if (!validation.ok) throw new Error(`Invalid local plugin manifest: ${validation.issues.map((issue) => `${issue.path} ${issue.message}`).join('; ')}`)

  if (manifest.main) {
    if (!/\.(cjs|js|mjs)$/.test(manifest.main)) throw new Error('Local plugin main must be a .js, .mjs, or .cjs file')
    const mainPath = resolveInside(root, manifest.main)
    if (!existsSync(mainPath)) throw new Error(`Missing plugin main file: ${manifest.main}`)
  }

  for (const theme of manifest.contributes?.themes ?? []) {
    if (!theme.cssFile) continue
    const cssPath = resolveInside(root, theme.cssFile)
    if (!existsSync(cssPath)) throw new Error(`Missing theme CSS file: ${theme.cssFile}`)
  }

  return { ...manifest, enabled: false, installedPath: root, external: true, sample: false, builtin: false }
}

export function readExternalPluginBundle(plugin: PluginRecord): ExternalPluginBundle {
  if (!plugin.installedPath) return { pluginId: plugin.id, error: 'External plugin is missing installedPath' }
  try {
    const root = path.resolve(plugin.installedPath)
    const mainPath = plugin.main ? resolveInside(root, plugin.main) : undefined
    const cssAssets: PluginThemeCssAsset[] = []
    for (const theme of plugin.contributes?.themes ?? []) {
      if (!theme.cssFile) continue
      const cssPath = resolveInside(root, theme.cssFile)
      cssAssets.push({ key: pluginCssAssetKey(plugin.id, theme.cssFile), pluginId: plugin.id, cssFile: theme.cssFile, css: readFileSync(cssPath, 'utf8') })
    }

    return {
      pluginId: plugin.id,
      mainPath,
      mainCode: mainPath ? readFileSync(mainPath, 'utf8') : undefined,
      cssAssets,
    }
  } catch (error) {
    return { pluginId: plugin.id, error: errorMessage(error) }
  }
}
