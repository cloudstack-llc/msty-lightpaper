import { describe, expect, it } from 'vitest'
import { cssAssetsForThemes, listBundledThemeCssAssetKeys, themeCssAssetKey } from './plugin-theme-assets'

describe('plugin theme CSS assets', () => {
  it('resolves bundled theme CSS from enabled theme registrations', () => {
    const assets = cssAssetsForThemes([
      { id: 'minimal-workspace', label: 'Minimal Workspace', pluginId: 'lightpaper.minimal-workspace', pluginName: 'Minimal Workspace', cssFile: 'minimal-workspace.css' },
      { id: 'quiet-focus', label: 'Quiet Focus', pluginId: 'lightpaper.theme-gallery', pluginName: 'Theme Gallery', cssFile: 'themes.css' },
      { id: 'story-codex', label: 'Story Codex', pluginId: 'lightpaper.theme-gallery', pluginName: 'Theme Gallery', cssFile: 'themes.css' },
    ])

    expect(assets).toHaveLength(2)
    expect(assets.map((asset) => asset.key)).toEqual([themeCssAssetKey('lightpaper.minimal-workspace', 'minimal-workspace.css'), themeCssAssetKey('lightpaper.theme-gallery', 'themes.css')])
    expect(assets[0].css).toContain('.theme-minimal-workspace')
    expect(assets[0].css).toContain('[data-lp-layout="focus"]')
    expect(assets[1].css).toContain('.theme-quiet-focus')
    expect(assets[1].css).toContain('.theme-story-codex')
  })

  it('ignores undeclared or unavailable CSS assets', () => {
    expect(cssAssetsForThemes([
      { id: 'plain', label: 'Plain', pluginId: 'plugin.without.css', pluginName: 'No CSS' },
      { id: 'missing', label: 'Missing', pluginId: 'plugin.missing.css', pluginName: 'Missing CSS', cssFile: 'themes.css' },
    ])).toEqual([])
  })

  it('resolves external local plugin CSS assets by plugin and css file', () => {
    const assets = cssAssetsForThemes([
      { id: 'local-theme', label: 'Local Theme', pluginId: 'local.example', pluginName: 'Local Example', cssFile: 'theme.css' },
    ], [
      { key: themeCssAssetKey('local.example', 'theme.css'), pluginId: 'local.example', cssFile: 'theme.css', css: '.theme-local-theme { color: red; }' },
    ])

    expect(assets).toEqual([{ key: 'local.example:theme.css', pluginId: 'local.example', cssFile: 'theme.css', css: '.theme-local-theme { color: red; }' }])
  })

  it('keeps the bundled CSS asset allowlist explicit', () => {
    expect(listBundledThemeCssAssetKeys()).toEqual(['lightpaper.minimal-workspace:minimal-workspace.css', 'lightpaper.theme-gallery:themes.css'])
  })
})
