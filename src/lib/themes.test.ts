import { describe, expect, it } from 'vitest'
import type { AppSettings, ThemeContribution } from '@shared/types'
import { applyThemeRuntime, themeOptions } from './themes'

const settings: AppSettings = {
  theme: 'minimal-workspace',
  editorMode: 'split',
  syncScroll: true,
  splitRatio: 50,
  fontFamily: 'mono',
  layoutMode: 'focus',
  themeSettings: {
    'minimal-workspace': {
      accent: 'green',
      lineWidth: '82ch',
      hideBorders: true,
    },
  },
  aiProvider: 'offline',
  aiModel: 'local-or-plugin',
}

const theme: ThemeContribution & { pluginId: string; pluginName: string } = {
  id: 'minimal-workspace',
  label: 'Minimal Workspace',
  pluginId: 'lightpaper.minimal-workspace',
  pluginName: 'Minimal Workspace',
  settings: [
    { id: 'accent', label: 'Accent', type: 'select', defaultValue: 'blue', dataAttribute: 'lp-theme-accent', options: [{ value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' }] },
    { id: 'lineWidth', label: 'Line width', type: 'select', defaultValue: '68ch', cssVariable: '--preview-measure', options: [{ value: '68ch', label: 'Normal' }, { value: '82ch', label: 'Wide' }] },
    { id: 'hideBorders', label: 'Hide borders', type: 'toggle', defaultValue: false, dataAttribute: 'lp-hide-borders' },
  ],
}

describe('theme runtime attributes', () => {
  it('applies selected theme settings to html data attributes and CSS variables', () => {
    const root = document.createElement('html')

    applyThemeRuntime(root, settings, themeOptions([theme]))

    expect(root.className).toBe('theme-minimal-workspace dark')
    expect(root.dataset.lpTheme).toBe('minimal-workspace')
    expect(root.dataset.lpLayout).toBe('focus')
    expect(root.getAttribute('data-lp-theme-accent')).toBe('green')
    expect(root.getAttribute('data-lp-hide-borders')).toBe('true')
    expect(root.style.getPropertyValue('--preview-measure')).toBe('82ch')
  })

  it('cleans up previous plugin theme runtime settings when the active theme changes', () => {
    const root = document.createElement('html')

    applyThemeRuntime(root, settings, themeOptions([theme]))
    applyThemeRuntime(root, { ...settings, theme: 'obsidian', layoutMode: 'standard' }, themeOptions([]))

    expect(root.className).toBe('theme-obsidian dark')
    expect(root.getAttribute('data-lp-theme-accent')).toBeNull()
    expect(root.getAttribute('data-lp-hide-borders')).toBeNull()
    expect(root.style.getPropertyValue('--preview-measure')).toBe('')
  })
})
