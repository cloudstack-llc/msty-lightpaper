# Plugin Authoring Guide

This guide documents the testable plugin surface for LightPaper.

## File Layout

A plugin package should contain:

```text
plugins/samples/my-plugin/
  plugin.json
  index.ts
  README.md
  index.test.ts
```

Bundled samples are added to [bundled-plugins.ts](/Users/ashokgelal/Projects/lightpaper/electron/bundled-plugins.ts) and [bundled-plugin-modules.ts](/Users/ashokgelal/Projects/lightpaper/src/lib/bundled-plugin-modules.ts). External disk loading is intentionally left behind this seam so the host can stay testable.

## Manifest

Use a stable reverse-DNS-style id and declare only the capabilities your plugin needs.

```json
{
  "id": "lightpaper.my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "description": "Adds a focused Markdown workflow.",
  "author": "You",
  "main": "index.ts",
  "permissions": ["commands", "markdown", "metadata"],
  "contributes": {
    "commands": [
      { "id": "myPlugin.run", "title": "Run My Plugin", "category": "My Plugin" }
    ],
    "markdown": [
      { "id": "myPlugin.syntax", "kind": "remark", "description": "Transforms custom syntax." }
    ]
  }
}
```

The host validates that every contribution has its matching permission.

## Commands

Commands receive a document context and can mutate content through explicit methods.

```ts
export async function activate(api: LightPaperPluginApi) {
  api.commands.register('myPlugin.insert', 'Insert Template', async (ctx) => {
    await ctx.insertText('\n## Template\n\n- \n')
    ctx.showToast('Template inserted')
  })
}
```

Prefer pure helpers for transformations:

```ts
export function normalizeText(input: string) {
  return input.replace(/\s+$/gm, '')
}
```

Then the command only adapts app context to that helper.

## Markdown Extensions

Use remark for Markdown semantics:

```ts
import { visit } from 'unist-util-visit'

export function remarkMySyntax() {
  return (tree: unknown) => {
    visit(tree as any, 'text', (node: any) => {
      node.value = String(node.value).replaceAll('LP:', 'LightPaper:')
    })
  }
}

export async function activate(api: LightPaperPluginApi) {
  api.markdown.registerRemarkPlugin('myPlugin.syntax', remarkMySyntax)
}
```

Use rehype for rendered HTML semantics:

```ts
export function rehypePreviewClass() {
  return (tree: unknown) => {
    // Transform hast nodes here.
  }
}

export async function activate(api: LightPaperPluginApi) {
  api.markdown.registerRehypePlugin('myPlugin.preview', rehypePreviewClass)
}
```

Do not emit unsafe HTML. The core pipeline sanitizes preview output.

## AI Presets

AI presets are deterministic handlers from input to output. Provider plugins can call a remote model later, but sample plugins should stay offline and testable.

```ts
export async function activate(api: LightPaperPluginApi) {
  api.ai.registerPreset('myPlugin.title', 'Generate Title', async (input) => {
    const firstLine = input.text.split('\n')[0] || 'Untitled'
    return { text: `# ${firstLine.replace(/^#\s*/, '')}` }
  })
}
```

The app routes plugin presets before using the Electron fallback.

## Model Providers

Provider plugins register model configs that AI workflows can select. Store secret references, not raw API keys.

```ts
export async function activate(api: LightPaperPluginApi) {
  api.ai.registerProvider({
    id: 'myProvider.openaiCompatible',
    name: 'My OpenAI-compatible Gateway',
    baseUrl: 'https://gateway.example.com/v1',
    auth: {
      type: 'bearer',
      apiKeyRef: 'secret://providers/my-provider/api-key',
      envVar: 'MY_PROVIDER_API_KEY'
    },
    models: [{
      id: 'my-provider-default',
      providerId: 'myProvider.openaiCompatible',
      name: 'Default Gateway Model',
      family: 'custom',
      endpoint: '/responses',
      contextWindow: 128000,
      capabilities: ['chat', 'markdown', 'json', 'streaming'],
      pricing: { inputPerMillion: 1, outputPerMillion: 3, currency: 'USD' }
    }]
  })
}
```

When a user selects a loaded model in the AI panel, `AiActionInput` includes `input.provider` and `input.model`. Preset handlers should use those values to choose an endpoint or show which model would be used. The sample provider catalog uses `apiKeyRef` values such as `secret://providers/openai/api-key`; resolving those references to real keys belongs only in Electron AI execution, not plugin source code or renderer state. See `docs/SECRET_VAULT.md` for the vault format and no-recovery behavior.

## Metadata

Metadata is namespaced by plugin id. Two plugins can use the same document path and key without overwriting each other.

```ts
await api.metadata.set('/notes/a.md', 'audit', { score: 92 })
const audit = await api.metadata.get('/notes/a.md', 'audit')
```

Declare the `metadata` permission before using this API.

## Panels

Panels are registered as descriptors. The current renderer lists panel contributions and keeps the host contract ready for real mounting.

```ts
api.ui.registerPanel('myPlugin.panel', 'My Panel', () => {
  const element = document.createElement('section')
  element.textContent = 'Panel content'
  return element
})
```

Declare `ui` permission and add the panel to the manifest.

## Testing Checklist

Every plugin should have:

- Manifest validation test.
- Activation test through `PluginHost`.
- Pure helper tests for transforms, audits, or templates.
- Markdown rendering test if it registers remark or rehype extensions.
- Model-provider registration test if it registers providers.
- Command test using fake `insertText`, `replaceSelection`, and `showToast` functions.

Example:

```ts
import { describe, expect, it, vi } from 'vitest'
import { PluginHost } from '../../../src/lib/plugin-host'
import * as module from './index'

it('activates and runs the command', async () => {
  const host = new PluginHost({ modules: { 'lightpaper.my-plugin': module } })
  const insertText = vi.fn()

  await host.activatePlugins([manifestRecord])
  await host.executeCommand('myPlugin.insert', {
    insertText,
    replaceSelection: vi.fn(),
    showToast: vi.fn(),
  })

  expect(insertText).toHaveBeenCalled()
})
```
