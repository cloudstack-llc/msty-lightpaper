import { describe, expect, it, vi } from 'vitest'
import { PluginHost } from './plugin-host'
import { compileExternalPluginModule } from './external-plugin-loader'

describe('external plugin loader', () => {
  it('compiles CommonJS-style local plugin modules into host modules', async () => {
    const module = compileExternalPluginModule({
      pluginId: 'local.example',
      mainCode: 'exports.activate = function(api) { api.commands.register("local.hello", "Local Hello", function(ctx) { return ctx.insertText("hello") }) }',
    })
    const host = new PluginHost({ modules: { 'local.example': module } })
    const insertText = vi.fn()

    await host.activatePlugins([{
      id: 'local.example',
      name: 'Local Example',
      version: '0.1.0',
      description: 'Local plugin',
      permissions: ['commands'],
      enabled: true,
      external: true,
      contributes: { commands: [{ id: 'local.hello', title: 'Local Hello' }] },
    }])
    await host.executeCommand('local.hello', { replaceSelection: vi.fn(), insertText, showToast: vi.fn() })

    expect(insertText).toHaveBeenCalledWith('hello')
  })

  it('turns load errors into activation errors', async () => {
    const module = compileExternalPluginModule({ pluginId: 'local.bad', error: 'Cannot read main.js' })
    const host = new PluginHost({ modules: { 'local.bad': module } })

    await host.activatePlugins([{
      id: 'local.bad',
      name: 'Bad',
      version: '0.1.0',
      description: 'Bad plugin',
      permissions: [],
      enabled: true,
      external: true,
    }])

    expect(host.errors[0]?.message).toContain('Cannot read main.js')
  })
})
