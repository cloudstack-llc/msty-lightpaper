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
  "permissions": ["commands", "markdown", "metadata", "settings"],
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

Commands that declare the `settings` permission can also read and update app settings. This is how theme companion commands can switch layout modes or toggle theme flags without special-case core code.

```ts
api.commands.register('myTheme.focus', 'My Theme: Focus Layout', async (ctx) => {
  await ctx.updateSettings?.({ theme: 'my-reading-theme', layoutMode: 'focus' })
})
```

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

## Themes

Plugins can contribute theme options through `contributes.themes`. Enabled installed plugins expose those themes in the toolbar selector and the settings theme gallery. A theme contribution declares a stable `id`, display `label`, optional supported `modes`, optional inspiration/description metadata, and an optional `cssFile`.

```json
{
  "contributes": {
    "themes": [
      {
        "id": "my-reading-theme",
        "label": "My Reading Theme",
        "modes": ["dark", "light"],
        "cssFile": "themes.css",
        "description": "A focused reading and editing treatment.",
        "layoutModes": [
          { "id": "focus", "label": "Focus", "description": "Hide nonessential chrome." }
        ],
        "settings": [
          {
            "id": "lineWidth",
            "label": "Line width",
            "type": "select",
            "defaultValue": "68ch",
            "cssVariable": "--preview-measure",
            "options": [
              { "value": "58ch", "label": "Narrow" },
              { "value": "68ch", "label": "Normal" },
              { "value": "92ch", "label": "Wide" }
            ]
          },
          {
            "id": "hideBorders",
            "label": "Hide borders",
            "type": "toggle",
            "defaultValue": false,
            "dataAttribute": "lp-hide-borders"
          }
        ],
        "previewClasses": [
          { "id": "cards", "label": "Cards" },
          { "id": "img-grid", "label": "Image grid" }
        ]
      }
    ]
  }
}
```

Theme CSS must be scoped to the theme class the app applies to `<html>`:

```css
.theme-my-reading-theme {
  --background: 220 18% 8%;
  --foreground: 210 22% 92%;
  --primary: 263 88% 68%;
  --preview-measure: 68ch;
}

.theme-my-reading-theme .prose-lightpaper h1 {
  font-family: Literata, Georgia, ui-serif, serif;
}

.theme-my-reading-theme[data-lp-layout="focus"] [data-lp-slot="sidebar"] {
  width: 0;
  opacity: 0;
  pointer-events: none;
}
```

The current loader is deliberately allowlisted: bundled samples can ship CSS assets through [plugin-theme-assets.ts](/Users/ashokgelal/Projects/lightpaper/src/lib/plugin-theme-assets.ts), and the renderer mounts those assets only for enabled plugin theme registrations. Arbitrary third-party CSS files are not loaded until disk plugin loading has a reviewed CSS boundary.

Theme CSS can target stable app slots such as `data-lp-slot="toolbar"`, `data-lp-slot="sidebar"`, `data-lp-slot="editor-stage"`, `data-lp-slot="right-dock"`, and `data-lp-slot="bottom-dock"`. Runtime layout and theme settings are reflected on `<html>` as `data-lp-layout` plus any declared `dataAttribute` settings.

Notes can opt into helper layouts through frontmatter:

```yaml
---
cssClasses: [cards, cards-cols-3, table-wide, row-alt]
---
```

Those classes are sanitized and applied to the preview root. Built-in helpers include cards, list cards, card media ratios, cover images, image grids, `#invert`/`#circle`/`#outline` image filters, wide/max/full-width tables/images/iframes, table density, row/column striping, tabular numbers, and alternate task states such as `- [/]`, `- [>]`, `- [?]`, and `- [!]`.

## Metadata

Metadata is namespaced by plugin id. Two plugins can use the same document path and key without overwriting each other.

```ts
await api.metadata.set('/notes/a.md', 'audit', { score: 92 })
const audit = await api.metadata.get('/notes/a.md', 'audit')
```

Declare the `metadata` permission before using this API.

## Panels

Panels are registered as descriptors and mounted into semantic workspace docks. Right panels appear in `data-lp-slot="right-dock"` and bottom panels appear in `data-lp-slot="bottom-dock"`.

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
