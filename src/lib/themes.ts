import type { AppSettings, ThemeContribution, ThemeId, ThemeSettingContribution, ThemeSettingValue } from '@shared/types'

export type ThemeOption = ThemeContribution & {
  source: 'builtin' | 'plugin'
  pluginId?: string
  pluginName?: string
}

export const builtinThemes: ThemeOption[] = [
  { id: 'obsidian', label: 'Obsidian', source: 'builtin', description: 'Default dark workspace' },
  { id: 'paper', label: 'Paper', source: 'builtin', description: 'Warm document workspace' },
  { id: 'midnight', label: 'Midnight', source: 'builtin', description: 'High-contrast dark workspace' },
  { id: 'solar', label: 'Solar', source: 'builtin', description: 'Bright solarized workspace' },
  { id: 'forest', label: 'Forest', source: 'builtin', description: 'Low-light green workspace' },
]

export function safeThemeClassSuffix(theme: string | undefined) {
  return (theme || 'obsidian').replace(/[^A-Za-z0-9_-]/g, '-')
}

export function themeClassName(theme: ThemeId | string | undefined) {
  return `theme-${safeThemeClassSuffix(theme)}`
}

export function themeOptions(pluginThemes: Array<ThemeContribution & { pluginId: string; pluginName: string }>): ThemeOption[] {
  return [
    ...builtinThemes,
    ...pluginThemes.map((theme) => ({ ...theme, source: 'plugin' as const })),
  ]
}

export function findThemeOption(themeId: string | undefined, options: ThemeOption[]) {
  return options.find((theme) => theme.id === themeId) ?? builtinThemes[0]
}

export function themeSettingValue(settings: AppSettings, theme: ThemeContribution, setting: ThemeSettingContribution): ThemeSettingValue {
  return settings.themeSettings?.[theme.id]?.[setting.id] ?? setting.defaultValue
}

function splitRuntimeList(value: string | undefined) {
  return value?.split(' ').map((item) => item.trim()).filter(Boolean) ?? []
}

function removeThemeRuntimeAttributes(root: HTMLElement, options: ThemeOption[]) {
  const dataAttributes = new Set([
    ...splitRuntimeList(root.dataset.lpRuntimeThemeAttributes),
    ...options.flatMap((theme) => theme.settings?.map((setting) => setting.dataAttribute ? `data-${setting.dataAttribute}` : undefined).filter((item): item is string => Boolean(item)) ?? []),
  ])
  for (const attribute of root.getAttributeNames()) {
    if (attribute.startsWith('data-lp-theme-') || attribute.startsWith('data-lp-colorful-') || attribute.startsWith('data-lp-hide-')) dataAttributes.add(attribute)
  }
  for (const attribute of dataAttributes) root.removeAttribute(attribute)

  const cssVariables = new Set([
    ...splitRuntimeList(root.dataset.lpRuntimeThemeVariables),
    ...options.flatMap((theme) => theme.settings?.map((setting) => setting.cssVariable).filter((item): item is string => Boolean(item)) ?? []),
  ])
  for (const variable of cssVariables) root.style.removeProperty(variable)
}

export function applyThemeRuntime(root: HTMLElement, settings: AppSettings, options: ThemeOption[]) {
  const theme = findThemeOption(settings.theme, options)
  root.className = `${themeClassName(settings.theme)} dark`
  root.dataset.editorFont = settings.fontFamily
  root.dataset.lpTheme = safeThemeClassSuffix(settings.theme)
  root.dataset.lpLayout = safeThemeClassSuffix(settings.layoutMode || 'standard')
  root.dataset.lpEditorMode = settings.editorMode

  removeThemeRuntimeAttributes(root, options)

  const appliedDataAttributes = new Set<string>()
  const appliedCssVariables = new Set<string>()
  for (const setting of theme.settings ?? []) {
    const value = themeSettingValue(settings, theme, setting)
    if (setting.cssVariable) {
      root.style.setProperty(setting.cssVariable, String(value))
      appliedCssVariables.add(setting.cssVariable)
    }
    if (setting.dataAttribute) {
      const attribute = `data-${setting.dataAttribute}`
      root.setAttribute(attribute, String(value))
      appliedDataAttributes.add(attribute)
    }
  }

  root.dataset.lpRuntimeThemeAttributes = [...appliedDataAttributes].join(' ')
  root.dataset.lpRuntimeThemeVariables = [...appliedCssVariables].join(' ')
}
