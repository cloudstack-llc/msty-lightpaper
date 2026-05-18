import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readExternalPluginBundle, readLocalPluginPackage } from './local-plugin-loader'

const roots: string[] = []

function createPackage(files: Record<string, string>) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'lightpaper-plugin-'))
  roots.push(root)
  for (const [name, content] of Object.entries(files)) writeFileSync(path.join(root, name), content)
  return root
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('local plugin loader', () => {
  it('reads a local plugin package and runtime bundle from disk', () => {
    const root = createPackage({
      'plugin.json': JSON.stringify({
        id: 'local.example',
        name: 'Local Example',
        version: '0.1.0',
        description: 'Local plugin',
        main: 'main.js',
        permissions: ['commands'],
        contributes: {
          commands: [{ id: 'local.hello', title: 'Local Hello' }],
          themes: [{ id: 'local-theme', label: 'Local Theme', cssFile: 'theme.css' }],
        },
      }),
      'main.js': 'exports.activate = function(api) { api.commands.register("local.hello", "Local Hello", function(ctx) { ctx.insertText("hello") }) }',
      'theme.css': '.theme-local-theme { --background: 0 0% 0%; }',
    })

    const plugin = readLocalPluginPackage(root)
    const bundle = readExternalPluginBundle(plugin)

    expect(plugin).toMatchObject({ id: 'local.example', enabled: false, external: true, installedPath: root })
    expect(bundle.mainCode).toContain('exports.activate')
    expect(bundle.cssAssets?.[0]).toMatchObject({ key: 'local.example:theme.css', cssFile: 'theme.css' })
  })

  it('rejects packages with invalid main paths', () => {
    const root = createPackage({
      'plugin.json': JSON.stringify({
        id: 'local.bad',
        name: 'Bad',
        version: '0.1.0',
        description: 'Bad plugin',
        main: '../outside.js',
        permissions: ['commands'],
      }),
    })

    expect(() => readLocalPluginPackage(root)).toThrow('Plugin main must be a relative')
  })
})
