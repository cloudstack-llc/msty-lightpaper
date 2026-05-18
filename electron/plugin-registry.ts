import type { PluginRecord } from '../src/shared/types'

export function planSamplePluginRegistryRefresh(installed: PluginRecord[], samples: PluginRecord[]) {
  const sampleIds = new Set(samples.map((plugin) => plugin.id))
  const removeIds = installed
    .filter((plugin) => sampleIds.has(plugin.id) && (plugin.sample === true || plugin.builtin === true))
    .map((plugin) => plugin.id)
  const removed = new Set(removeIds)
  const refreshPlugins = samples.flatMap((sample) => {
    const existing = installed.find((plugin) => plugin.id === sample.id)
    if (!existing || removed.has(existing.id) || existing.installedPath !== sample.installedPath) return []
    return [{ ...sample, enabled: existing.enabled, sample: false }]
  })

  return { removeIds, refreshPlugins }
}
