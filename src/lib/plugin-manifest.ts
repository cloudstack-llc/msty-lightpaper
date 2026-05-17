import type { PluginManifest, PluginPermission, PluginRecord } from '@shared/types'

const knownPermissions = new Set<PluginPermission>(['filesystem', 'ai', 'markdown', 'ui', 'metadata', 'commands'])

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

  return { ok: issues.length === 0, issues }
}

export function describePlugin(plugin: PluginRecord) {
  return `${plugin.name} (${plugin.id}@${plugin.version})`
}
