import { describe, expect, it } from 'vitest'
import type { PluginRecord } from '../src/shared/types'
import { planSamplePluginRegistryRefresh } from './plugin-registry'

function plugin(overrides: Partial<PluginRecord>): PluginRecord {
  return {
    id: 'lightpaper.sample',
    name: 'Sample',
    version: '0.1.0',
    description: 'Sample plugin',
    permissions: ['commands'],
    enabled: false,
    installedPath: 'plugins/samples/sample',
    ...overrides,
  }
}

describe('sample plugin registry refresh', () => {
  it('refreshes installed sample manifests while preserving enabled state', () => {
    const installed = plugin({
      enabled: true,
      contributes: { commands: [{ id: 'old.command', title: 'Old' }] },
      sample: false,
    })
    const sample = plugin({
      contributes: { commands: [{ id: 'new.command', title: 'New' }] },
      sample: true,
    })

    const plan = planSamplePluginRegistryRefresh([installed], [sample])

    expect(plan.removeIds).toEqual([])
    expect(plan.refreshPlugins).toEqual([{ ...sample, enabled: true, sample: false }])
  })

  it('removes legacy seeded rows instead of installing samples implicitly', () => {
    const legacy = plugin({ enabled: true, sample: true })
    const notInstalled = plugin({ id: 'lightpaper.other', installedPath: 'plugins/samples/other', sample: true })

    const plan = planSamplePluginRegistryRefresh([legacy], [legacy, notInstalled])

    expect(plan.removeIds).toEqual(['lightpaper.sample'])
    expect(plan.refreshPlugins).toEqual([])
  })
})
