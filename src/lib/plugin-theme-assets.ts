import type { LightPaperThemeRegistration } from '@shared/plugin-api'
import minimalWorkspaceCss from '../../plugins/samples/minimal-workspace/minimal-workspace.css?inline'
import themeGalleryCss from '../../plugins/samples/theme-gallery/themes.css?inline'

export type PluginThemeCssAsset = {
  key: string
  pluginId: string
  cssFile: string
  css: string
}

const bundledThemeCss = new Map<string, string>([
  ['lightpaper.minimal-workspace:minimal-workspace.css', minimalWorkspaceCss],
  ['lightpaper.theme-gallery:themes.css', themeGalleryCss],
])

export function themeCssAssetKey(pluginId: string, cssFile: string) {
  return `${pluginId}:${cssFile}`
}

export function listBundledThemeCssAssetKeys() {
  return [...bundledThemeCss.keys()].sort()
}

export function cssAssetsForThemes(themes: LightPaperThemeRegistration[]): PluginThemeCssAsset[] {
  const seen = new Set<string>()
  const assets: PluginThemeCssAsset[] = []

  for (const theme of themes) {
    if (!theme.cssFile) continue
    const key = themeCssAssetKey(theme.pluginId, theme.cssFile)
    if (seen.has(key)) continue
    seen.add(key)

    const css = bundledThemeCss.get(key)
    if (css) assets.push({ key, pluginId: theme.pluginId, cssFile: theme.cssFile, css })
  }

  return assets
}
