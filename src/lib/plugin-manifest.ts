import type { PluginManifest, PluginPermission, PluginRecord } from '@shared/types'

const knownPermissions = new Set<PluginPermission>(['filesystem', 'ai', 'markdown', 'ui', 'metadata', 'commands', 'settings'])

export type PluginManifestIssue = {
  path: string
  message: string
}

export type PluginManifestValidation = {
  ok: boolean
  issues: PluginManifestIssue[]
}

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function isSafeRelativeCssFile(value: string) {
  return value.endsWith('.css') && !value.startsWith('/') && !value.includes('\\') && value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..')
}

function isSafeDataAttribute(value: string) {
  return /^[a-z][a-z0-9-]*$/.test(value)
}

function isSafeCssVariable(value: string) {
  return /^--[A-Za-z0-9_-]+$/.test(value)
}

function pushDuplicateIssues(issues: PluginManifestIssue[], path: string, ids: string[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) issues.push({ path, message: `Duplicate contribution id "${id}"` })
    seen.add(id)
  }
}

function hasPermission(manifest: PluginManifest, permission: PluginPermission) {
  return manifest.permissions.includes(permission)
}

export function validatePluginManifest(manifest: PluginManifest): PluginManifestValidation {
  const issues: PluginManifestIssue[] = []

  if (!isNonEmptyString(manifest.id)) issues.push({ path: 'id', message: 'Plugin id is required' })
  if (!isNonEmptyString(manifest.name)) issues.push({ path: 'name', message: 'Plugin name is required' })
  if (!isNonEmptyString(manifest.version)) issues.push({ path: 'version', message: 'Plugin version is required' })
  if (!Array.isArray(manifest.permissions)) issues.push({ path: 'permissions', message: 'Permissions must be an array' })

  for (const permission of manifest.permissions ?? []) {
    if (!knownPermissions.has(permission)) issues.push({ path: 'permissions', message: `Unknown permission "${permission}"` })
  }

  const contributions = manifest.contributes
  if (contributions?.commands?.length && !hasPermission(manifest, 'commands')) {
    issues.push({ path: 'contributes.commands', message: 'Command contributions require the commands permission' })
  }
  if (contributions?.aiPresets?.length && !hasPermission(manifest, 'ai')) {
    issues.push({ path: 'contributes.aiPresets', message: 'AI preset contributions require the ai permission' })
  }
  if (contributions?.aiProviders?.length && !hasPermission(manifest, 'ai')) {
    issues.push({ path: 'contributes.aiProviders', message: 'AI provider contributions require the ai permission' })
  }
  if ((contributions?.markdown?.length || contributions?.markdownIt?.length) && !hasPermission(manifest, 'markdown')) {
    issues.push({ path: 'contributes.markdown', message: 'Markdown contributions require the markdown permission' })
  }
  if (contributions?.panels?.length && !hasPermission(manifest, 'ui')) {
    issues.push({ path: 'contributes.panels', message: 'Panel contributions require the ui permission' })
  }

  pushDuplicateIssues(issues, 'contributes.commands', contributions?.commands?.map((item) => item.id) ?? [])
  pushDuplicateIssues(issues, 'contributes.markdown', contributions?.markdown?.map((item) => item.id) ?? [])
  pushDuplicateIssues(issues, 'contributes.aiPresets', contributions?.aiPresets?.map((item) => item.id) ?? [])
  pushDuplicateIssues(issues, 'contributes.aiProviders', contributions?.aiProviders?.map((item) => item.id) ?? [])
  pushDuplicateIssues(issues, 'contributes.panels', contributions?.panels?.map((item) => item.id) ?? [])
  pushDuplicateIssues(issues, 'contributes.themes', contributions?.themes?.map((item) => item.id) ?? [])

  for (const [index, theme] of contributions?.themes?.entries() ?? []) {
    if (!isNonEmptyString(theme.id)) issues.push({ path: `contributes.themes.${index}.id`, message: 'Theme id is required' })
    if (!isNonEmptyString(theme.label)) issues.push({ path: `contributes.themes.${index}.label`, message: 'Theme label is required' })
    if (theme.cssFile && !isSafeRelativeCssFile(theme.cssFile)) {
      issues.push({ path: `contributes.themes.${index}.cssFile`, message: 'Theme cssFile must be a relative .css file path' })
    }
    pushDuplicateIssues(issues, `contributes.themes.${index}.settings`, theme.settings?.map((item) => item.id) ?? [])
    pushDuplicateIssues(issues, `contributes.themes.${index}.layoutModes`, theme.layoutModes?.map((item) => item.id) ?? [])
    pushDuplicateIssues(issues, `contributes.themes.${index}.previewClasses`, theme.previewClasses?.map((item) => item.id) ?? [])

    for (const [settingIndex, setting] of theme.settings?.entries() ?? []) {
      if (!isNonEmptyString(setting.id)) issues.push({ path: `contributes.themes.${index}.settings.${settingIndex}.id`, message: 'Theme setting id is required' })
      if (!isNonEmptyString(setting.label)) issues.push({ path: `contributes.themes.${index}.settings.${settingIndex}.label`, message: 'Theme setting label is required' })
      if (!['toggle', 'select', 'range'].includes(setting.type)) issues.push({ path: `contributes.themes.${index}.settings.${settingIndex}.type`, message: 'Theme setting type is invalid' })
      if (setting.type === 'select' && !setting.options?.length) issues.push({ path: `contributes.themes.${index}.settings.${settingIndex}.options`, message: 'Select theme settings require options' })
      if (setting.cssVariable && !isSafeCssVariable(setting.cssVariable)) issues.push({ path: `contributes.themes.${index}.settings.${settingIndex}.cssVariable`, message: 'Theme setting cssVariable must be a CSS custom property' })
      if (setting.dataAttribute && !isSafeDataAttribute(setting.dataAttribute)) issues.push({ path: `contributes.themes.${index}.settings.${settingIndex}.dataAttribute`, message: 'Theme setting dataAttribute must be a safe data-* suffix' })
    }
    for (const [modeIndex, mode] of theme.layoutModes?.entries() ?? []) {
      if (!isNonEmptyString(mode.id)) issues.push({ path: `contributes.themes.${index}.layoutModes.${modeIndex}.id`, message: 'Theme layout mode id is required' })
      if (!isNonEmptyString(mode.label)) issues.push({ path: `contributes.themes.${index}.layoutModes.${modeIndex}.label`, message: 'Theme layout mode label is required' })
    }
    for (const [classIndex, previewClass] of theme.previewClasses?.entries() ?? []) {
      if (!isNonEmptyString(previewClass.id)) issues.push({ path: `contributes.themes.${index}.previewClasses.${classIndex}.id`, message: 'Theme preview class id is required' })
      if (!isNonEmptyString(previewClass.label)) issues.push({ path: `contributes.themes.${index}.previewClasses.${classIndex}.label`, message: 'Theme preview class label is required' })
    }
  }

  return { ok: issues.length === 0, issues }
}

export function describePlugin(plugin: PluginRecord) {
  return `${plugin.name} (${plugin.id}@${plugin.version})`
}
