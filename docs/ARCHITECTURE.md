# LightPaper Architecture

LightPaper is a local-first Markdown workbench with an extension host at the center. The app is still early, so the architecture favors explicit contracts, pure services, and contract tests over compatibility with the first prototype.

## Runtime Shape

```text
Electron main
  - workspace and file access
  - settings and plugin registry persistence
  - offline AI fallback

Preload bridge
  - narrow `window.lightpaper` API
  - no renderer Node access

React renderer
  - editor shell
  - CodeMirror editor
  - unified Markdown preview
  - plugin host and plugin-contributed commands, AI presets, model providers, panels, Markdown hooks
```

The renderer owns plugin activation for bundled/sample plugins. Electron persists plugin records and protects local file boundaries, but plugin modules are regular TypeScript modules that can be tested without Electron.

## Plugin Host

The host lives in [plugin-host.ts](/Users/ashokgelal/Projects/lightpaper/src/lib/plugin-host.ts). It is a pure TypeScript service with these responsibilities:

- Validate manifests before activation.
- Enforce declared permissions at registration time.
- Register commands, AI presets, model-provider catalogs, Markdown extensions, metadata access, and panels.
- Track all contributions by plugin id.
- Cleanly reset contributions before reactivation.
- Record activation errors without crashing the app.

The renderer singleton in [plugin-runtime.ts](/Users/ashokgelal/Projects/lightpaper/src/lib/plugin-runtime.ts) wraps the host for the app store. Tests can instantiate `PluginHost` directly and inject fake modules or fake metadata stores.

## Manifest Contract

Every plugin is manifest-first:

```json
{
  "id": "lightpaper.example",
  "name": "Example",
  "version": "1.0.0",
  "description": "Adds example Markdown workflows.",
  "main": "index.ts",
  "permissions": ["commands", "markdown", "ai"],
  "contributes": {
    "commands": [
      { "id": "example.run", "title": "Run Example", "category": "Examples" }
    ],
    "markdown": [
      { "id": "example.syntax", "kind": "remark", "description": "Transforms example syntax." }
    ],
    "aiProviders": [
      { "id": "example.provider", "title": "Example Provider", "models": ["example-model"] }
    ]
  }
}
```

Manifests are checked by [plugin-manifest.ts](/Users/ashokgelal/Projects/lightpaper/src/lib/plugin-manifest.ts). A contribution must have the matching permission:

- `commands` for command contributions.
- `ai` for AI presets and model-provider catalogs.
- `markdown` for remark or rehype extensions.
- `ui` for panels.
- `metadata` for per-plugin document metadata.

## Plugin API

The public plugin API is defined in [plugin-api.ts](/Users/ashokgelal/Projects/lightpaper/src/shared/plugin-api.ts).

```ts
export async function activate(api: LightPaperPluginApi) {
  api.commands.register('example.insert', 'Insert Example', (ctx) => {
    return ctx.insertText('\nExample\n')
  })

  api.markdown.registerRemarkPlugin('example.syntax', remarkExampleSyntax)

  api.ai.registerPreset('example.rewrite', 'Rewrite Example', async (input) => {
    return { text: input.text.toUpperCase() }
  })

  api.ai.registerProvider({
    id: 'example.provider',
    name: 'Example Provider',
    baseUrl: 'https://models.example.com/v1',
    auth: { type: 'bearer', apiKeyRef: 'secret://providers/example/api-key' },
    models: [{
      id: 'example-model',
      providerId: 'example.provider',
      name: 'Example Model',
      family: 'example',
      contextWindow: 128000,
      capabilities: ['chat', 'markdown'],
      pricing: { inputPerMillion: 1, outputPerMillion: 2, currency: 'USD' }
    }]
  })
}
```

Registrations return disposables. The host also removes every contribution when it reactivates all plugins, so toggling plugins is deterministic.

## Model Providers

Model-provider plugins register selectable provider/model catalogs. The sample [Model Provider Catalog](/Users/ashokgelal/Projects/lightpaper/plugins/samples/model-provider-catalog/index.ts) includes OpenAI-style, Anthropic-style, Ollama/local, and custom OpenAI-compatible gateway profiles.

Provider records include provider id, display name, base URL, docs URL, auth shape, models, endpoints, context windows, capabilities, and pricing metadata. Raw API keys are not stored in sample plugin code. The current sample uses references such as `secret://providers/openai/api-key`; a production secret resolver can map those references to OS keychain or another secure store.

The AI panel exposes loaded models in a selector. When a model is selected, `runAiAction` enriches `AiActionInput` with the selected `provider` and `model`, so AI presets can use the chosen config.

## Markdown Pipeline

Markdown rendering lives in [markdown-pipeline.ts](/Users/ashokgelal/Projects/lightpaper/src/lib/markdown-pipeline.ts). LightPaper uses unified:

```text
source Markdown
  -> remark-parse
  -> remark-gfm
  -> remark-frontmatter
  -> remark-directive
  -> built-in LightPaper callout transform
  -> plugin remark extensions
  -> remark-rehype
  -> plugin rehype extensions
  -> rehype-slug
  -> rehype-highlight
  -> rehype-sanitize
  -> LightPaper link policy
  -> rehype-stringify
```

Plugins get two normal extension layers:

- Remark plugins operate on Markdown AST, which is best for semantics like backlinks, frontmatter, outlines, linting, and AI section extraction.
- Rehype plugins operate on HTML AST, which is best for preview output, anchors, code blocks, and safe rendered decorations.

The sanitizer allows LightPaper-owned classes such as `callout`, `callout-note`, `markdown-link`, and `wiki-link`, plus the `lightpaper://wiki/...` protocol used by wiki-link preview output.

## App State

The Zustand store in [app-store.ts](/Users/ashokgelal/Projects/lightpaper/src/store/app-store.ts) is the renderer orchestration layer:

- Hydrates workspaces, settings, installed plugins, and sample catalog from Electron.
- Activates enabled plugin records through the plugin runtime.
- Exposes active plugin commands, AI presets, and model-provider catalogs to panels.
- Routes plugin AI preset calls before falling back to Electron's offline AI stub and passes selected model/provider config into the action input.
- Keeps file content and saved content separate so dirty state is explicit.

The store still talks to `window.lightpaper`, but tests replace that bridge with a fake object.

## Styling Model

The UI is styled by stable tokens in [globals.css](/Users/ashokgelal/Projects/lightpaper/src/styles/globals.css):

- Theme tokens: `--background`, `--foreground`, `--card`, `--primary`, `--accent`, and semantic variants.
- Editor and preview tokens: `--editor-font-family`, `--preview-font-family`, `--preview-measure`, `--preview-leading`.
- Markdown output classes: `markdown-link`, `wiki-link`, `callout`, `callout-note`, `callout-tip`, `callout-warning`, `callout-danger`, `callout-ai`.

Plugins should prefer existing classes and data attributes over inline styles. Theme plugins can be added as a later extension point by registering CSS assets from the manifest.

## Testing Strategy

LightPaper uses Vitest with jsdom.

```bash
npm run typecheck
npm test
```

Current coverage focuses on the architecture boundaries:

- Plugin host contract tests: activation, cleanup, permissions, duplicate ids, metadata isolation, Markdown extension registration, and model-provider registration.
- Markdown pipeline tests: GFM, callouts, sanitization, external link policy, plugin remark extensions.
- Sample plugin tests: every sample manifest validates, every sample activates, and pure helper behavior is deterministic.
- Store integration tests: hydration registers plugin commands and AI presets, commands mutate documents, plugin AI presets take priority over the Electron fallback, and selected model config reaches AI actions.

New plugins should add pure helper tests and at least one host activation test.
